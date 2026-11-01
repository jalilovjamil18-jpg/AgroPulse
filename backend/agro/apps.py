from django.apps import AppConfig
class AgroConfig(AppConfig):
 default_auto_field='django.db.models.BigAutoField'
 name='agro'
 def ready(self):
  import agro.signals  # noqa
