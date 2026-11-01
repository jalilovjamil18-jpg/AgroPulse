from django.contrib import admin
from .models import District, Area, Canal, Profile, Field, Station, Reading, Alert
@admin.register(District)
class DistrictAdmin(admin.ModelAdmin):list_display=('name','province')
@admin.register(Area)
class AreaAdmin(admin.ModelAdmin):list_display=('name','district');list_filter=('district',)
@admin.register(Canal)
class CanalAdmin(admin.ModelAdmin):list_display=('code','name','district','area');list_filter=('district',)
@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):list_display=('user','role','district','organization');list_filter=('role','district');filter_horizontal=('assigned_canals',)
@admin.register(Field)
class FieldAdmin(admin.ModelAdmin):list_display=('name','owner','area_ha','district','canal');list_filter=('district',)
@admin.register(Station)
class StationAdmin(admin.ModelAdmin):
    list_display=('code','name','canal','is_enabled','key_provisioned','last_device_ingest_at')
    list_filter=('is_enabled','canal__district')
    readonly_fields=('last_device_ingest_at',)
    @admin.display(boolean=True,description='Device key bor')
    def key_provisioned(self,obj):return bool(obj.ingest_key_hash)
@admin.register(Reading)
class ReadingAdmin(admin.ModelAdmin):list_display=('station','recorded_at','flow_lps','source','created_by');list_filter=('source',)
@admin.register(Alert)
class AlertAdmin(admin.ModelAdmin):list_display=('title','district','canal','status','created_at');list_filter=('district','status')


from django.utils import timezone
from django.db import transaction
from .models import WaterBalance

@admin.register(WaterBalance)
class WaterBalanceAdmin(admin.ModelAdmin):
    list_display = ('area', 'month', 'planned_m3', 'actual_m3', 'document_reference', 'is_verified', 'verified_at')
    list_filter = ('is_verified', 'month', 'area__district')
    search_fields = ('area__name', 'document_reference')
    actions = ['verify_selected']
    list_select_related = ('area',)

    def get_readonly_fields(self, request, obj=None):
        if obj and obj.is_verified:
            return ('area','month','planned_m3','actual_m3','document_reference','note',
                    'is_verified','verified_at','verified_by','created_by','created_at','updated_at')
        return ('is_verified','verified_at','verified_by','created_by','created_at','updated_at')

    def has_delete_permission(self, request, obj=None):
        # A verified official record must not disappear without a separate review workflow.
        return obj is not None and not obj.is_verified and super().has_delete_permission(request,obj)

    def save_model(self, request, obj, form, change):
        if not change: obj.created_by = request.user
        obj.full_clean()
        super().save_model(request, obj, form, change)

    @admin.action(description='Tekshirilgan hujjat asosida tanlangan qoralamalarni tasdiqlash')
    def verify_selected(self, request, queryset):
        if not request.user.is_superuser:
            self.message_user(request, 'Faqat superuser tasdiqlashi mumkin.', level='error')
            return
        confirmed = 0
        with transaction.atomic():
            for obj in queryset.select_for_update().filter(is_verified=False):
                obj.is_verified = True
                obj.verified_by = request.user
                obj.verified_at = timezone.now()
                obj.full_clean()
                obj.save(update_fields=['is_verified','verified_by','verified_at','updated_at'])
                confirmed += 1
        self.message_user(request, f'{confirmed} ta hujjatli yozuv tasdiqlandi.')
