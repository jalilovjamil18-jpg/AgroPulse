"""Import verified Qorako‘l area/canal/station catalog from an operator-approved CSV.

Default is an atomic dry run. There are deliberately no example rows in shipped files.
"""
import csv
from pathlib import Path
from datetime import date
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from agro.models import Area, Canal, Station, District

FIELDS = {
    'areas': ('name',),
    'canals': ('code', 'name', 'area_name'),
    'stations': ('code', 'name', 'canal_code', 'is_enabled'),
}


class Command(BaseCommand):
    help = 'Verified CSV metadata import for Qorako‘l. Dry-run unless --apply is passed.'

    def add_arguments(self, parser):
        parser.add_argument('kind', choices=sorted(FIELDS))
        parser.add_argument('csv_file')
        parser.add_argument('--district', default='Qorako‘l')
        parser.add_argument('--apply', action='store_true', help='Commit valid records')

    def handle(self, *args, **options):
        kind = options['kind']
        path = Path(options['csv_file'])
        if not path.is_file():
            raise CommandError(f'CSV fayl topilmadi: {path}')
        district = District.objects.filter(name=options['district']).first()
        if district is None:
            raise CommandError('Tuman topilmadi. Avval init_qorakol ni ishlating.')
        with path.open('r', encoding='utf-8-sig', newline='') as f:
            reader = csv.DictReader(f)
            headers = set(reader.fieldnames or [])
            missing = set(FIELDS[kind]) - headers
            if missing:
                raise CommandError('CSV ustunlari yetishmayapti: ' + ', '.join(sorted(missing)))
            rows = list(reader)
        if not rows:
            raise CommandError('CSV bo‘sh. Hech qanday yozuv qo‘shilmadi.')
        if len(rows) > 2000:
            raise CommandError('Bitta yuklashda eng ko‘pi 2000 satr.')
        try:
            with transaction.atomic():
                for number, raw in enumerate(rows, 2):
                    row = {key: (value or '').strip() for key, value in raw.items() if key}
                    if kind == 'areas':
                        if not row['name']:
                            raise ValueError('name bo‘sh')
                        instance, _ = Area.objects.get_or_create(district=district, name=row['name'])
                    elif kind == 'canals':
                        if not row['code'] or not row['name']:
                            raise ValueError('code yoki name bo‘sh')
                        area = None
                        if row['area_name']:
                            area = Area.objects.filter(district=district, name=row['area_name']).first()
                            if area is None:
                                raise ValueError(f'Hudud bazada yo‘q: {row["area_name"]}')
                        instance = Canal.objects.filter(code=row['code']).first()
                        if instance and instance.district_id != district.pk:
                            raise ValueError('Kanal kodi boshqa tumanda band')
                        instance = instance or Canal(code=row['code'], district=district)
                        instance.name = row['name']
                        instance.area = area
                        instance.full_clean()
                        instance.save()
                    else:
                        if not row['code'] or not row['name'] or not row['canal_code']:
                            raise ValueError('code, name va canal_code majburiy')
                        canal = Canal.objects.filter(code=row['canal_code'], district=district).first()
                        if canal is None:
                            raise ValueError('Kanal bazada topilmadi: ' + row['canal_code'])
                        instance = Station.objects.filter(code=row['code']).first()
                        if instance and instance.canal.district_id != district.pk:
                            raise ValueError('Qurilma kodi boshqa tumanda band')
                        instance = instance or Station(code=row['code'])
                        instance.canal, instance.name = canal, row['name']
                        enabled = row['is_enabled'].lower()
                        if enabled not in ('true', 'false', '1', '0', 'yes', 'no'):
                            raise ValueError('is_enabled faqat true/false/1/0')
                        instance.is_enabled = enabled in ('true', '1', 'yes')
                        instance.full_clean()
                        instance.save()
                if not options['apply']:
                    transaction.set_rollback(True)
        except Exception as e:
            raise CommandError(f'CSV satri {number}: {e}') from e
        state = 'SAQLANDI' if options['apply'] else 'QURUQ TEKSHIRUV (SAQLANMADI)'
        self.stdout.write(self.style.SUCCESS(f'{kind}: {len(rows)} satr tekshirildi. {state}.'))
