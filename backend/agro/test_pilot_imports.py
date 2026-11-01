"""v0.3 regression: verified CSV, tenant separation and freshness semantics."""
import csv
import tempfile
from datetime import timedelta
from decimal import Decimal
from pathlib import Path

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from .models import Area, Canal, District, Field, Profile, Reading, Station

User = get_user_model()


class PilotImportTests(TestCase):
    def setUp(self):
        self.district = District.objects.create(name='Qorako‘l')
        self.other = District.objects.create(name='Boshqa tuman')
        self.area = Area.objects.create(district=self.district, name='Tasdiqlangan hudud')
        self.canal = Canal.objects.create(district=self.district, area=self.area, name='Test kanal', code='QC-1')
        self.station = Station.objects.create(canal=self.canal, code='QS-1', name='O‘lchov punkti')
        self.farmer = User.objects.create_user('pilot_farmer', password='a-valid-test-pass-123')
        self.farmer.agro_profile.district = self.district
        self.farmer.agro_profile.role = Profile.FARMER
        self.farmer.agro_profile.save()
        self.outsider = User.objects.create_user('outside_farmer', password='a-valid-test-pass-123')
        self.outsider.agro_profile.district = self.other
        self.outsider.agro_profile.save()
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)

    def write_csv(self, name, headers, rows):
        p = Path(self.temp.name) / name
        with p.open('w', encoding='utf-8', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=headers)
            writer.writeheader()
            writer.writerows(rows)
        return str(p)

    def test_field_dry_run_then_apply_and_no_silent_overwrite(self):
        columns = ['username', 'field_name', 'area_ha', 'crop', 'area_name', 'canal_code']
        row = dict(username='pilot_farmer', field_name='Dalasi', area_ha='2.250', crop='Paxta',
                   area_name='Tasdiqlangan hudud', canal_code='QC-1')
        filename = self.write_csv('fields.csv', columns, [row])
        call_command('import_pilot_data', 'fields', filename)
        self.assertEqual(Field.objects.count(), 0)
        call_command('import_pilot_data', 'fields', filename, '--apply')
        self.assertEqual(Field.objects.count(), 1)
        self.assertEqual(Field.objects.first().area_ha, Decimal('2.250'))
        # Idempotent import if values match
        call_command('import_pilot_data', 'fields', filename, '--apply')
        self.assertEqual(Field.objects.count(), 1)
        row['area_ha'] = '9.000'
        changed = self.write_csv('changed.csv', columns, [row])
        with self.assertRaises(CommandError):
            call_command('import_pilot_data', 'fields', changed, '--apply')
        self.assertEqual(Field.objects.first().area_ha, Decimal('2.250'))

    def test_bad_row_reverts_whole_batch_and_cross_district_rejected(self):
        columns = ['username', 'field_name', 'area_ha', 'crop', 'area_name', 'canal_code']
        good = dict(username='pilot_farmer', field_name='Valid', area_ha='4', crop='',
                    area_name='Tasdiqlangan hudud', canal_code='QC-1')
        bad = {**good, 'field_name': 'Bad', 'username': 'outside_farmer'}
        file = self.write_csv('mixed.csv', columns, [good, bad])
        with self.assertRaises(CommandError):
            call_command('import_pilot_data', 'fields', file, '--apply')
        self.assertEqual(Field.objects.count(), 0)

    def test_reading_dry_run_apply_and_duplicate_rejected(self):
        columns = ['station_code', 'recorded_at', 'flow_lps', 'level_cm']
        row = dict(station_code='QS-1', recorded_at=(timezone.now() - timedelta(hours=3)).isoformat(),
                   flow_lps='15.125', level_cm='30.40')
        f = self.write_csv('readings.csv', columns, [row])
        call_command('import_pilot_data', 'readings', f)
        self.assertEqual(Reading.objects.count(), 0)
        call_command('import_pilot_data', 'readings', f, '--apply')
        self.assertEqual(Reading.objects.count(), 1)
        self.assertEqual(Reading.objects.first().source, Reading.MANUAL)
        with self.assertRaises(CommandError):
            call_command('import_pilot_data', 'readings', f, '--apply')
        self.assertEqual(Reading.objects.count(), 1)

    def test_naive_time_and_infinite_value_are_rejected(self):
        columns = ['station_code', 'recorded_at', 'flow_lps', 'level_cm']
        row = dict(station_code='QS-1', recorded_at='2026-10-10T12:00:00', flow_lps='4', level_cm='')
        f = self.write_csv('naive.csv', columns, [row])
        with self.assertRaises(CommandError):
            call_command('import_pilot_data', 'readings', f, '--apply')
        row['recorded_at'] = (timezone.now() - timedelta(hours=1)).isoformat()
        row['flow_lps'] = 'Infinity'
        f = self.write_csv('infinite.csv', columns, [row])
        with self.assertRaises(CommandError):
            call_command('import_pilot_data', 'readings', f, '--apply')


class DataQualityTests(PilotImportTests):
    def setUp(self):
        super().setUp()
        self.authority = User.objects.create_user('authority', password='a-valid-test-pass-123')
        self.authority.agro_profile.district = self.district
        self.authority.agro_profile.role = Profile.AUTHORITY
        self.authority.agro_profile.save()
        self.client = APIClient()

    def test_authority_scope_and_freshness(self):
        other_c = Canal.objects.create(district=self.other, name='Secret', code='OTHER')
        other_s = Station.objects.create(canal=other_c, name='Other', code='OTHER-ST')
        Reading.objects.create(station=other_s, recorded_at=timezone.now(), flow_lps='999')
        Reading.objects.create(station=self.station, recorded_at=timezone.now()-timedelta(days=3), flow_lps='3')
        Station.objects.create(canal=self.canal, name='No sample', code='QS-EMPTY')
        self.client.force_authenticate(self.authority)
        response = self.client.get('/api/v1/dashboard/data-quality/')
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.data['demo'])
        self.assertEqual(response.data['stations_total'], 2)
        self.assertEqual(response.data['counts']['stale'], 1)
        self.assertEqual(response.data['counts']['no_data'], 1)
        self.assertNotIn('OTHER-ST', str(response.data))
        self.assertNotIn('999', str(response.data))

    def test_anonymous_rejected(self):
        self.assertEqual(self.client.get('/api/v1/dashboard/data-quality/').status_code, 401)
