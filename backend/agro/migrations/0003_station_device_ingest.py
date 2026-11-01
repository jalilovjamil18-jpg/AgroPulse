from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [('agro', '0002_waterbalance')]
    operations = [
        migrations.AddField(
            model_name='station',
            name='last_device_ingest_at',
            field=models.DateTimeField(blank=True, db_index=True, editable=False, null=True),
        ),
    ]
