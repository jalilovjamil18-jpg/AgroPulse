"""Auditable water balance CSV: dry-run default, all-or-nothing apply, drafts only."""
import csv
from datetime import date
from decimal import Decimal, InvalidOperation
from pathlib import Path
from django.core.exceptions import ValidationError
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from agro.models import Area, WaterBalance

FIELDS = ['area_name', 'month', 'planned_m3', 'actual_m3', 'document_reference', 'note']

class Command(BaseCommand):
    help = 'Import document-backed monthly area water balance as UNVERIFIED drafts.'

    def add_arguments(self, parser):
        parser.add_argument('csv_file')
        parser.add_argument('--district', required=True, help='Exactly one district ID')
        parser.add_argument('--apply', action='store_true', help='Actually create drafts (default: validate only)')

    def handle(self, *args, **options):
        path = Path(options['csv_file'])
        if not path.is_file(): raise CommandError(f'CSV topilmadi: {path}')
        try: district_id = int(options['district'])
        except ValueError: raise CommandError('District ID butun son bo‘lsin.')
        if district_id <= 0: raise CommandError('District ID musbat bo‘lsin.')
        from agro.models import District
        if not District.objects.filter(pk=district_id).exists():
            raise CommandError('Tuman topilmadi. Avval init_qorakol yarating.')
        rows = []
        try:
            with path.open(encoding='utf-8-sig', newline='') as f:
                reader = csv.DictReader(f)
                if not reader.fieldnames or not set(FIELDS).issubset(reader.fieldnames):
                    raise CommandError('CSV sarlavhasi: '+','.join(FIELDS))
                for line, row in enumerate(reader, start=2):
                    if line > 2001: raise CommandError('Eng ko‘p 2000 qator yuklang.')
                    if not any((v or '').strip() for v in row.values() if isinstance(v, str)):
                        continue
                    name = (row.get('area_name') or '').strip()
                    area = Area.objects.filter(district_id=district_id, name=name).first()
                    if not area: raise CommandError(f'{line}-qator: bu tumanda hudud topilmadi: {name}')
                    month_text = (row.get('month') or '').strip()
                    try:
                        if len(month_text)!=7 or month_text[4]!='-': raise ValueError
                        month = date(int(month_text[:4]),int(month_text[5:]),1)
                    except ValueError: raise CommandError(f'{line}-qator: month YYYY-MM bo‘lsin.')
                    def amount(key):
                        raw = (row.get(key) or '').strip()
                        if not raw: return None
                        try:
                            value = Decimal(raw)
                            if not value.is_finite() or value < 0 or value.as_tuple().exponent < -3 or value >= Decimal('10000000000000'):
                                raise ValueError
                        except (InvalidOperation,ValueError):
                            raise CommandError(f'{line}-qator: {key} uchun noto‘g‘ri m³ qiymat.')
                        return value
                    record = WaterBalance(area=area, month=month, planned_m3=amount('planned_m3'),
                                          actual_m3=amount('actual_m3'), document_reference=(row.get('document_reference') or '').strip(),
                                          note=(row.get('note') or '').strip())
                    try: record.full_clean()
                    except ValidationError as exc: raise CommandError(f'{line}-qator: {exc}')
                    rows.append(record)
        except (OSError,UnicodeError,csv.Error) as exc: raise CommandError(str(exc))
        keys = [(r.area_id,r.month) for r in rows]
        if len(set(keys)) != len(keys): raise CommandError('CSV ichida takroriy hudud/oy bor.')
        if WaterBalance.objects.filter(area_id__in=[a for a,m in keys],month__in=[m for a,m in keys]).exists():
            # precise check below rather than reject unrelated cross-products
            existing = set(WaterBalance.objects.filter(area_id__in=[a for a,m in keys],month__in=[m for a,m in keys]).values_list('area_id','month'))
            if any(key in existing for key in keys): raise CommandError('Bazadagi mavjud hudud/oy avtomatik ustidan yozilmaydi.')
        self.stdout.write(f'{len(rows)} qator tekshirildi, tuman ID={district_id}.')
        if not options['apply']:
            self.stdout.write(self.style.WARNING('DRY RUN: hech narsa bazaga saqlanmadi. --apply bilan draft qo‘shing.'))
            return
        with transaction.atomic():
            WaterBalance.objects.bulk_create(rows)
        self.stdout.write(self.style.SUCCESS(f'{len(rows)} ta TASDIQLANMAGAN yozuv yaratildi. Admin → Water balances orqali manbani ko‘rib tasdiqlang.'))
