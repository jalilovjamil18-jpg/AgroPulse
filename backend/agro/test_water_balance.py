"""v0.4 monthly water balance: provenance, permissions and safe reporting."""
import csv
import tempfile
from datetime import date
from decimal import Decimal
from pathlib import Path
from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.core.management.base import CommandError
from django.core.exceptions import ValidationError
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from .models import District, Area, Profile, WaterBalance

User = get_user_model()


class WaterBalanceTests(TestCase):
    def setUp(self):
        self.d1 = District.objects.create(name='Qorako‘l')
        self.d2 = District.objects.create(name='Boshqa tuman')
        self.area1 = Area.objects.create(district=self.d1, name='Birinchi hudud')
        self.area2 = Area.objects.create(district=self.d1, name='Ikkinchi hudud')
        self.other_area = Area.objects.create(district=self.d2, name='Sirli hudud')
        self.month = timezone.localdate().replace(day=1)
        self.admin = User.objects.create_superuser('root_admin', 'root@example.com', 'strong-pass-123')
        self.admin.agro_profile.district = self.d1
        self.admin.agro_profile.save()
        self.authority = User.objects.create_user('hokim', password='strong-pass-123')
        self.authority.agro_profile.role = Profile.AUTHORITY
        self.authority.agro_profile.district = self.d1
        self.authority.agro_profile.save()
        self.farmer = User.objects.create_user('fermer', password='strong-pass-123')
        self.farmer.agro_profile.role = Profile.FARMER
        self.farmer.agro_profile.district = self.d1
        self.farmer.agro_profile.save()
        self.client = APIClient()

    def record(self, area, planned, actual, verified=True, doc='QK-2026/1'):
        return WaterBalance.objects.create(area=area, month=self.month, planned_m3=planned,
            actual_m3=actual, document_reference=doc, is_verified=verified,
            verified_at=timezone.now() if verified else None,
            verified_by=self.admin if verified else None)

    def url(self, month=None):
        return '/api/v1/dashboard/water-balance/?month=' + (month or self.month.strftime('%Y-%m'))

    def test_not_public_and_only_authority_admin(self):
        self.assertEqual(self.client.get(self.url()).status_code, 401)
        self.client.force_authenticate(self.farmer)
        self.assertEqual(self.client.get(self.url()).status_code, 403)
        self.assertEqual(self.client.get('/api/v1/reports/water-balance.csv').status_code, 403)

    def test_only_verified_and_own_district(self):
        self.record(self.area1, Decimal('100'), Decimal('80'))
        self.record(self.area2, Decimal('200'), Decimal('220'), verified=False)
        self.record(self.other_area, Decimal('4000'), Decimal('3900'))
        self.client.force_authenticate(self.authority)
        res = self.client.get(self.url())
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['areas_verified'], 1)
        self.assertEqual(res.data['areas_total'], 2)
        self.assertEqual(res.data['draft_count'], 1)
        self.assertEqual(Decimal(res.data['planned_m3']), Decimal('100'))
        self.assertEqual(Decimal(res.data['actual_m3']), Decimal('80'))
        self.assertEqual(res.data['paired_utilization_pct'], '80.0')
        self.assertFalse(res.data['actual_complete'])
        self.assertNotIn('Sirli hudud', str(res.data))
        self.assertEqual(self.client.get(self.url() + f'&district_id={self.d2.pk}').status_code,403)
        # Dashboard must not create phantom totals from sample flow.
        self.assertEqual(res.data['data_source'], 'verified_source_documents')

    def test_missing_values_yield_nulls_and_export_is_scoped(self):
        self.record(self.area1, Decimal('0'), None, doc='QK-4')
        self.client.force_authenticate(self.authority)
        res = self.client.get(self.url())
        self.assertIsNone(res.data['actual_m3'])
        self.assertIsNone(res.data['paired_utilization_pct'])
        self.assertIsNone(res.data['rows'][0]['utilization_pct'])
        csv_response = self.client.get('/api/v1/reports/water-balance.csv?month='+self.month.strftime('%Y-%m'))
        self.assertEqual(csv_response.status_code, 200)
        self.assertIn('QK-4', csv_response.content.decode('utf-8-sig'))

    def test_month_validation(self):
        self.client.force_authenticate(self.authority)
        for v in ('2026-13', '2026-00', 'abc', '2026-1', '2026-04-01'):
            with self.subTest(v=v):
                self.assertEqual(self.client.get(self.url(v)).status_code,400)

    def test_import_dry_run_and_approval(self):
        self.client.force_authenticate(self.authority)
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder)/'balance.csv'
            with path.open('w', encoding='utf-8', newline='') as f:
                writer=csv.DictWriter(f,fieldnames=['area_name','month','planned_m3','actual_m3','document_reference','note'])
                writer.writeheader()
                writer.writerow({'area_name':'Birinchi hudud','month':self.month.strftime('%Y-%m'),
                                 'planned_m3':'123.000','actual_m3':'45.500','document_reference':'H-12','note':'signed'})
            call_command('import_water_balance', str(path), '--district',str(self.d1.pk))
            self.assertEqual(WaterBalance.objects.count(), 0)
            call_command('import_water_balance', str(path), '--district',str(self.d1.pk), '--apply')
            self.assertEqual(WaterBalance.objects.count(), 1)
            self.assertFalse(WaterBalance.objects.first().is_verified)
            self.assertEqual(self.client.get(self.url()).data['areas_verified'],0)
            with self.assertRaises(CommandError):
                call_command('import_water_balance', str(path), '--district',str(self.d1.pk), '--apply')
            # Approval by superuser makes the record available to the authority.
            balance=WaterBalance.objects.first()
            balance.is_verified=True
            balance.verified_by=self.admin
            balance.verified_at=timezone.now()
            balance.full_clean()
            balance.save()
            self.assertEqual(self.client.get(self.url()).data['areas_verified'],1)

    def test_bad_data_never_stored(self):
        with self.assertRaises(ValidationError):
            WaterBalance(area=self.area1, month=date(2026, 10, 2), planned_m3=1,
                         document_reference='H-1').full_clean()
        with self.assertRaises(ValidationError):
            WaterBalance(area=self.area1, month=self.month, planned_m3=-1,
                         document_reference='H-1').full_clean()
