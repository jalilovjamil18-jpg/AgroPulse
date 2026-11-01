from .water_balance import monthly_balance,export_monthly_balance
from .device_monitoring import device_monitoring
from .data_quality import data_quality
from .role_dashboards import role_overview
from django.urls import path
from . import api
urlpatterns=[
 path('dashboard/water-balance/',monthly_balance), path('reports/water-balance.csv',export_monthly_balance),
 path('dashboard/devices/',device_monitoring), path('health/',api.health),path('auth/login/',api.login),path('auth/logout/',api.logout),path('auth/me/',api.me),
 path('dashboard/summary/',api.summary),path('dashboard/data-quality/',data_quality),path('dashboard/role/',role_overview),path('areas/',api.areas),path('canals/',api.canals),
 path('fields/',api.fields),path('stations/',api.stations),path('readings/',api.readings),
 path('alerts/',api.alerts),path('alerts/new/',api.create_alert),path('alerts/<int:pk>/resolve/',api.resolve_alert),path('reports/readings.csv',api.export_readings),
 path('devices/ingest/',api.ingest),
]
