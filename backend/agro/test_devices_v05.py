"""Full v0.5 ingestion/permissions checks; no demo measurements in the real database."""
import hashlib
from io import StringIO
from django.core.management import call_command
from django.core.management.base import CommandError
from datetime import timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient

from .models import Area, Canal, District, Profile, Reading, Station

User = get_user_model()


class DeviceIngestionTests(TestCase):
    def setUp(self):
        self.d1 = District.objects.create(name='Qorako‘l')
        self.d2 = District.objects.create(name='Boshqa tuman')
        self.a1 = Area.objects.create(name='Hudud 1', district=self.d1)
        self.a2 = Area.objects.create(name='Hudud 2', district=self.d2)
        self.c1 = Canal.objects.create(name='Kanal 1', code='CAN-05', district=self.d1, area=self.a1)
        self.c2 = Canal.objects.create(name='Kanal 2', code='CAN-06', district=self.d2, area=self.a2)
        self.key = 'very-long-random-real-test-key-used-only-in-tests-123456'
        self.s1 = Station.objects.create(name='Punkt 1', code='ST-05', canal=self.c1,
                                         ingest_key_hash=hashlib.sha256(self.key.encode()).hexdigest())
        self.s2 = Station.objects.create(name='Punkt 2', code='ST-06', canal=self.c2)
        self.farmer = User.objects.create_user('test_farmer_v05', password='not-production')
        self.farmer.agro_profile.role = Profile.FARMER
        self.farmer.agro_profile.district = self.d1
        self.farmer.agro_profile.save()
        self.authority = User.objects.create_user('test_authority_v05', password='not-production')
        self.authority.agro_profile.role = Profile.AUTHORITY
        self.authority.agro_profile.district = self.d1
        self.authority.agro_profile.save()
        self.operator = User.objects.create_user('test_operator_v05', password='not-production')
        self.operator.agro_profile.role = Profile.IRRIGATION
        self.operator.agro_profile.district = self.d1
        self.operator.agro_profile.save()
        self.operator.agro_profile.assigned_canals.add(self.c1)
        self.client = APIClient()

    def payload(self, **overrides):
        result = {'station_id': self.s1.id,
                  'recorded_at': (timezone.now() - timedelta(minutes=1)).isoformat(),
                  'flow_lps': '15.125', 'level_cm': '21.50'}
        result.update(overrides)
        return result

    def post(self, payload=None, key=None):
        headers = {'HTTP_X_DEVICE_KEY': self.key if key is None else key}
        return self.client.post('/api/v1/devices/ingest/', payload or self.payload(), format='json', **headers)

    def test_authenticated_device_upload_and_retry_idempotent(self):
        payload = self.payload()
        response = self.post(payload)
        self.assertEqual(response.status_code, 201)
        self.assertFalse(response.data['duplicate'])
        self.s1.refresh_from_db()
        self.assertIsNotNone(self.s1.last_device_ingest_at)
        reading = Reading.objects.get(station=self.s1)
        self.assertEqual(reading.source, Reading.DEVICE)
        self.assertEqual(reading.flow_lps, Decimal('15.125'))
        retry = self.post(payload)
        self.assertEqual(retry.status_code, 200)
        self.assertTrue(retry.data['duplicate'])
        self.assertEqual(Reading.objects.filter(station=self.s1).count(), 1)

    def test_conflicting_duplicate_rejected(self):
        payload = self.payload()
        self.assertEqual(self.post(payload).status_code, 201)
        altered = dict(payload, flow_lps='14.777')
        self.assertEqual(self.post(altered).status_code, 409)
        self.assertEqual(Reading.objects.get(station=self.s1).flow_lps, Decimal('15.125'))

    def test_wrong_and_absent_secrets_and_disabled_station(self):
        self.assertEqual(self.post(key='invalid').status_code, 403)
        self.assertEqual(self.post(key='').status_code, 403)
        self.assertEqual(Reading.objects.count(), 0)
        self.s1.is_enabled = False
        self.s1.save(update_fields=['is_enabled'])
        self.assertEqual(self.post().status_code, 403)

    @override_settings(AGRO_DEVICE_MAX_AGE_DAYS=30)
    def test_old_future_and_negative_measurements_rejected(self):
        old = self.payload(recorded_at=(timezone.now()-timedelta(days=31)).isoformat())
        future = self.payload(recorded_at=(timezone.now()+timedelta(hours=1)).isoformat())
        invalid = self.payload(flow_lps='-2')
        self.assertEqual(self.post(old).status_code, 400)
        self.assertEqual(self.post(future).status_code, 400)
        self.assertEqual(self.post(invalid).status_code, 400)
        self.assertEqual(Reading.objects.count(), 0)

    def test_device_status_permissions_and_scoping(self):
        self.assertEqual(self.client.get('/api/v1/dashboard/devices/').status_code, 401)
        self.client.force_authenticate(self.farmer)
        self.assertEqual(self.client.get('/api/v1/dashboard/devices/').status_code, 403)
        self.client.force_authenticate(self.authority)
        response = self.client.get('/api/v1/dashboard/devices/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['stations_total'], 1)
        self.assertEqual([s['code'] for s in response.data['stations']], ['ST-05'])
        self.assertEqual(response.data['counts']['awaiting_data'], 1)
        self.client.force_authenticate(None)
        self.assertEqual(self.post().status_code, 201)
        self.client.force_authenticate(self.operator)
        result = self.client.get('/api/v1/dashboard/devices/')
        self.assertEqual(result.status_code, 200)
        self.assertEqual(result.data['counts']['recent_receipt'], 1)
        self.assertEqual(result.data['stations'][0]['last_device_measurement_at'] is not None, True)

    def test_manual_reading_does_not_count_as_device_receipt(self):
        Reading.objects.create(station=self.s1, recorded_at=timezone.now(), flow_lps='10', source=Reading.MANUAL)
        self.client.force_authenticate(self.authority)
        result = self.client.get('/api/v1/dashboard/devices/')
        self.assertEqual(result.data['counts']['awaiting_data'], 1)
        self.assertIsNone(result.data['stations'][0]['last_device_ingest_at'])
        self.assertIsNone(result.data['stations'][0]['last_device_measurement_at'])

    def test_key_rotation_revokes_old_key(self):
        new_key = 'this-is-another-unique-long-test-key-for-rotation-9876'
        self.s1.ingest_key_hash = hashlib.sha256(new_key.encode()).hexdigest()
        self.s1.save(update_fields=['ingest_key_hash'])
        self.assertEqual(self.post(key=self.key).status_code, 403)
        self.assertEqual(self.post(key=new_key).status_code, 201)

    def test_management_key_requires_explicit_rotation_and_supports_revoke(self):
        with self.assertRaises(CommandError):
            call_command('set_device_key', 'ST-05', stdout=StringIO())
        output = StringIO()
        call_command('set_device_key', 'ST-05', '--rotate', stdout=output)
        self.assertIn('Device key:', output.getvalue())
        self.s1.refresh_from_db()
        self.assertNotEqual(self.s1.ingest_key_hash, hashlib.sha256(self.key.encode()).hexdigest())
        call_command('set_device_key', 'ST-05', '--revoke', stdout=StringIO())
        self.s1.refresh_from_db()
        self.assertEqual(self.s1.ingest_key_hash, '')
