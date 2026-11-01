"""Provision/rotate/revoke per-station secrets. Never persist or print them again."""
import hashlib
import secrets
from django.core.management.base import BaseCommand, CommandError
from agro.models import Station


class Command(BaseCommand):
    help = 'Generate a unique device key once; --rotate to replace, --revoke to disable.'

    def add_arguments(self, parser):
        parser.add_argument('station_code')
        group = parser.add_mutually_exclusive_group()
        group.add_argument('--rotate', action='store_true', help='Replace an existing key (old key stops working)')
        group.add_argument('--revoke', action='store_true', help='Disable device ingestion key')

    def handle(self, *args, **opts):
        station = Station.objects.filter(code=opts['station_code']).first()
        if not station:
            raise CommandError('Station not found: register the station in Django admin first.')
        if opts['revoke']:
            if not station.ingest_key_hash:
                self.stdout.write('No active device key to revoke.')
                return
            station.ingest_key_hash = ''
            station.save(update_fields=['ingest_key_hash'])
            self.stdout.write(self.style.WARNING('Device key revoked; future device uploads rejected.'))
            return
        if station.ingest_key_hash and not opts['rotate']:
            raise CommandError('This station already has a key; use --rotate to explicitly revoke it and issue a new one.')
        secret = secrets.token_urlsafe(40)
        station.ingest_key_hash = hashlib.sha256(secret.encode('utf-8')).hexdigest()
        station.save(update_fields=['ingest_key_hash'])
        self.stdout.write(self.style.WARNING('The raw secret is displayed only once; do not commit or share it.'))
        self.stdout.write('Device key: '+secret)
