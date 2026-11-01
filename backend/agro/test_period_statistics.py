from datetime import datetime
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from .models import Area, Canal, District, Field, Profile, Reading, Station, WaterBalance


class CabinetPeriodStatisticsTests(TestCase):
    def setUp(self):
        User = get_user_model()
        self.user = User.objects.create_user(username='authority-test', password='Test-Only-Password-123!')
        self.district = District.objects.create(name='Test Qorako‘l')
        profile, _ = Profile.objects.get_or_create(user=self.user)
        profile.role = Profile.AUTHORITY
        profile.district = self.district
        profile.save(update_fields=['role', 'district'])
        self.user.agro_profile = profile
        self.area = Area.objects.create(district=self.district, name='Test area')
        self.canal = Canal.objects.create(district=self.district, area=self.area, name='Test canal', code='TEST-CANAL')
        self.station = Station.objects.create(canal=self.canal, name='Test station', code='TEST-ST-01')
        self.client = APIClient()
        self.client.force_authenticate(self.user)

    def add_reading(self, year, month, flow):
        minute = Reading.objects.filter(station=self.station).count()
        recorded_at = timezone.make_aware(datetime(year, month, 15, 12, minute))
        return Reading.objects.create(
            station=self.station,
            recorded_at=recorded_at,
            flow_lps=Decimal(flow),
        )

    def test_year_report_is_scoped_and_grouped_by_month(self):
        year = timezone.localdate().year
        self.add_reading(year, 1, '2.000')
        self.add_reading(year, 1, '4.000')
        self.add_reading(year, 2, '6.000')

        other_district = District.objects.create(name='Other district')
        other_area = Area.objects.create(district=other_district, name='Other area')
        other_canal = Canal.objects.create(district=other_district, area=other_area, name='Other canal', code='OTHER-CANAL')
        other_station = Station.objects.create(canal=other_canal, name='Other station', code='OTHER-ST-01')
        Reading.objects.create(
            station=other_station,
            recorded_at=timezone.make_aware(datetime(year, 1, 20, 12, 0)),
            flow_lps=Decimal('999.000'),
        )

        response = self.client.get('/api/v1/dashboard/statistics/', {'year': year})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['summary']['readings_count'], 3)
        self.assertEqual(response.data['summary']['average_flow_lps'], '4.000')
        self.assertEqual(len(response.data['months']), timezone.localdate().month)
        self.assertEqual(response.data['months'][0]['readings_count'], 2)
        self.assertEqual(response.data['months'][1]['readings_count'], 1)

    def test_month_report_only_counts_selected_month(self):
        today = timezone.localdate()
        selected_month = today.month - 1 if today.month > 1 else 12
        selected_year = today.year if today.month > 1 else today.year - 1
        self.add_reading(selected_year, selected_month, '3.500')
        another_month = selected_month - 1 if selected_month > 1 else 12
        another_year = selected_year if selected_month > 1 else selected_year - 1
        self.add_reading(another_year, another_month, '7.500')

        response = self.client.get('/api/v1/dashboard/statistics/', {
            'year': selected_year,
            'month': selected_month,
        })
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['period']['type'], 'month')
        self.assertEqual(response.data['summary']['readings_count'], 1)
        self.assertEqual(response.data['summary']['average_flow_lps'], '3.500')

    def test_annual_water_balance_sums_verified_document_values_only(self):
        year = timezone.localdate().year
        month_one = 1
        month_two = min(2, timezone.localdate().month)
        WaterBalance.objects.create(
            area=self.area,
            month=datetime(year, month_one, 1).date(),
            planned_m3=Decimal('100.000'),
            actual_m3=Decimal('80.000'),
            document_reference='Test approved document 1',
            is_verified=True,
            verified_at=timezone.now(),
            verified_by=self.user,
            created_by=self.user,
        )
        if month_two != month_one:
            WaterBalance.objects.create(
                area=self.area,
                month=datetime(year, month_two, 1).date(),
                planned_m3=Decimal('200.000'),
                actual_m3=Decimal('100.000'),
                document_reference='Test approved document 2',
                is_verified=True,
                verified_at=timezone.now(),
                verified_by=self.user,
                created_by=self.user,
            )
        # A future-month plan contributes to the annual plan, but not to actual-to-date.
        WaterBalance.objects.create(
            area=self.area,
            month=datetime(year, 12, 1).date(),
            planned_m3=Decimal('50.000'),
            actual_m3=None,
            document_reference='Approved future-month plan',
            is_verified=True,
            verified_at=timezone.now(),
            verified_by=self.user,
            created_by=self.user,
        )
        # An unverified draft must never be included in the annual totals.
        used_months = {month_one, month_two, 12}
        draft_month = next(month for month in range(1, 13) if month not in used_months)
        if draft_month not in (month_one, month_two):
            WaterBalance.objects.create(
                area=self.area,
                month=datetime(year, draft_month, 1).date(),
                planned_m3=Decimal('900.000'),
                actual_m3=Decimal('900.000'),
                document_reference='Unverified draft',
                is_verified=False,
                created_by=self.user,
            )

        response = self.client.get('/api/v1/dashboard/water-balance/annual/', {'year': year})
        self.assertEqual(response.status_code, 200)
        expected_plan = Decimal('350.000') if month_two != month_one else Decimal('150.000')
        expected_actual = Decimal('180.000') if month_two != month_one else Decimal('80.000')
        self.assertEqual(Decimal(response.data['planned_m3']), expected_plan)
        self.assertEqual(Decimal(response.data['actual_m3']), expected_actual)
        self.assertEqual(len(response.data['rows']), 1)
