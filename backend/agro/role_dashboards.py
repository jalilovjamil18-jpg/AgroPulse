"""Qorako‘l pilot: scoped, role-specific live observations (never synthetic values).

An instantaneous flow reading in l/s MUST NOT be treated as measured volume in m³.
Date filters use the configured local time zone. No map coordinates are guessed.
"""
from collections import defaultdict
from datetime import datetime, time, timedelta
from decimal import Decimal

from django.utils import timezone
from rest_framework.decorators import api_view
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from .models import Profile, Alert
from .security import (role_for, authorized_areas, authorized_canals,
                       authorized_fields, authorized_stations, authorized_readings,
                       authorized_alerts)

MAX_DAYS = 180


def period(request):
    today = timezone.localdate()
    end_text = request.query_params.get('to', today.isoformat())
    start_text = request.query_params.get('from', (today - timedelta(days=29)).isoformat())
    try:
        first, last = (datetime.strptime(value, '%Y-%m-%d').date()
                       for value in (start_text, end_text))
    except ValueError:
        raise ValidationError({'date': 'Sana YYYY-MM-DD shaklida bo‘lishi kerak.'})
    if first > last or (last - first).days >= MAX_DAYS or last > today:
        raise ValidationError({'date': 'Davr noto‘g‘ri: 1–180 kun, kelajakdagi kunlarsiz.'})
    tz = timezone.get_current_timezone()
    start = timezone.make_aware(datetime.combine(first, time.min), tz)
    stop = timezone.make_aware(datetime.combine(last + timedelta(days=1), time.min), tz)
    return first, last, start, stop


def reading_preview(r):
    if not r:
        return None
    return {'station_id': r.station_id, 'station_code': r.station.code,
            'recorded_at': r.recorded_at, 'flow_lps': str(r.flow_lps),
            'level_cm': str(r.level_cm) if r.level_cm is not None else None,
            'source': r.source}


@api_view(['GET'])
def role_overview(request):
    """Three different dashboards, scoped by user and district/canal/field.

    The average flow is an average of observed instantaneous samples, NOT consumed water.
    """
    user = request.user
    role = role_for(user)
    first, last, start, stop = period(request)
    accessible_canals = authorized_canals(user)
    accessible_fields = authorized_fields(user)
    accessible_stations = authorized_stations(user)
    accessible_areas = authorized_areas(user)
    accessible_alerts = authorized_alerts(user)
    # A bounded pilot-period sample prevents an unbounded payload and biased claims.
    # Explicit truncation flag warns the user when there are more records.
    scoped_readings = (authorized_readings(user)
                       .filter(recorded_at__gte=start, recorded_at__lt=stop)
                       .select_related('station', 'station__canal')
                       .order_by('-recorded_at', '-id'))
    sample = list(scoped_readings[:10001])
    truncated = len(sample) > 10000
    if truncated:
        sample = sample[:10000]
    latest_by_station = {}
    daily = defaultdict(lambda: {'n': 0, 'total': Decimal('0')})
    canal_stat = defaultdict(lambda: {'samples': 0, 'latest': None})
    for r in sample:
        latest_by_station.setdefault(r.station_id, r)
        d = timezone.localtime(r.recorded_at).date().isoformat()
        daily[d]['n'] += 1
        daily[d]['total'] += r.flow_lps
        canal_stat[r.station.canal_id]['samples'] += 1
        old = canal_stat[r.station.canal_id]['latest']
        if old is None or r.recorded_at > old.recorded_at:
            canal_stat[r.station.canal_id]['latest'] = r

    series = [{'day': day, 'samples': values['n'],
               'mean_observed_flow_lps': str((values['total'] / values['n']).quantize(Decimal('0.001')))}
              for day, values in sorted(daily.items())]
    latest = [reading_preview(r) for r in latest_by_station.values()]
    latest.sort(key=lambda r: r['recorded_at'], reverse=True)
    station_health = []
    for st in accessible_stations.select_related('canal').order_by('code')[:500]:
        r = latest_by_station.get(st.id)
        station_health.append({'id': st.id, 'code': st.code,
                               'canal_id': st.canal_id, 'canal': st.canal.name,
                               'enabled': st.is_enabled,
                               'latest_in_period': reading_preview(r)})
    base = {
        'role': role,
        'period': {'from': first.isoformat(), 'to': last.isoformat(), 'max_days': MAX_DAYS},
        'data_kind': 'measured_samples_only', 'demo': False,
        'truncated': truncated,
        'notice': 'O‘rtacha l/s = davrdagi qaydlar o‘rtachasi, umumiy m³ hajm emas. O‘lchov bo‘lmasa — ko‘rsatilmaydi.',
        'observations': {'samples': len(sample), 'stations_with_samples': len(latest_by_station),
                         'stations_total': accessible_stations.count(), 'latest_per_station': latest[:500],
                         'daily_observed_flow': series},
    }
    if role == Profile.FARMER:
        base['farmer'] = {
            'fields': [{'id': f.id, 'name': f.name, 'crop': f.crop,
                        'area_ha': str(f.area_ha), 'canal_id': f.canal_id,
                        'area_id': f.area_id} for f in accessible_fields.order_by('name')[:500]],
            'field_count': accessible_fields.count(),
            'assigned_canals_count': accessible_canals.count(),
            'message': 'Sug‘orish navbatlari alohida kiritilmagan; bu raqamlar aniq berilgan o‘lchovlar asosida.'
        }
    elif role == Profile.IRRIGATION:
        base['irrigation'] = {
            'canals': [{'id': c.id, 'code': c.code, 'name': c.name,
                        'station_count': sum(s['canal_id'] == c.id for s in station_health),
                        'observations_in_period': canal_stat[c.id]['samples'],
                        'latest_in_period': reading_preview(canal_stat[c.id]['latest'])}
                       for c in accessible_canals.order_by('name')[:500]],
            'stations': station_health,
            'open_alerts': [{'id': a.id, 'title': a.title, 'canal_id': a.canal_id,
                             'created_at': a.created_at} for a in accessible_alerts.filter(status=Alert.OPEN)[:50]],
        }
    else:  # authority and superuser (admin)
        area_rows = []
        for a in accessible_areas.order_by('name')[:500]:
            in_area = accessible_canals.filter(area_id=a.id)
            area_rows.append({'id': a.id, 'name': a.name,
                              'canal_count': in_area.count(),
                              'station_count': accessible_stations.filter(canal__area_id=a.id).count(),
                              'field_count': accessible_fields.filter(area_id=a.id).count(),
                              'field_area_ha': str(sum((f.area_ha for f in accessible_fields.filter(area_id=a.id)), Decimal('0'))),
                              'latest_flow_lps': None})  # Not addable across stations as total volume
        canal_rows = [{'id': c.id, 'name': c.name, 'code': c.code,
                       'area_id': c.area_id,
                       'stations': accessible_stations.filter(canal_id=c.id).count(),
                       'samples_in_period': canal_stat[c.id]['samples'],
                       'latest_sample': reading_preview(canal_stat[c.id]['latest'])}
                      for c in accessible_canals.order_by('name')[:500]]
        base['authority'] = {
            'areas': area_rows,
            'canals': canal_rows,
            'open_alerts': [{'id': a.id, 'title': a.title, 'description': a.description,
                             'canal_id': a.canal_id, 'created_at': a.created_at}
                            for a in accessible_alerts.filter(status=Alert.OPEN)[:100]],
            'field_area_ha': str(sum((f.area_ha for f in accessible_fields), Decimal('0'))),
            'caveat': 'Maydonlar — bazaga kiritilgan yozuvlar. Tuman jami maydoni emas. Suv limiti yoki m³ hisoblanmagan.',
        }
    return Response(base)
