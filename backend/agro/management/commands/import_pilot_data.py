"""Operator-reviewed imports; validates entire CSV in a transaction before --apply.

CSV imports represent supplied records, never synthetic data or device telemetry.
No changes are saved in default dry-run mode.
"""
import csv
import hashlib
from datetime import datetime, timedelta
from decimal import Decimal, InvalidOperation
from pathlib import Path

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone
from django.utils.dateparse import parse_datetime

from agro.models import Area, Canal, District, Field, Profile, Reading, Station

REQUIRED = {
    'fields': {'username', 'field_name', 'area_ha', 'crop', 'area_name', 'canal_code'},
    'readings': {'station_code', 'recorded_at', 'flow_lps', 'level_cm'},
}


def decimal_value(raw, field, places, max_digits):
    try:
        number = Decimal(raw)
    except (InvalidOperation, ValueError, TypeError):
        raise ValueError(f'{field}: haqiqiy raqam kiriting')
    if not number.is_finite() or number < 0:
        raise ValueError(f'{field}: qiymat manfiy yoki cheksiz bo‘lishi mumkin emas')
    limit = Decimal(1).scaleb(-places)
    if number != number.quantize(limit):
        raise ValueError(f'{field}: ko‘pi bilan {places} ta kasr xonasi')
    if number >= Decimal(10) ** (max_digits - places):
        raise ValueError(f'{field}: qiymat juda katta')
    return number


class Command(BaseCommand):
    help = 'Qorako‘l pilotiga tasdiqlangan dala/o‘lchov CSV. Avval dry-run, --apply bilan saqlash.'

    def add_arguments(self, parser):
        parser.add_argument('kind', choices=['fields', 'readings'])
        parser.add_argument('csv_file')
        parser.add_argument('--district', default='Qorako‘l')
        parser.add_argument('--apply', action='store_true')

    def handle(self, *args, **opts):
        kind, path = opts['kind'], Path(opts['csv_file'])
        if not path.is_file():
            raise CommandError(f'Fayl topilmadi: {path}')
        district = District.objects.filter(name=opts['district']).first()
        if district is None:
            raise CommandError('Tuman topilmadi. Avval init_qorakol buyrug‘ini bajaring.')
        try:
            data = path.read_bytes()
            text = data.decode('utf-8-sig')
            reader = csv.DictReader(text.splitlines())
            if not REQUIRED[kind].issubset(set(reader.fieldnames or ())):
                raise CommandError('CSV ustunlari yetishmayapti: '+', '.join(sorted(REQUIRED[kind] - set(reader.fieldnames or ()))))
            rows = list(reader)
            if not 1 <= len(rows) <= 2000:
                raise CommandError('CSV 1–2000 qator bo‘lishi kerak.')
        except UnicodeDecodeError as exc:
            raise CommandError('CSV UTF-8 kodlashda bo‘lishi kerak.') from exc
        user_model = get_user_model()
        seen = set()
        current_line = 1
        try:
            with transaction.atomic():
                for current_line, row in enumerate(rows, 2):
                    record = {k: (v or '').strip() for k, v in row.items() if k}
                    if kind == 'fields':
                        username, name = record['username'], record['field_name']
                        if not username or not name:
                            raise ValueError('username va field_name majburiy')
                        if (username, name.casefold()) in seen:
                            raise ValueError('CSV ichida takroriy dala nomi')
                        seen.add((username, name.casefold()))
                        owner = user_model.objects.filter(username=username, is_active=True).first()
                        if owner is None:
                            raise ValueError('Faol foydalanuvchi topilmadi: ' + username)
                        profile = getattr(owner, 'agro_profile', None)
                        if not profile or profile.role != Profile.FARMER or profile.district_id != district.id:
                            raise ValueError('Fermer roli yoki tumani mos emas: ' + username)
                        area = None
                        if record['area_name']:
                            area = Area.objects.filter(district=district, name=record['area_name']).first()
                            if area is None:
                                raise ValueError('Hudud topilmadi: ' + record['area_name'])
                        canal = None
                        if record['canal_code']:
                            canal = Canal.objects.filter(district=district, code=record['canal_code']).first()
                            if canal is None:
                                raise ValueError('Kanal topilmadi: ' + record['canal_code'])
                        if area and canal and canal.area_id and canal.area_id != area.id:
                            raise ValueError('Dala hududi va kanal hududi bir-biriga mos emas')
                        amount = decimal_value(record['area_ha'], 'area_ha', 3, 11)
                        field = Field.objects.filter(owner=owner, district=district, name=name)
                        if field.count() > 1:
                            raise ValueError('Bazadagi dala nomi takrorlangan: ' + name)
                        existing = field.first()
                        if existing:
                            if (existing.area_id != (area.id if area else None) or
                                existing.canal_id != (canal.id if canal else None) or
                                existing.area_ha != amount or existing.crop != record['crop']):
                                raise ValueError('Mavjud dala boshqacha; avtomatik almashtirilmaydi: ' + name)
                        else:
                            value = Field(owner=owner, district=district, area=area, canal=canal,
                                          name=name, crop=record['crop'], area_ha=amount)
                            value.full_clean()
                            value.save()
                    else:
                        code, timestamp = record['station_code'], record['recorded_at']
                        if not code or not timestamp:
                            raise ValueError('station_code va recorded_at majburiy')
                        station = Station.objects.select_related('canal').filter(code=code, canal__district=district).first()
                        if not station:
                            raise ValueError('Tuman sensori topilmadi: ' + code)
                        if not station.is_enabled:
                            raise ValueError('Sensor o‘chirilgan: ' + code)
                        when = parse_datetime(timestamp)
                        if when is None or timezone.is_naive(when):
                            raise ValueError('recorded_at ISO 8601 vaqt +05:00 zonasi bilan bo‘lishi kerak')
                        when = when.astimezone(timezone.get_current_timezone())
                        if when > timezone.now() + timedelta(minutes=5):
                            raise ValueError('Kelajakdagi o‘lchovni kiritib bo‘lmaydi')
                        if (station.pk, when.isoformat()) in seen:
                            raise ValueError('CSV ichida takroriy sensor/vaqt')
                        seen.add((station.pk, when.isoformat()))
                        if Reading.objects.filter(station=station, recorded_at=when).exists():
                            raise ValueError('Bazadagi o‘lchov takrorlanmoqda: '+code+' '+timestamp)
                        flow = decimal_value(record['flow_lps'], 'flow_lps', 3, 12)
                        level = decimal_value(record['level_cm'], 'level_cm', 2, 11) if record['level_cm'] else None
                        value = Reading(station=station, recorded_at=when, flow_lps=flow,
                                        level_cm=level, source=Reading.MANUAL)
                        value.full_clean()
                        value.save()
                if not opts['apply']:
                    transaction.set_rollback(True)
        except Exception as exc:
            raise CommandError(f'CSV {current_line}-qator: {exc}') from exc
        state = 'SAQLANDI' if opts['apply'] else 'DRY RUN — BAZAGA YOZILMADI'
        self.stdout.write(self.style.SUCCESS(f'{kind}: {len(rows)} qator tekshirildi. {state}. SHA256: {hashlib.sha256(data).hexdigest()[:16]}'))
