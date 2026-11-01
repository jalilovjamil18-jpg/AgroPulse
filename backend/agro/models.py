from django.conf import settings
from django.db import models
from django.core.validators import MinValueValidator
from django.core.exceptions import ValidationError

class District(models.Model):
 name=models.CharField(max_length=120,unique=True)
 province=models.CharField(max_length=120,default='Buxoro')
 def __str__(self):return self.name

class Area(models.Model):
 district=models.ForeignKey(District,on_delete=models.PROTECT,related_name='areas')
 name=models.CharField(max_length=140)
 class Meta:unique_together=[('district','name')];ordering=['name']
 def __str__(self):return f'{self.district} / {self.name}'

class Canal(models.Model):
 district=models.ForeignKey(District,on_delete=models.PROTECT,related_name='canals')
 area=models.ForeignKey(Area,on_delete=models.SET_NULL,null=True,blank=True,related_name='canals')
 name=models.CharField(max_length=150)
 code=models.CharField(max_length=40,unique=True)
 description=models.TextField(blank=True)
 class Meta:ordering=['name']
 def clean(self):
  if self.area_id and self.district_id and self.area.district_id!=self.district_id:
   raise ValidationError({'area':'Hudud kanal tumaniga tegishli emas.'})
 def __str__(self):return self.name

class Profile(models.Model):
 FARMER='farmer'; IRRIGATION='irrigation'; AUTHORITY='authority'; ADMIN='admin'
 ROLES=[(FARMER,'Fermer'),(IRRIGATION,'Irrigatsiya'),(AUTHORITY,'Hokimiyat'),(ADMIN,'Administrator')]
 user=models.OneToOneField(settings.AUTH_USER_MODEL,on_delete=models.CASCADE,related_name='agro_profile')
 role=models.CharField(max_length=20,choices=ROLES,default=FARMER)
 district=models.ForeignKey(District,on_delete=models.PROTECT,null=True,blank=True)
 assigned_canals=models.ManyToManyField(Canal,blank=True,related_name='operators')
 organization=models.CharField(max_length=200,blank=True)
 def __str__(self):return f'{self.user.username} - {self.role}'

class Field(models.Model):
 owner=models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.PROTECT,related_name='farm_fields')
 district=models.ForeignKey(District,on_delete=models.PROTECT)
 area=models.ForeignKey(Area,on_delete=models.SET_NULL,null=True,blank=True)
 canal=models.ForeignKey(Canal,on_delete=models.SET_NULL,null=True,blank=True)
 name=models.CharField(max_length=150)
 crop=models.CharField(max_length=100,blank=True)
 area_ha=models.DecimalField(max_digits=11,decimal_places=3,validators=[MinValueValidator(0)])
 class Meta:ordering=['name']
 def clean(self):
  if self.area_id and self.district_id and self.area.district_id!=self.district_id:
   raise ValidationError({'area':'Hudud dala tumaniga tegishli emas.'})
  if self.canal_id and self.district_id and self.canal.district_id!=self.district_id:
   raise ValidationError({'canal':'Kanal dala tumaniga tegishli emas.'})
 def __str__(self):return self.name

class Station(models.Model):
 code=models.CharField(max_length=60,unique=True)
 canal=models.ForeignKey(Canal,on_delete=models.PROTECT,related_name='stations')
 name=models.CharField(max_length=150)
 is_enabled=models.BooleanField(default=True)
 ingest_key_hash=models.CharField(max_length=64,blank=True,editable=False)
 installed_at=models.DateField(null=True,blank=True)
 # The last successful device-key API receipt time, not a physical connectivity probe.
 last_device_ingest_at=models.DateTimeField(null=True,blank=True,editable=False,db_index=True)
 class Meta:ordering=['code']
 def __str__(self):return self.code

class Reading(models.Model):
 MANUAL='manual'; DEVICE='device'; SOURCES=[(MANUAL,'Qo‘lda kiritilgan'),(DEVICE,'Qurilma')]
 station=models.ForeignKey(Station,on_delete=models.PROTECT,related_name='readings')
 recorded_at=models.DateTimeField(db_index=True)
 flow_lps=models.DecimalField(max_digits=12,decimal_places=3,validators=[MinValueValidator(0)],help_text='Instantaneous flow in liters per second, not total volume')
 level_cm=models.DecimalField(max_digits=11,decimal_places=2,null=True,blank=True,validators=[MinValueValidator(0)])
 source=models.CharField(max_length=10,choices=SOURCES,default=MANUAL)
 created_by=models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.SET_NULL,null=True,blank=True)
 created_at=models.DateTimeField(auto_now_add=True)
 class Meta:constraints=[models.UniqueConstraint(fields=['station','recorded_at'],name='one_reading_per_station_time')];ordering=['-recorded_at']

class Alert(models.Model):
 OPEN='open'; RESOLVED='resolved'; STATES=[(OPEN,'Ochiq'),(RESOLVED,'Yopilgan')]
 district=models.ForeignKey(District,on_delete=models.PROTECT)
 canal=models.ForeignKey(Canal,on_delete=models.SET_NULL,null=True,blank=True)
 title=models.CharField(max_length=180)
 description=models.TextField(blank=True)
 status=models.CharField(max_length=10,choices=STATES,default=OPEN)
 created_at=models.DateTimeField(auto_now_add=True)
 resolved_at=models.DateTimeField(null=True,blank=True)
 class Meta:ordering=['-created_at']


class WaterBalance(models.Model):
    """Document-backed monthly m³ values, never inferred from l/s samples."""
    area = models.ForeignKey(Area, on_delete=models.PROTECT, related_name='water_balances')
    month = models.DateField(help_text='Month start date, e.g. 2026-10-01')
    planned_m3 = models.DecimalField(max_digits=16, decimal_places=3, null=True, blank=True, validators=[MinValueValidator(0)])
    actual_m3 = models.DecimalField(max_digits=16, decimal_places=3, null=True, blank=True, validators=[MinValueValidator(0)])
    document_reference = models.CharField(max_length=250, help_text='Approved source document identification')
    note = models.TextField(blank=True)
    is_verified = models.BooleanField(default=False)
    verified_at = models.DateTimeField(null=True, blank=True, editable=False)
    verified_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, null=True, blank=True,
                                   related_name='verified_water_balances', editable=False)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
                                  related_name='created_water_balances', editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-month', 'area__name']
        constraints = [
            models.UniqueConstraint(fields=['area', 'month'], name='unique_water_balance_area_month'),
            models.CheckConstraint(condition=models.Q(planned_m3__gte=0) | models.Q(planned_m3__isnull=True), name='balance_plan_nonnegative'),
            models.CheckConstraint(condition=models.Q(actual_m3__gte=0) | models.Q(actual_m3__isnull=True), name='balance_actual_nonnegative'),
        ]

    def clean(self):
        from django.utils import timezone
        errors = {}
        if self.month and self.month.day != 1:
            errors['month'] = 'Oyni YYYY-MM-01 shaklida belgilang.'
        if self.planned_m3 is None and self.actual_m3 is None:
            errors['planned_m3'] = 'Reja yoki amaldagi hajmning kamida bittasi kiritilsin.'
        if not self.document_reference or not self.document_reference.strip():
            errors['document_reference'] = 'Hujjat raqami / manbasi majburiy.'
        if self.month and self.actual_m3 is not None and self.month > timezone.localdate().replace(day=1):
            errors['actual_m3'] = 'Kelajakdagi oy uchun amaldagi suv hajmi kiritilmaydi.'
        if self.is_verified and (not self.verified_by_id or not self.verified_at):
            errors['is_verified'] = 'Tasdiqlash faqat administrator tomonidan amalga oshiriladi.'
        if errors: raise ValidationError(errors)

    def __str__(self):
        return f'{self.area} / {self.month:%Y-%m}'
