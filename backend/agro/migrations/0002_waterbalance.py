from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.core.validators

class Migration(migrations.Migration):
    dependencies = [('agro', '0001_initial'), migrations.swappable_dependency(settings.AUTH_USER_MODEL)]
    operations = [
        migrations.CreateModel(
            name='WaterBalance',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('month', models.DateField(help_text='Month start date, e.g. 2026-10-01')),
                ('planned_m3', models.DecimalField(blank=True, decimal_places=3, max_digits=16, null=True, validators=[django.core.validators.MinValueValidator(0)])),
                ('actual_m3', models.DecimalField(blank=True, decimal_places=3, max_digits=16, null=True, validators=[django.core.validators.MinValueValidator(0)])),
                ('document_reference', models.CharField(help_text='Approved source document identification', max_length=250)),
                ('note', models.TextField(blank=True)),
                ('is_verified', models.BooleanField(default=False)),
                ('verified_at', models.DateTimeField(blank=True, editable=False, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('area', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='water_balances', to='agro.area')),
                ('verified_by', models.ForeignKey(blank=True, editable=False, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='verified_water_balances', to=settings.AUTH_USER_MODEL)),
                ('created_by', models.ForeignKey(blank=True, editable=False, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='created_water_balances', to=settings.AUTH_USER_MODEL)),
            ],
            options={'ordering': ['-month', 'area__name']},
        ),
        migrations.AddConstraint(model_name='waterbalance', constraint=models.UniqueConstraint(fields=('area', 'month'), name='unique_water_balance_area_month')),
        migrations.AddConstraint(model_name='waterbalance', constraint=models.CheckConstraint(condition=(models.Q(planned_m3__gte=0) | models.Q(planned_m3__isnull=True)), name='balance_plan_nonnegative')),
        migrations.AddConstraint(model_name='waterbalance', constraint=models.CheckConstraint(condition=(models.Q(actual_m3__gte=0) | models.Q(actual_m3__isnull=True)), name='balance_actual_nonnegative')),
    ]
