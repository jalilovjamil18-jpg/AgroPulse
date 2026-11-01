"""Authenticated, territory-scoped device-ingestion status.

This is *server receipt* status, not a physical sensor online/offline test.
The station has no last-device-ingest timestamp until a real device-key request is accepted.
"""
from datetime import timedelta

from django.db.models import Max, Q
from django.utils import timezone
from rest_framework.decorators import api_view
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from .models import Profile, Reading
from .security import authorized_stations, role_for


@api_view(['GET'])
def device_monitoring(request):
    role = role_for(request.user)
    if role not in (Profile.AUTHORITY, Profile.IRRIGATION, Profile.ADMIN):
        raise PermissionDenied('Qurilmalar monitoringi faqat vakolatli xodimlar uchun.')
    stations_qs = authorized_stations(request.user).select_related('canal').annotate(
        last_device_measurement=Max('readings__recorded_at',
                                    filter=Q(readings__source=Reading.DEVICE))
    ).order_by('code')
    now = timezone.now()
    cutoff = now - timedelta(hours=48)
    # Aggregate across all scoped stations, but return at most 500 detail rows.
    counts = {'unprovisioned': 0, 'awaiting_data': 0, 'recent_receipt': 0,
              'old_receipt': 0, 'disabled': 0}
    rows = []
    for station in stations_qs.iterator(chunk_size=200):
        if not station.is_enabled:
            state = 'disabled'
        elif not station.ingest_key_hash:
            state = 'unprovisioned'
        elif station.last_device_ingest_at is None:
            state = 'awaiting_data'
        elif station.last_device_ingest_at >= cutoff:
            state = 'recent_receipt'
        else:
            state = 'old_receipt'
        counts[state] += 1
        if len(rows) < 500:
            rows.append({
                'id': station.id, 'code': station.code, 'name': station.name,
                'canal_id': station.canal_id, 'canal': station.canal.name,
                'is_enabled': station.is_enabled, 'provisioned': bool(station.ingest_key_hash),
                'last_device_ingest_at': station.last_device_ingest_at,
                'last_device_measurement_at': station.last_device_measurement,
                'state': state,
            })
    total = sum(counts.values())
    return Response({
        'demo': False, 'role': role, 'checked_at': now, 'recent_threshold_hours': 48,
        'stations_total': total, 'listed_stations': len(rows), 'truncated': total > len(rows),
        'counts': counts, 'stations': rows,
        'notice': ('Oxirgi qabul vaqti serverning o‘lchovni qabul qilgan paytidir. '
                   '48 soatdan beri ma’lumot kelmasligi qurilma jismonan offline ekanligini isbotlamaydi.'),
    })
