from rest_framework.exceptions import PermissionDenied
from .models import Profile,Canal,Field,Station,Reading,Alert,Area

def role_for(user):
 if user.is_superuser:return Profile.ADMIN
 profile=getattr(user,'agro_profile',None)
 return profile.role if profile else Profile.FARMER

def district_for(user):
 profile=getattr(user,'agro_profile',None)
 return profile.district_id if profile else None

def authorized_canals(user):
 if user.is_superuser:return Canal.objects.all()
 role=role_for(user); dist=district_for(user)
 if not dist:return Canal.objects.none()
 if role==Profile.AUTHORITY:return Canal.objects.filter(district_id=dist)
 if role==Profile.IRRIGATION:return Canal.objects.filter(operators__user=user,district_id=dist).distinct()
 if role==Profile.FARMER:return Canal.objects.filter(district_id=dist,field__owner=user).distinct()
 return Canal.objects.none()

def authorized_fields(user):
 if user.is_superuser:return Field.objects.all()
 role=role_for(user); dist=district_for(user)
 if not dist:return Field.objects.none()
 if role==Profile.AUTHORITY:return Field.objects.filter(district_id=dist)
 if role==Profile.IRRIGATION:return Field.objects.filter(district_id=dist,canal__in=authorized_canals(user))
 return Field.objects.filter(district_id=dist,owner=user)

def authorized_stations(user):
 return Station.objects.filter(canal__in=authorized_canals(user))

def authorized_readings(user):
 return Reading.objects.filter(station__in=authorized_stations(user))

def authorized_areas(user):
 if user.is_superuser:return Area.objects.all()
 dist=district_for(user)
 if not dist:return Area.objects.none()
 role=role_for(user)
 if role==Profile.AUTHORITY:return Area.objects.filter(district_id=dist)
 if role==Profile.IRRIGATION:return Area.objects.filter(canals__in=authorized_canals(user)).distinct()
 return Area.objects.filter(field__owner=user).distinct()

def authorized_alerts(user):
 if user.is_superuser:return Alert.objects.all()
 dist=district_for(user); role=role_for(user)
 if not dist:return Alert.objects.none()
 if role==Profile.AUTHORITY:return Alert.objects.filter(district_id=dist)
 if role==Profile.IRRIGATION:return Alert.objects.filter(district_id=dist,canal__in=authorized_canals(user))
 return Alert.objects.filter(district_id=dist,canal__in=authorized_canals(user))

def require_operator(user,canal):
 if role_for(user) not in (Profile.IRRIGATION,Profile.ADMIN) or not authorized_canals(user).filter(pk=canal.pk).exists():
  raise PermissionDenied('Ushbu kanalga o‘lchov kiritish huquqingiz yo‘q.')
