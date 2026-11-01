from django.core.management.base import BaseCommand
from agro.models import District
class Command(BaseCommand):
 help='Create Qorako‘l district metadata only. No sensors, figures or sample readings.'
 def handle(self,*args,**options):
  district,created=District.objects.get_or_create(name='Qorako‘l',defaults={'province':'Buxoro'})
  self.stdout.write(self.style.SUCCESS(f'District: {district.name}; created={created}. No invented readings.'))
