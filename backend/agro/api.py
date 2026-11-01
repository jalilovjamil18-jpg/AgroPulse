"""Strictly scoped Qorako‘l pilot API. All readings represent actual user/device input."""
import csv,hashlib,hmac
from django.conf import settings
from datetime import timedelta
from django.contrib.auth import authenticate
from django.http import HttpResponse
from django.db import IntegrityError,transaction
from django.utils import timezone
from django.db.models import Count
from rest_framework import serializers,status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view,permission_classes,throttle_classes
from rest_framework.permissions import AllowAny,IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError,PermissionDenied
from rest_framework.throttling import SimpleRateThrottle
class LoginThrottle(SimpleRateThrottle):
 scope='login'
 def get_cache_key(self,request,view):return self.cache_format % {'scope':self.scope,'ident':self.get_ident(request)}
class DeviceThrottle(SimpleRateThrottle):
 scope='ingest'
 def get_cache_key(self,request,view):return self.cache_format % {'scope':self.scope,'ident':self.get_ident(request)}
from .models import District,Profile,Station,Reading,Alert,Canal
from .security import role_for,district_for,authorized_fields,authorized_canals,authorized_stations,authorized_readings,authorized_areas,authorized_alerts,require_operator

class LoginSerializer(serializers.Serializer):
 username=serializers.CharField(max_length=150)
 password=serializers.CharField(write_only=True)

class ReadingSerializer(serializers.Serializer):
 station_id=serializers.IntegerField(min_value=1)
 recorded_at=serializers.DateTimeField()
 flow_lps=serializers.DecimalField(max_digits=12,decimal_places=3,min_value=0)
 level_cm=serializers.DecimalField(max_digits=11,decimal_places=2,min_value=0,required=False,allow_null=True)
 def validate_recorded_at(self,value):
  if value>timezone.now()+timedelta(minutes=5):raise serializers.ValidationError('Kelajakdagi vaqt qabul qilinmaydi.')
  return value

@api_view(['GET'])
@permission_classes([AllowAny])
def health(request):return Response({'service':'agropulse-api','status':'ok'})

@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([LoginThrottle])
def login(request):
 data=LoginSerializer(data=request.data);data.is_valid(raise_exception=True)
 user=authenticate(request,username=data.validated_data['username'],password=data.validated_data['password'])
 if not user or not user.is_active:return Response({'detail':'Login yoki parol xato.'},status=400)
 token,_=Token.objects.get_or_create(user=user)
 return Response({'token':token.key,'user':describe_user(user)})

def describe_user(user):
 profile=getattr(user,'agro_profile',None)
 dist=profile.district if profile else None
 return {'username':user.username,'full_name':user.get_full_name() or user.username,'role':role_for(user),'district':{'id':dist.pk,'name':dist.name} if dist else None,'is_superuser':user.is_superuser}

@api_view(['POST'])
def logout(request):
 Token.objects.filter(user=request.user).delete()
 return Response({'ok':True})

@api_view(['GET'])
def me(request):return Response(describe_user(request.user))

@api_view(['GET'])
def areas(request):
 return Response([{'id':a.id,'name':a.name,'district_id':a.district_id} for a in authorized_areas(request.user)[:500]])

@api_view(['GET'])
def canals(request):
 return Response([{'id':c.id,'code':c.code,'name':c.name,'area_id':c.area_id,'district_id':c.district_id} for c in authorized_canals(request.user).select_related('area')[:500]])

@api_view(['GET'])
def fields(request):
 return Response([{'id':f.id,'name':f.name,'crop':f.crop,'area_ha':str(f.area_ha),'area_id':f.area_id,'canal_id':f.canal_id} for f in authorized_fields(request.user)[:500]])

@api_view(['GET'])
def stations(request):
 queryset=authorized_stations(request.user).select_related('canal')[:500]
 return Response([{'id':s.id,'code':s.code,'name':s.name,'canal':s.canal.name,'is_enabled':s.is_enabled,'installed_at':s.installed_at} for s in queryset])

def reading_dict(r):
 return {'id':r.id,'station_id':r.station_id,'station_code':r.station.code,'canal_id':r.station.canal_id,'recorded_at':r.recorded_at,'flow_lps':str(r.flow_lps),'level_cm':str(r.level_cm) if r.level_cm is not None else None,'source':r.source}

@api_view(['GET','POST'])
def readings(request):
 if request.method=='GET':
  queryset=authorized_readings(request.user).select_related('station').order_by('-recorded_at')
  station_id=request.query_params.get('station_id')
  if station_id:
   if not station_id.isdigit():raise ValidationError({'station_id':'Butun son bo‘lishi kerak.'})
   queryset=queryset.filter(station_id=int(station_id))
  return Response([reading_dict(r) for r in queryset[:200]])
 data=ReadingSerializer(data=request.data);data.is_valid(raise_exception=True)
 station=Station.objects.filter(pk=data.validated_data['station_id'],is_enabled=True).first()
 if station is None:return Response({'detail':'Qurilma topilmadi yoki o‘chirilgan.'},status=404)
 require_operator(request.user,station.canal)
 payload={k:v for k,v in data.validated_data.items() if k!='station_id'}
 try:
  with transaction.atomic():
   record=Reading.objects.create(station=station,source=Reading.MANUAL,created_by=request.user,**payload)
 except IntegrityError:
  return Response({'detail':'Bu vaqt uchun o‘lchov mavjud.'},status=409)
 return Response(reading_dict(record),status=201)

@api_view(['GET'])
def alerts(request):
 return Response([{'id':a.id,'title':a.title,'description':a.description,'status':a.status,'canal_id':a.canal_id,'created_at':a.created_at} for a in authorized_alerts(request.user)[:100]])

class AlertInputSerializer(serializers.Serializer):
    canal_id=serializers.IntegerField(min_value=1)
    title=serializers.CharField(max_length=180)
    description=serializers.CharField(required=False,allow_blank=True,max_length=5000)

@api_view(['POST'])
def create_alert(request):
    if role_for(request.user) not in (Profile.IRRIGATION,Profile.ADMIN):
        raise PermissionDenied('Ogohlantirish yaratish uchun operator yoki administrator huquqi kerak.')
    form=AlertInputSerializer(data=request.data)
    form.is_valid(raise_exception=True)
    canal=authorized_canals(request.user).filter(pk=form.validated_data['canal_id']).first()
    if canal is None:raise PermissionDenied('Bu kanal bo‘yicha ogohlantirish yaratish huquqi yo‘q.')
    alert=Alert.objects.create(district=canal.district,canal=canal,title=form.validated_data['title'],
                               description=form.validated_data.get('description',''))
    return Response({'id':alert.id,'status':alert.status,'title':alert.title},status=201)

@api_view(['POST'])
def resolve_alert(request,pk):
    if role_for(request.user) not in (Profile.IRRIGATION,Profile.ADMIN):
        raise PermissionDenied('Ogohlantirishni yopish uchun operator yoki administrator huquqi kerak.')
    alert=authorized_alerts(request.user).filter(pk=pk).first()
    if not alert or not alert.canal_id or not authorized_canals(request.user).filter(pk=alert.canal_id).exists():
        raise PermissionDenied('Bu ogohlantirish bo‘yicha huquq yo‘q.')
    if alert.status==Alert.RESOLVED:
        return Response({'id':alert.id,'status':alert.status,'already_resolved':True})
    alert.status=Alert.RESOLVED
    alert.resolved_at=timezone.now()
    alert.save(update_fields=['status','resolved_at'])
    return Response({'id':alert.id,'status':alert.status})

@api_view(['GET'])
def summary(request):
 user=request.user
 station_qs=authorized_stations(user)
 reading_qs=authorized_readings(user)
 last=reading_qs.select_related('station').order_by('-recorded_at').first()
 # A point flow rate must NOT be summed into district volume. Only legitimate readings are returned.
 return Response({
  'pilot':'Qorako‘l', 'demo':False, 'data_source':'manual_or_device_records',
  'user':describe_user(user),
  'counts':{'areas':authorized_areas(user).count(),'canals':authorized_canals(user).count(),
            'fields':authorized_fields(user).count(),'stations':station_qs.count(),
            'enabled_stations':station_qs.filter(is_enabled=True).count(),
            'readings':reading_qs.count(), 'open_alerts':authorized_alerts(user).filter(status='open').count()},
  'latest_reading':reading_dict(last) if last else None,
  'last_recorded_at':last.recorded_at if last else None,
  'units':{'flow':'l/s','level':'cm','field_area':'ha'},
  'notice':'O‘lchov bo‘lmasa qiymat ko‘rsatilmaydi. L/s — oqim tezligi, umumiy m³ hajm emas.',
 })

@api_view(['GET'])
def export_readings(request):
 qs=authorized_readings(request.user).select_related('station','station__canal').order_by('-recorded_at')[:10000]
 response=HttpResponse(content_type='text/csv; charset=utf-8')
 response['Content-Disposition']='attachment; filename="agropulse_readings.csv"'
 response.write('\ufeff')
 w=csv.writer(response);w.writerow(['station_code','canal','recorded_at','flow_lps','level_cm','source'])
 for r in qs:w.writerow([r.station.code,r.station.canal.name,r.recorded_at.isoformat(),r.flow_lps,r.level_cm or '',r.source])
 return response

@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([DeviceThrottle])
def ingest(request):
 """Accept a device measurement under a per-station secret (HTTPS required in deployment).

 A retry with the *same* values, timestamp and source is idempotent (200).
 A collision with different values, or a manual record, is a 409 conflict.
 """
 serializer=ReadingSerializer(data=request.data);serializer.is_valid(raise_exception=True)
 station=Station.objects.filter(pk=serializer.validated_data['station_id'],is_enabled=True).first()
 raw=request.headers.get('X-Device-Key','')
 if not station or not raw or len(raw)>256 or not station.ingest_key_hash or not hmac.compare_digest(station.ingest_key_hash,hashlib.sha256(raw.encode()).hexdigest()):
  return Response({'detail':'Qurilma autentifikatsiyasi muvaffaqiyatsiz.'},status=403)
 payload={k:v for k,v in serializer.validated_data.items() if k!='station_id'}
 # 5 minutes future tolerance is already checked by ReadingSerializer.
 max_age_days=getattr(settings,'AGRO_DEVICE_MAX_AGE_DAYS',30)
 if payload['recorded_at']<timezone.now()-timedelta(days=max_age_days):
  return Response({'recorded_at':f'Qurilma o‘lchovi {max_age_days} kundan eski. Operator bilan bog‘laning.'},status=400)
 try:
  with transaction.atomic():
   rec=Reading.objects.create(station=station,source=Reading.DEVICE,**payload)
   Station.objects.filter(pk=station.pk).update(last_device_ingest_at=timezone.now())
 except IntegrityError:
  existing=Reading.objects.filter(station=station,recorded_at=payload['recorded_at']).first()
  if (existing and existing.source==Reading.DEVICE and existing.flow_lps==payload['flow_lps']
      and existing.level_cm==payload.get('level_cm')):
   Station.objects.filter(pk=station.pk).update(last_device_ingest_at=timezone.now())
   return Response({'id':existing.pk,'accepted':True,'duplicate':True},status=200)
  return Response({'detail':'Bu vaqt uchun boshqa o‘lchov mavjud.'},status=409)
 return Response({'id':rec.pk,'accepted':True,'duplicate':False},status=201)
