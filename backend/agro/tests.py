from datetime import timedelta
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APIClient
from .models import District,Canal,Area,Profile,Field,Station,Reading
User=get_user_model()

class ApiIsolationTests(TestCase):
 def setUp(self):
  self.d1=District.objects.create(name='Qorako‘l',province='Buxoro');self.d2=District.objects.create(name='Other pilot',province='Buxoro')
  a1=Area.objects.create(district=self.d1,name='Zone A');a2=Area.objects.create(district=self.d2,name='Zone B')
  self.c1=Canal.objects.create(district=self.d1,area=a1,name='Canal A',code='C-A')
  self.c2=Canal.objects.create(district=self.d2,area=a2,name='Canal B',code='C-B')
  self.s1=Station.objects.create(canal=self.c1,name='Station A',code='S-A')
  self.s2=Station.objects.create(canal=self.c2,name='Station B',code='S-B')
  self.farmer=User.objects.create_user(username='farmer',password='safe-pass-123')
  self.farmer.agro_profile.district=self.d1;self.farmer.agro_profile.role=Profile.FARMER;self.farmer.agro_profile.save()
  self.irrigation=User.objects.create_user(username='operator',password='safe-pass-123')
  self.irrigation.agro_profile.district=self.d1;self.irrigation.agro_profile.role=Profile.IRRIGATION;self.irrigation.agro_profile.save()
  self.irrigation.agro_profile.assigned_canals.add(self.c1)
  self.authority=User.objects.create_user(username='authority',password='safe-pass-123')
  self.authority.agro_profile.district=self.d1;self.authority.agro_profile.role=Profile.AUTHORITY;self.authority.agro_profile.save()
  Field.objects.create(owner=self.farmer,district=self.d1,area=a1,canal=self.c1,name='Field A',area_ha=2)
  other=User.objects.create_user(username='another',password='safe-pass-123')
  Field.objects.create(owner=other,district=self.d2,area=a2,canal=self.c2,name='Field B',area_ha=5)
  self.r1=Reading.objects.create(station=self.s1,recorded_at=timezone.now()-timedelta(hours=1),flow_lps='14.5')
  self.r2=Reading.objects.create(station=self.s2,recorded_at=timezone.now()-timedelta(hours=1),flow_lps='99.9')
  self.client=APIClient()
 def test_no_public_data(self):
  for url in ('/api/v1/dashboard/summary/','/api/v1/fields/','/api/v1/readings/'):
   self.assertEqual(self.client.get(url).status_code,401)
 def test_farmer_scope_and_no_manual_writes(self):
  self.client.force_authenticate(self.farmer)
  self.assertEqual(len(self.client.get('/api/v1/fields/').data),1)
  self.assertEqual(len(self.client.get('/api/v1/readings/').data),1)
  response=self.client.post('/api/v1/readings/',{'station_id':self.s1.id,'recorded_at':timezone.now().isoformat(),'flow_lps':'1.2'},format='json')
  self.assertEqual(response.status_code,403)
 def test_irrigation_scope_and_write(self):
  self.client.force_authenticate(self.irrigation)
  self.assertEqual(len(self.client.get('/api/v1/stations/').data),1)
  response=self.client.post('/api/v1/readings/',{'station_id':self.s2.id,'recorded_at':timezone.now().isoformat(),'flow_lps':'1.2'},format='json')
  self.assertEqual(response.status_code,403)
  response=self.client.post('/api/v1/readings/',{'station_id':self.s1.id,'recorded_at':timezone.now().isoformat(),'flow_lps':'2.2'},format='json')
  self.assertEqual(response.status_code,201)
 def test_authority_read_only_and_district_scope(self):
  self.client.force_authenticate(self.authority)
  self.assertEqual(len(self.client.get('/api/v1/fields/').data),1)
  self.assertEqual(len(self.client.get('/api/v1/readings/').data),1)
  self.assertEqual(self.client.get('/api/v1/dashboard/summary/').data['counts']['canals'],1)
  self.assertEqual(self.client.post('/api/v1/readings/',{'station_id':self.s1.id,'recorded_at':timezone.now().isoformat(),'flow_lps':'1.2'},format='json').status_code,403)
 def test_login_and_logout(self):
  res=self.client.post('/api/v1/auth/login/',{'username':'farmer','password':'safe-pass-123'},format='json')
  self.assertEqual(res.status_code,200)
  self.client.credentials(HTTP_AUTHORIZATION='Token '+res.data['token'])
  self.assertEqual(self.client.get('/api/v1/auth/me/').status_code,200)
  self.assertEqual(self.client.post('/api/v1/auth/logout/').status_code,200)
  self.assertEqual(self.client.get('/api/v1/auth/me/').status_code,401)
 def test_device_key_rejects_bad_key(self):
  self.assertEqual(self.client.post('/api/v1/devices/ingest/',{'station_id':self.s1.id,'recorded_at':timezone.now().isoformat(),'flow_lps':'1.2'},format='json').status_code,403)

class RoleDashboardTests(ApiIsolationTests):
    """Pilot visibility, period filtering, and data provenance regression tests."""

    def test_authority_dashboard_lists_only_its_areas_and_canals(self):
        self.client.force_authenticate(self.authority)
        response = self.client.get('/api/v1/dashboard/role/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['role'], Profile.AUTHORITY)
        self.assertEqual([c['code'] for c in response.data['authority']['canals']], ['C-A'])
        self.assertEqual([a['name'] for a in response.data['authority']['areas']], ['Zone A'])
        self.assertFalse(response.data['demo'])
        # No volume is fabricated from point flow observations.
        self.assertNotIn('water_volume_m3', response.data)
        self.assertIsNone(response.data['authority']['areas'][0]['latest_flow_lps'])

    def test_irrigation_sees_assigned_stations_not_other_district(self):
        self.client.force_authenticate(self.irrigation)
        response = self.client.get('/api/v1/dashboard/role/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['role'], Profile.IRRIGATION)
        self.assertEqual([s['code'] for s in response.data['irrigation']['stations']], ['S-A'])
        self.assertNotIn('authority', response.data)

    def test_farmer_dashboard_only_own_fields(self):
        self.client.force_authenticate(self.farmer)
        response = self.client.get('/api/v1/dashboard/role/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual([f['name'] for f in response.data['farmer']['fields']], ['Field A'])
        self.assertNotIn('authority', response.data)

    def test_anonymous_cannot_view_role_dashboard(self):
        response = self.client.get('/api/v1/dashboard/role/')
        self.assertEqual(response.status_code, 401)

    def test_bad_date_ranges_rejected(self):
        self.client.force_authenticate(self.authority)
        for qs in ['?from=2020-01-01&to=2021-01-01',
                   '?from=2026-12-01&to=2026-01-01',
                   '?from=wrong-date&to=2026-01-01',
                   '?from=2050-01-01&to=2050-01-01']:
            with self.subTest(qs=qs):
                self.assertEqual(self.client.get('/api/v1/dashboard/role/'+qs).status_code, 400)

    def test_a_measurement_stays_a_flow_sample_not_cumulative_volume(self):
        self.client.force_authenticate(self.authority)
        response = self.client.get('/api/v1/dashboard/role/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['observations']['samples'], 1)
        self.assertEqual(response.data['observations']['stations_with_samples'], 1)
        self.assertEqual(response.data['observations']['daily_observed_flow'][0]['mean_observed_flow_lps'], '14.500')
        self.assertNotIn('total_m3', str(response.data))

    def test_outside_the_period_readings_not_included(self):
        self.client.force_authenticate(self.authority)
        response = self.client.get('/api/v1/dashboard/role/?from=2020-01-01&to=2020-01-03')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['observations']['samples'], 0)
        self.assertEqual(len(response.data['observations']['daily_observed_flow']), 0)

class AlertWorkflowTests(ApiIsolationTests):
    def test_operator_can_create_and_close_own_canal_alert(self):
        self.client.force_authenticate(self.irrigation)
        r=self.client.post('/api/v1/alerts/new/',{'canal_id':self.c1.id,'title':'Tekshirish kerak'},format='json')
        self.assertEqual(r.status_code,201)
        resolved=self.client.post(f'/api/v1/alerts/{r.data["id"]}/resolve/',{},format='json')
        self.assertEqual(resolved.status_code,200)
        self.assertEqual(resolved.data['status'],'resolved')
    def test_operator_cannot_create_other_canal_alert(self):
        self.client.force_authenticate(self.irrigation)
        r=self.client.post('/api/v1/alerts/new/',{'canal_id':self.c2.id,'title':'Outside'},format='json')
        self.assertEqual(r.status_code,403)
    def test_authority_is_read_only_for_alerts(self):
        self.client.force_authenticate(self.authority)
        r=self.client.post('/api/v1/alerts/new/',{'canal_id':self.c1.id,'title':'New'},format='json')
        self.assertEqual(r.status_code,403)
    def test_farmer_cannot_resolve_alerts(self):
        from .models import Alert
        alert=Alert.objects.create(district=self.d1,canal=self.c1,title='Flow')
        self.client.force_authenticate(self.farmer)
        self.assertEqual(self.client.post(f'/api/v1/alerts/{alert.id}/resolve/',{},format='json').status_code,403)
