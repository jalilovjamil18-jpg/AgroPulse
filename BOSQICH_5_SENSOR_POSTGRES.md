# AgroPulse Qorako‘l — 5-bosqich: sensor qabul qilish + PostgreSQL tayyorgarligi

**Versiya:** v0.5. **Holat:** lokal pilot kodi; haqiqiy sensor yoki ommaviy hosting bilan ishlashi tasdiqlanmagan.

## Nima o‘zgardi?

- `GET /api/v1/dashboard/devices/` — Hokimiyat/Irrigatsiya/Administrator uchun vakolatga mos qurilma qabul holati. Fermer va avtorizatsiyasiz tashrifchiga ma'lumot bermaydi.
- Dashboarddagi **Qurilmalar** menyusi: 48 soatda qabul qilingan / eski qabul / hali yubormagan / kalit biriktirilmagan / o‘chirilgan. Qidirish, filtrlash, qayta yuklash ishlaydi.
- `Station.last_device_ingest_at` — v0.4 dagi tarixiy yozuvlar uchun avtomatik to‘ldirilmaydi; faqat server `POST /api/v1/devices/ingest/` orqali **to‘g‘ri kalit bilan qabul qilgan** so‘rov payti; qo‘lda kiritilgan o‘lchov hisoblanmaydi.
- Takroriy **aynan bir xil** qurilma xabari `200 + duplicate:true`; bir xil vaqtga boshqa qiymat yuborilsa `409`.
- Sana cheklovi: kelajakdagi >5 daqiqa va `AGRO_DEVICE_MAX_AGE_DAYS` dan eski o‘lchov qabul qilinmaydi (standart 30 kun, 1..365 oralig‘ida o‘zgartirish mumkin).
- Qurilma kalitlari alohida generatsiya qilinadi, mavjud kalitni o‘zgartirish uchun `--rotate` shart, `--revoke` yordamida o‘chirish mumkin.
- PostgreSQL ulanishini sinash va migratsiya holatini ko‘rish uchun `POSTGRES_TEKSHIR_WINDOWS.bat`, xavfsizlik/ma'lumotlar tekshiruvi uchun `pilot_preflight` buyrug‘i.

**Chegara:** oxirgi qabul bo‘lmaganligi sensor offline degani EMAS. Buning uchun fizik qurilma protokoli, aloqa loglari yoki ping/heartbeat kerak. Qabul qilingan l/s qiymatini umumiy m³ ga aylantirmang.

## A. v0.4 dan ma’lumotlarni xavfsiz ko‘chirish

1. Eski v0.4 frontend/backend serverini to‘xtating (`Ctrl+C`).
2. Eski papka va ayniqsa `backend/db.sqlite3` ning zaxira nusxasini oling.
3. Yangi ZIP’ni alohida `D:\AgroPulse_QORAKOL_v0_5` papkasiga chiqaring. **Eski papkani o‘chirmang.**
4. v0.4’da SQLite ma’lumot bo‘lsa, yangi papkada hali setup qilmasdan:

```powershell
cd D:\AgroPulse_QORAKOL_v0_5
.\KOCHIRISH_DB.ps1 -OldProject "D:\AgroPulse_QORAKOL_v0_4"
```

5. Keyin:

```powershell
.\setup_windows.bat
.\TEKSHIRISH_WINDOWS.bat
.\BOSHLASH_WINDOWS.bat
```

`setup_windows.bat` Django migratsiyasi `0003_station_device_ingest` ni bajaradi. Eski o‘lchov yozuvlarini almashtirmaydi. Agar eski loyiha boshqa papkada bo‘lsa `-OldProject` manzilini o‘zgartiring.

## B. Birinchi qurilma ro‘yxati va kalit

Administrator (`http://127.0.0.1:8000/admin/`) orqali tasdiqlangan `District -> Area -> Canal -> Station` ni yarating. Haqiqiy Qorako‘l kodlari va nomlarini mas'ul tashkilotdan oling; ma'lumot o‘ylab yozilmasin.

```powershell
cd D:\AgroPulse_QORAKOL_v0_5\backend
.\.venv\Scripts\python.exe manage.py set_device_key REAL_STATION_CODE
```

Bir martalik maxfiy kalit terminalda chiqadi. Uni GitHub, chat, skrinshot yoki logga kiritmang; faqat qurilmani xavfsiz sozlash jarayonida bering. Hash bazada saqlanadi. Kalit yo‘qolsa, eski kalitni qayta ko‘ra olmaysiz:

```powershell
.\.venv\Scripts\python.exe manage.py set_device_key REAL_STATION_CODE --rotate
```

Qurilmadan qabulni to‘xtatish:

```powershell
.\.venv\Scripts\python.exe manage.py set_device_key REAL_STATION_CODE --revoke
```

## C. Qurilma API protokoli

**HTTPS talab qilinadi** (internetga ochilganda): `POST https://SIZNING-API-DOMEN/api/v1/devices/ingest/`

Headerlar: `Content-Type: application/json` va `X-Device-Key: <individual station secret>`.

```json
{
  "station_id": 123,
  "recorded_at": "2026-10-28T14:00:00+05:00",
  "flow_lps": "15.125",
  "level_cm": "21.50"
}
```

**Bu qiymatlar faqat PROTOKOL SHAKLINI ko‘rsatish uchun misol, Qorako‘lning o‘lchovi emas.** Hech qachon uni real kabinetga sinov ma’lumoti sifatida kiritmang. Qabul qilish uchun haqiqiy qurilma identifikatori, qurilma kaliti, o‘lchovning o‘z vaqti va haqiqiy o‘lchangan birliklar kerak.

Statuslar: `201` yangi yozuv, `200` aynan bir xil qayta xabar, `400` noto‘g‘ri yoki eski sana/qiymat, `403` noto‘g‘ri kalit, `409` bir paytda boshqa yozuv mavjud, `429` juda ko‘p so‘rov. Qurilma turiga mos adaptorni keyingi integratsiyada yozamiz (MQTT/Modbus/LoRaWAN model va shlyuzga qarab).

**Qurilmani ulashdan oldin:** ishlab chiqaruvchi/model, aloqa usuli, kalibrovka, oqim va suv sathi sensori o‘lchov birliklari, vaqt sinxronizatsiyasi, uzilishda buferlash, sertifikatlar va joylashuvni mas'ul mutaxassis bilan tasdiqlash zarur.

## D. PostgreSQL’ga tayyorgarlik (SQLite avtomatik ko‘chirilmaydi)

Production uchun alohida PostgreSQL server va zaxira siyosati kerak. v0.5 server yaratmaydi, migratsiya ma'lumotlarni o‘zicha ko‘chirmaydi.

1. Mustaqil **zaxira** oling; SQLite faylni xavfsiz saqlang.
2. `backend/.env` da haqiqiy PostgreSQL `DATABASE_URL` ni to‘g‘ri kiriting. Yangi papkada bu `.env` maxfiy; GitHub’ga yuklanmasin.
3. PostgreSQL tayyor bo‘lgach loyiha ildizida:

```powershell
.\POSTGRES_TEKSHIR_WINDOWS.bat
```

4. Bu tekshiruv migratsiya **bajarmaydi**. Operator DB ruxsati va zaxirasini tekshirgach:

```powershell
cd backend
.\.venv\Scripts\python.exe manage.py migrate
.\.venv\Scripts\python.exe manage.py pilot_preflight
```

5. Agar avvalgi haqiqiy ma'lumotlar SQLite’da bo‘lsa, PostgreSQL’ga importni alohida rejalashtirish kerak: foydalanuvchi IDlari, `Profile`, `Area`, `Canal`, `Station`, `Reading`, `WaterBalance`, FK va maxfiy kalitlar yaxlitligi tekshiriladi. **Yangi bazani eski bazaning o‘rniga avtomatik qo‘ymang.**

## E. Internetga joylashtirishdan oldingi shartlar

- `DJANGO_DEBUG=0`, kamida 48 belgili noyob `DJANGO_SECRET_KEY`, PostgreSQL `DATABASE_URL`.
- `DJANGO_ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, `CSRF_TRUSTED_ORIGINS` — faqat haqiqiy domenlar.
- HTTPS reverse proxy to‘g‘ri sozlangan bo‘lishi shart; `SECURE_SSL_REDIRECT` yoqiladi. `SECURE_HSTS_SECONDS` ni faqat HTTPS to‘liq sinovdan o‘tgach yoqing.
- Django dev `runserver` ni internetga **ochmang**. Gunicorn/ASGI/hosting qatlamida production server ishlating.
- Token saqlash siyosati, login throttling, IP/kalit limitingni bir nechta worker uchun umumiy cache/Redis’da saqlash, monitoring, DB backup/restore sinovi, audit va foydalanuvchi roziligini ko‘rib chiqing.
- `cd backend; .\.venv\Scripts\python.exe manage.py check --deploy` va `pilot_preflight --production` bilan deployment tekshirilsin.

## F. Sinov

```powershell
.\TEKSHIRISH_WINDOWS.bat
```

`backend/agro/test_devices_v05.py` quyidagilarni test qiladi: noto‘g‘ri kalit, o‘chirilgan sensor, to‘g‘ri yuborish, retry/idempotentlik, konflikt, eski/kelajakdagi sana, rollar/hududlar bo‘yicha cheklov, qo‘lda yozuvni qurilma qabuliga qo‘shmaslik va kalitni aylantirish.

> Kod yozilgan muhitda Django/npm paketlari tarmoqqa ulanmagani sababli to‘liq Django testlar va Next.js build bajarilmadi. Lokal kompyuterda tekshirilmaguncha productionga chiqarmang.
