"""Qorako‘l pilot monitoring completeness, scoped by logged-in user.

A 48h-old reading means 'no recent measurement'; it does NOT prove hardware is offline.
"""
from datetime import timedelta
from django.db.models import Max
from django.utils import timezone
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .security import authorized_canals, authorized_stations, authorized_areas, role_for


@api_view(['GET'])
def data_quality(request):
    now = timezone.now()
    cutoff = now - timedelta(hours=48)
    stations = list(authorized_stations(request.user).select_related('canal').annotate(
        last_seen=Max('readings__recorded_at')).order_by('code')[:500])
    results = []
    for st in stations:
        status = ('disabled' if not st.is_enabled else
                  'no_data' if st.last_seen is None else
                  'recent' if st.last_seen >= cutoff else 'stale')
        results.append({'code': st.code, 'name': st.name, 'canal': st.canal.name,
                        'canal_id': st.canal_id, 'is_enabled': st.is_enabled,
                        'last_reading_at': st.last_seen.isoformat() if st.last_seen else None,
                        'status': status})
    counts = {key: sum(s['status'] == key for s in results)
              for key in ('recent', 'stale', 'no_data', 'disabled')}
    assigned_canals = authorized_canals(request.user)
    missing_area = assigned_canals.filter(area__isnull=True).count()
    return Response({
        'demo': False, 'role': role_for(request.user),
        'checked_at': now.isoformat(), 'recent_threshold_hours': 48,
        'stations_total': authorized_stations(request.user).count(),
        'listed_stations': len(results), 'truncated': authorized_stations(request.user).count() > len(results),
        'counts': counts, 'canals_total': assigned_canals.count(),
        'canals_without_area': missing_area,
        'registered_areas': authorized_areas(request.user).count(),
        'stations': results,
        'notice': ('48 soatdan eski o‘lchov = ma’lumot eskirgan. '
                   'Bu qurilma offline degani emas. Sensor real holati aloqa protokoli bilan alohida tekshiriladi.'),
    })
