"""Document-backed, VERIFIED monthly volumes; a sample flow (l/s) is never m³."""
import csv
from datetime import date
from decimal import Decimal
from django.http import HttpResponse
from django.utils import timezone
from rest_framework.decorators import api_view
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from .models import District, Profile, WaterBalance, Area
from .security import district_for, role_for


def scope(request):
    if role_for(request.user) not in (Profile.AUTHORITY, Profile.ADMIN):
        raise PermissionDenied('Suv balansi hisobotini ko‘rish uchun hokimiyat vakolati kerak.')
    requested = request.query_params.get('district_id')
    current = district_for(request.user)
    if role_for(request.user) == Profile.AUTHORITY:
        if current is None:
            raise PermissionDenied('Foydalanuvchi hududga biriktirilmagan.')
        if requested and requested != str(current):
            raise PermissionDenied('Faqat o‘z tumaningiz ma’lumotlari.')
        return District.objects.get(pk=current)
    # Superuser can inspect a chosen district; NEVER silently sum multiple districts.
    if requested:
        if not requested.isdigit():
            raise ValidationError({'district_id': 'Musbat butun son kerak.'})
        d = District.objects.filter(pk=int(requested)).first()
        if not d: raise ValidationError({'district_id': 'Tuman topilmadi.'})
        return d
    if current:
        return District.objects.get(pk=current)
    raise ValidationError({'district_id': 'Administrator tuman ID sini aniq tanlashi kerak.'})


def parsed_month(request):
    value = request.query_params.get('month') or timezone.localdate().strftime('%Y-%m')
    if len(value) != 7 or value[4] != '-' or not (value[:4] + value[5:]).isdigit():
        raise ValidationError({'month': 'Oy YYYY-MM formatida bo‘lishi kerak.'})
    try: return date(int(value[:4]), int(value[5:]), 1)
    except ValueError: raise ValidationError({'month': 'Bunday oy mavjud emas.'})


def visible_rows(request, district, month):
    return (WaterBalance.objects.filter(area__district=district, month=month, is_verified=True)
            .select_related('area', 'verified_by').order_by('area__name', 'id'))


def formatted(value):
    return str(value) if value is not None else None


def ratio(actual, plan):
    if actual is None or plan is None or plan <= 0: return None
    return str((actual * Decimal('100') / plan).quantize(Decimal('0.1')))


def display_row(obj):
    return {'area_id': obj.area_id, 'area': obj.area.name, 'planned_m3': formatted(obj.planned_m3),
            'actual_m3': formatted(obj.actual_m3), 'utilization_pct': ratio(obj.actual_m3, obj.planned_m3),
            'source_document': obj.document_reference, 'verified_at': obj.verified_at}


@api_view(['GET'])
def monthly_balance(request):
    district = scope(request)
    month = parsed_month(request)
    qs = visible_rows(request, district, month)
    rows = list(qs[:2001])
    if len(rows) > 2000:
        return Response({'detail': '2000 tadan ortiq yozuv: hisobotni kichikroq hududlarga ajrating.'}, status=413)
    # All plan/actual totals are restricted to this month and verified records.
    # If some records lack either value, each total is PARTIAL (and explicitly labelled).
    plan_values = [r.planned_m3 for r in rows if r.planned_m3 is not None]
    actual_values = [r.actual_m3 for r in rows if r.actual_m3 is not None]
    paired = [r for r in rows if r.planned_m3 is not None and r.actual_m3 is not None]
    paired_plan = sum((r.planned_m3 for r in paired), Decimal('0'))
    paired_actual = sum((r.actual_m3 for r in paired), Decimal('0'))
    area_count = Area.objects.filter(district=district).count()
    draft_count = WaterBalance.objects.filter(area__district=district, month=month, is_verified=False).count()
    return Response({
        'district': {'id': district.id, 'name': district.name},
        'month': month.strftime('%Y-%m'), 'unit': 'm³', 'data_source': 'verified_source_documents', 'demo': False,
        'areas_total': area_count, 'areas_verified': len(rows), 'draft_count': draft_count,
        'planned_m3': formatted(sum(plan_values, Decimal('0'))) if plan_values else None,
        'actual_m3': formatted(sum(actual_values, Decimal('0'))) if actual_values else None,
        'areas_with_plan': len(plan_values), 'areas_with_actual': len(actual_values),
        'areas_with_both': len(paired),
        'paired_utilization_pct': ratio(paired_actual, paired_plan) if paired else None,
        'planned_complete': len(plan_values) == area_count and area_count > 0,
        'actual_complete': len(actual_values) == area_count and area_count > 0,
        'rows': [display_row(r) for r in rows],
        'missing_areas': list(Area.objects.filter(district=district).exclude(
            id__in=[r.area_id for r in rows]).order_by('name').values('id', 'name')[:500]),
        'missing_areas_truncated': area_count - len(rows) > 500,
        'notice': 'Faqat administrator tasdiqlagan hujjatli m³ ma’lumotlari. '
                  'Reja va amaldagi yig‘indilar qamrov to‘liq bo‘lmaganda qisman; '
                  'foiz faqat ikkala qiymati mavjud hududlar asosida. Sensor l/s qiymatlaridan m³ hisoblanmagan.',
    })


def safe_csv(value):
    s = '' if value is None else str(value)
    return "'" + s if s.lstrip().startswith(('=', '+', '-', '@', '\t', '\r')) else s


@api_view(['GET'])
def export_monthly_balance(request):
    district = scope(request)
    month = parsed_month(request)
    qs = visible_rows(request, district, month)
    response = HttpResponse(content_type='text/csv; charset=utf-8')
    response['Content-Disposition'] = f'attachment; filename="agropulse_water_balance_{month:%Y-%m}.csv"'
    response.write('\ufeff')
    writer = csv.writer(response)
    writer.writerow(['district', 'month', 'area', 'planned_m3', 'actual_m3', 'utilization_pct', 'document_reference', 'verified_at'])
    for obj in qs.iterator():
        writer.writerow([safe_csv(district.name), month.strftime('%Y-%m'), safe_csv(obj.area.name),
                         formatted(obj.planned_m3) or '', formatted(obj.actual_m3) or '',
                         ratio(obj.actual_m3, obj.planned_m3) or '', safe_csv(obj.document_reference), obj.verified_at.isoformat() if obj.verified_at else ''])
    return response


@api_view(['GET'])
def annual_balance(request):
    """Verified document-backed annual m³ summary, with partial coverage shown explicitly."""
    district = scope(request)
    year_text = request.query_params.get('year') or str(timezone.localdate().year)
    if len(year_text) != 4 or not year_text.isdigit():
        raise ValidationError({'year': 'Yil YYYY formatida bo‘lishi kerak.'})
    year = int(year_text)
    current_year = timezone.localdate().year
    if year < 2000 or year > current_year:
        raise ValidationError({'year': f'Yil 2000–{current_year} oralig‘ida bo‘lishi kerak.'})

    through_month = timezone.localdate().month if year == current_year else 12
    start = date(year, 1, 1)
    end = date(year, 12, 1)
    qs = (WaterBalance.objects.filter(
        area__district=district,
        month__gte=start,
        month__lte=end,
        is_verified=True,
    ).select_related('area', 'verified_by').order_by('area__name', 'month'))

    rows = list(qs[:12001])
    if len(rows) > 12000:
        return Response({'detail': 'Yillik hisobotda 12000 tadan ortiq yozuv bor.'}, status=413)

    grouped = {}
    for item in rows:
        entry = grouped.setdefault(item.area_id, {
            'area_id': item.area_id,
            'area': item.area.name,
            'planned_values': [],
            'actual_values': [],
            'paired_plan': Decimal('0'),
            'paired_actual': Decimal('0'),
            'paired_months': 0,
            'months': set(),
            'documents': 0,
        })
        entry['months'].add(item.month.strftime('%Y-%m'))
        entry['documents'] += 1
        if item.planned_m3 is not None:
            entry['planned_values'].append(item.planned_m3)
        if item.actual_m3 is not None and item.month.month <= through_month:
            entry['actual_values'].append(item.actual_m3)
        if item.month.month <= through_month and item.planned_m3 is not None and item.actual_m3 is not None:
            entry['paired_plan'] += item.planned_m3
            entry['paired_actual'] += item.actual_m3
            entry['paired_months'] += 1

    area_count = Area.objects.filter(district=district).count()
    plan_values = [v for item in rows for v in [item.planned_m3] if v is not None]
    actual_values = [item.actual_m3 for item in rows if item.actual_m3 is not None and item.month.month <= through_month]
    paired_plan = sum((item.paired_plan for item in grouped.values()), Decimal('0'))
    paired_actual = sum((item.paired_actual for item in grouped.values()), Decimal('0'))
    annual_rows = []
    for item in grouped.values():
        plan = sum(item['planned_values'], Decimal('0')) if item['planned_values'] else None
        actual = sum(item['actual_values'], Decimal('0')) if item['actual_values'] else None
        annual_rows.append({
            'area_id': item['area_id'],
            'area': item['area'],
            'planned_m3': formatted(plan),
            'actual_m3': formatted(actual),
            'utilization_pct': ratio(item['paired_actual'], item['paired_plan']),
            'months_verified': len(item['months']),
            'paired_months': item['paired_months'],
            'document_count': item['documents'],
        })

    expected_area_months = area_count * 12
    verified_area_months = len(rows)
    return Response({
        'district': {'id': district.id, 'name': district.name},
        'year': year,
        'through_month': through_month,
        'unit': 'm³',
        'data_source': 'verified_source_documents',
        'demo': False,
        'areas_total': area_count,
        'areas_with_records': len(grouped),
        'verified_area_months': verified_area_months,
        'expected_area_months': expected_area_months,
        'coverage_pct': (
            str((Decimal(verified_area_months) * Decimal('100') / Decimal(expected_area_months)).quantize(Decimal('0.1')))
            if expected_area_months else None
        ),
        'planned_m3': formatted(sum(plan_values, Decimal('0'))) if plan_values else None,
        'actual_m3': formatted(sum(actual_values, Decimal('0'))) if actual_values else None,
        'areas_with_plan': len({item.area_id for item in rows if item.planned_m3 is not None}),
        'areas_with_actual': len({item.area_id for item in rows if item.actual_m3 is not None and item.month.month <= through_month}),
        'paired_utilization_pct': ratio(paired_actual, paired_plan) if paired_plan else None,
        'rows': annual_rows,
        'missing_areas': list(Area.objects.filter(district=district).exclude(
            id__in=list(grouped.keys())).order_by('name').values('id', 'name')[:500]),
        'notice': (
            'Yillik m³ faqat administrator tasdiqlagan hujjatli oylik yozuvlar yig‘indisi. '
            'Reja butun yil bo‘yicha, amaldagi hajm joriy yil uchun faqat joriy oygacha jamlanadi. '
            'Qamrov 12 oylik hudud-oy yozuvlari asosida; sensor l/s yozuvlaridan m³ olinmagan.'
        ),
    })
