"""Monthly and yearly cabinet indicators based only on authorized real readings."""
from datetime import date, datetime, time
from decimal import Decimal

from django.db.models import Avg, Count
from django.db.models.functions import TruncMonth
from django.utils import timezone
from rest_framework.decorators import api_view
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from .security import (
    authorized_areas,
    authorized_canals,
    authorized_fields,
    authorized_readings,
    authorized_stations,
)


def _decimal_text(value, places=3):
    if value is None:
        return None
    return str(value.quantize(Decimal("1").scaleb(-places)))


def _requested_period(request):
    today = timezone.localdate()
    year_text = request.query_params.get("year", str(today.year))
    if len(year_text) != 4 or not year_text.isdigit():
        raise ValidationError({"year": "Yil YYYY shaklida bo‘lishi kerak."})
    year = int(year_text)
    if year < 2000 or year > today.year:
        raise ValidationError({"year": f"Yil 2000–{today.year} oralig‘ida bo‘lishi kerak."})

    month_text = request.query_params.get("month")
    month = None
    if month_text not in (None, ""):
        if not month_text.isdigit() or not 1 <= int(month_text) <= 12:
            raise ValidationError({"month": "Oy 1–12 oralig‘ida bo‘lishi kerak."})
        month = int(month_text)
        if year == today.year and month > today.month:
            raise ValidationError({"month": "Kelajakdagi oy uchun hisobot mavjud emas."})

    first = date(year, month or 1, 1)
    if month:
        next_month = date(year + (1 if month == 12 else 0), 1 if month == 12 else month + 1, 1)
        period_type = "month"
    else:
        next_month = date(year + 1, 1, 1)
        period_type = "year"

    tz = timezone.get_current_timezone()
    start = timezone.make_aware(datetime.combine(first, time.min), tz)
    stop = timezone.make_aware(datetime.combine(next_month, time.min), tz)
    return year, month, period_type, first, next_month, start, stop


@api_view(["GET"])
def period_statistics(request):
    """Return monthly or year-to-date readings, grouped by month for annual view.

    flow_lps is an observed instantaneous rate. Its mean is never presented as
    cumulative water volume in m³.
    """
    year, month, period_type, first, next_month, start, stop = _requested_period(request)
    user = request.user
    readings = authorized_readings(user).filter(
        recorded_at__gte=start,
        recorded_at__lt=stop,
    )

    totals = readings.aggregate(
        readings_count=Count("id"),
        average_flow_lps=Avg("flow_lps"),
        average_level_cm=Avg("level_cm"),
        stations_with_readings=Count("station_id", distinct=True),
    )

    grouped = readings.annotate(
        period_month=TruncMonth("recorded_at", tzinfo=timezone.get_current_timezone())
    ).values("period_month").annotate(
        readings_count=Count("id"),
        average_flow_lps=Avg("flow_lps"),
        stations_with_readings=Count("station_id", distinct=True),
    ).order_by("period_month")

    by_month = {}
    for item in grouped:
        key = timezone.localtime(item["period_month"]).strftime("%Y-%m")
        by_month[key] = {
            "month": key,
            "readings_count": item["readings_count"],
            "average_flow_lps": _decimal_text(item["average_flow_lps"]),
            "stations_with_readings": item["stations_with_readings"],
        }

    if period_type == "month":
        month_keys = [first.strftime("%Y-%m")]
    else:
        month_keys = [f"{year}-{number:02d}" for number in range(1, 13)]

    monthly = [
        by_month.get(key, {
            "month": key,
            "readings_count": 0,
            "average_flow_lps": None,
            "stations_with_readings": 0,
        })
        for key in month_keys
    ]

    return Response({
        "demo": False,
        "data_source": "authorized_measured_readings",
        "period": {
            "type": period_type,
            "year": year,
            "month": month,
            "from": first.isoformat(),
            "to": (next_month.fromordinal(next_month.toordinal() - 1)).isoformat(),
        },
        "summary": {
            "readings_count": totals["readings_count"],
            "average_flow_lps": _decimal_text(totals["average_flow_lps"]),
            "average_level_cm": _decimal_text(totals["average_level_cm"], 2),
            "stations_with_readings": totals["stations_with_readings"],
            "stations_total": authorized_stations(user).count(),
            "canals_total": authorized_canals(user).count(),
            "areas_total": authorized_areas(user).count(),
            "fields_total": authorized_fields(user).count(),
        },
        "months": monthly,
        "note": (
            "O‘rtacha l/s faqat shu davrda bazaga yozilgan oniy o‘lchovlarning o‘rtachasi. "
            "Bu jami suv hajmi emas; m³ qiymatlar faqat tasdiqlangan suv balansi hujjatlaridan olinadi."
        ),
    })
