from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand,CommandError
from agro.models import District,Profile
class Command(BaseCommand):
 help='Assign an existing account a role and district (admin CLI only).'
 def add_arguments(self,parser):
  parser.add_argument('username');parser.add_argument('role',choices=[r for r,_ in Profile.ROLES])
  parser.add_argument('--district',default='Qorako‘l')
 def handle(self,*args,**opt):
  user=get_user_model().objects.filter(username=opt['username']).first()
  if user is None:raise CommandError('User not found; create using createsuperuser or Django admin.')
  district=District.objects.filter(name=opt['district']).first()
  if district is None:raise CommandError('District missing; run init_qorakol')
  profile,_=Profile.objects.get_or_create(user=user)
  profile.role=opt['role'];profile.district=district;profile.save()
  self.stdout.write(self.style.SUCCESS(f'{user.username}: {profile.role} / {district.name}'))
