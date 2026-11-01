"""Non-mutating environment/data sanity checks before staging/production deployment."""
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import connection

from agro.models import District, Canal, Station, Reading


class Command(BaseCommand):
    help = 'Check Qorako‘l pilot deployment and device provisioning (read only).'

    def add_arguments(self, parser):
        parser.add_argument('--production', action='store_true', help='Fail if production safeguards missing')

    def handle(self, *args, **opts):
        failures = []
        warnings = []
        engine = connection.settings_dict['ENGINE']
        self.stdout.write('AgroPulse pilot preflight: '+engine)
        try:
            with connection.cursor() as cursor:
                cursor.execute('SELECT 1')
                cursor.fetchone()
        except Exception as exc:
            raise CommandError(f'Database unavailable: {exc.__class__.__name__}') from exc
        self.stdout.write(self.style.SUCCESS('OK: database connection'))
        if opts['production']:
            if settings.DEBUG:
                failures.append('DJANGO_DEBUG=0 required')
            if 'postgresql' not in engine:
                failures.append('PostgreSQL is required in production')
            if settings.SECRET_KEY.startswith(('local-only', 'replace-')) or len(settings.SECRET_KEY) < 48:
                failures.append('Generate a strong unique secret key')
            if not settings.SECURE_SSL_REDIRECT:
                failures.append('SECURE_SSL_REDIRECT must be enabled')
            if set(settings.ALLOWED_HOSTS) <= {'localhost', '127.0.0.1'}:
                failures.append('Add explicit production hostname to DJANGO_ALLOWED_HOSTS')
            if any('localhost' in host or '127.0.0.1' in host for host in settings.CORS_ALLOWED_ORIGINS):
                warnings.append('Remove local origins from CORS_ALLOWED_ORIGINS when public')
        necessary_tables = {'agro_district', 'agro_canal', 'agro_station', 'agro_reading'}
        missing_tables = necessary_tables - set(connection.introspection.table_names())
        if missing_tables:
            msg = 'Database tables missing; run manage.py migrate after backups: '+', '.join(sorted(missing_tables))
            if opts['production']:
                failures.append(msg)
            else:
                warnings.append(msg)
            for item in warnings:
                self.stdout.write(self.style.WARNING('WARNING: '+item))
            for item in failures:
                self.stdout.write(self.style.ERROR('FAIL: '+item))
            if failures:
                raise CommandError(f'{len(failures)} production conditions not satisfied')
            return
        districts = District.objects.count()
        canals = Canal.objects.count()
        stations = Station.objects.count()
        enabled = Station.objects.filter(is_enabled=True).count()
        provisioned = Station.objects.filter(is_enabled=True).exclude(ingest_key_hash='').count()
        received = Station.objects.filter(last_device_ingest_at__isnull=False).count()
        readings = Reading.objects.count()
        self.stdout.write(f'Districts={districts}  Canals={canals}  Stations={stations}  Enabled={enabled}')
        self.stdout.write(f'Device keys={provisioned}  Successful device receipts={received}  Readings={readings}')
        if stations == 0:
            warnings.append('No station records: add confirmed pilot inventory first')
        if enabled and not provisioned:
            warnings.append('No enabled station has a device key: issue keys privately')
        for item in warnings:
            self.stdout.write(self.style.WARNING('WARNING: '+item))
        for item in failures:
            self.stdout.write(self.style.ERROR('FAIL: '+item))
        if failures:
            raise CommandError(f'{len(failures)} production conditions not satisfied')
        self.stdout.write(self.style.SUCCESS('Preflight finished (warnings are not approvals).'))
