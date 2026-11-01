"""AgroPulse Qorako‘l pilot. No secret or sample data is embedded in source."""
import os
from pathlib import Path
from django.core.exceptions import ImproperlyConfigured
BASE_DIR = Path(__file__).resolve().parent.parent
from dotenv import load_dotenv
load_dotenv(BASE_DIR / '.env')
DEBUG = os.getenv('DJANGO_DEBUG','1') == '1'
AGRO_DEVICE_MAX_AGE_DAYS = int(os.getenv('AGRO_DEVICE_MAX_AGE_DAYS','30'))
if AGRO_DEVICE_MAX_AGE_DAYS < 1 or AGRO_DEVICE_MAX_AGE_DAYS > 365:
 raise ImproperlyConfigured('AGRO_DEVICE_MAX_AGE_DAYS must be between 1 and 365')
SECRET_KEY = os.getenv('DJANGO_SECRET_KEY','local-only-change-before-deploy')
if not DEBUG and (not SECRET_KEY or len(SECRET_KEY)<48 or SECRET_KEY.startswith(('local-only','replace-'))):
 raise ImproperlyConfigured('Set a strong unique DJANGO_SECRET_KEY (48+ characters) in production')
ALLOWED_HOSTS = [h.strip() for h in os.getenv('DJANGO_ALLOWED_HOSTS','127.0.0.1,localhost').split(',') if h.strip()]
INSTALLED_APPS = ['django.contrib.admin','django.contrib.auth','django.contrib.contenttypes','django.contrib.sessions','django.contrib.messages','django.contrib.staticfiles','rest_framework','rest_framework.authtoken','corsheaders','agro']
MIDDLEWARE = ['django.middleware.security.SecurityMiddleware','whitenoise.middleware.WhiteNoiseMiddleware','corsheaders.middleware.CorsMiddleware','django.contrib.sessions.middleware.SessionMiddleware','django.middleware.common.CommonMiddleware','django.middleware.csrf.CsrfViewMiddleware','django.contrib.auth.middleware.AuthenticationMiddleware','django.contrib.messages.middleware.MessageMiddleware','django.middleware.clickjacking.XFrameOptionsMiddleware']
ROOT_URLCONF='config.urls'; TEMPLATES=[{'BACKEND':'django.template.backends.django.DjangoTemplates','DIRS':[],'APP_DIRS':True,'OPTIONS':{'context_processors':['django.template.context_processors.debug','django.template.context_processors.request','django.contrib.auth.context_processors.auth','django.contrib.messages.context_processors.messages']}}]
WSGI_APPLICATION='config.wsgi.application'
if not DEBUG and not os.getenv('DATABASE_URL','').startswith(('postgresql://','postgres://')):
 raise ImproperlyConfigured('Production requires a PostgreSQL DATABASE_URL.')
if os.getenv('DATABASE_URL'):
 import dj_database_url
 DATABASES={'default':dj_database_url.config(conn_max_age=60,conn_health_checks=True)}
else:
 DATABASES={'default':{'ENGINE':'django.db.backends.sqlite3','NAME':BASE_DIR/'db.sqlite3'}}
AUTH_PASSWORD_VALIDATORS=[{'NAME':'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},{'NAME':'django.contrib.auth.password_validation.MinimumLengthValidator'},{'NAME':'django.contrib.auth.password_validation.CommonPasswordValidator'},{'NAME':'django.contrib.auth.password_validation.NumericPasswordValidator'}]
LANGUAGE_CODE='uz';TIME_ZONE='Asia/Tashkent'; USE_I18N=True;USE_TZ=True
STATIC_URL='static/'; STATIC_ROOT=BASE_DIR/'staticfiles'
STORAGES={'staticfiles':{'BACKEND':'whitenoise.storage.CompressedManifestStaticFilesStorage'}}
DEFAULT_AUTO_FIELD='django.db.models.BigAutoField'
CORS_ALLOWED_ORIGINS=[v.strip() for v in os.getenv('CORS_ALLOWED_ORIGINS','http://127.0.0.1:3000,http://localhost:3000').split(',') if v.strip()]
CSRF_TRUSTED_ORIGINS=[v.strip() for v in os.getenv('CSRF_TRUSTED_ORIGINS','http://127.0.0.1:3000,http://localhost:3000').split(',') if v.strip()]
REST_FRAMEWORK={
 'DEFAULT_AUTHENTICATION_CLASSES':['rest_framework.authentication.TokenAuthentication'],
 'DEFAULT_PERMISSION_CLASSES':['rest_framework.permissions.IsAuthenticated'],
 'DEFAULT_RENDERER_CLASSES':['rest_framework.renderers.JSONRenderer'],
 'DEFAULT_THROTTLE_CLASSES':['rest_framework.throttling.AnonRateThrottle','rest_framework.throttling.UserRateThrottle'],
 'DEFAULT_THROTTLE_RATES':{'anon':'30/min','user':'240/min','login':'10/min','ingest':'120/min'},
 'DEFAULT_PAGINATION_CLASS':'rest_framework.pagination.PageNumberPagination','PAGE_SIZE':100,
}
SECURE_PROXY_SSL_HEADER=('HTTP_X_FORWARDED_PROTO','https')
# On the public server terminate TLS at a trusted reverse proxy; only trust its forwarded proto.
SECURE_SSL_REDIRECT=not DEBUG
SECURE_HSTS_SECONDS=int(os.getenv('SECURE_HSTS_SECONDS','0')) if not DEBUG else 0
SECURE_HSTS_INCLUDE_SUBDOMAINS=os.getenv('SECURE_HSTS_INCLUDE_SUBDOMAINS','0')=='1'
SESSION_COOKIE_SECURE=not DEBUG;CSRF_COOKIE_SECURE=not DEBUG
SECURE_CONTENT_TYPE_NOSNIFF=True
X_FRAME_OPTIONS='DENY'
