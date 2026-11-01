# AgroPulse — Qorako‘l Full Stack, v0.2 (real kuzatuv bosqichi)

**Bu v0.1 ustidan yangilanishdir. Oldingi v0.1 Django migratsiyalari va mavjud ma'lumotlar saqlanadi.**

## Bajarilgan

1. `GET /api/v1/dashboard/role/?from=YYYY-MM-DD&to=YYYY-MM-DD`: 3 xil rolga mos, login va vakolatni tekshiradigan monitoring API.
   - Fermer: faqat o'z dalalari, berilgan sensor o'lchovlari.
   - Irrigatsiya: faqat biriktirilgan kanallar va qurilmalar, o'lchovlar va faol ogohlantirishlar.
   - Hokimiyat: o'z tumani hududlari, kanallari, o'lchov mavjudligi, dalalar maydoni va ogohlantirishlar.
   - Administrator: admin vakolati bilan nazorat ko'rinishi; boshqa rolga o'zini o'zi aylantirib bo'lmaydi.
2. Kabinet (`/kabinet`) bosh oynasida rolga mos alohida panel, kunlik **o'rtacha qayd etilgan l/s** grafiklari, hududlar/kanallar jadvallari va sana oralig'i.
3. Operator uchun `POST /api/v1/alerts/new/`, `POST /api/v1/alerts/<id>/resolve/`. Hokimiyat va fermerga yozish huquqi berilmaydi. Operator faqat o'zi biriktirilgan kanal ogohlantirishlarini boshqaradi.
4. `import_pilot_catalog` boshqaruv buyrug'i orqali **faqat tasdiqlangan** hudud, kanal va sensor CSV ma'lumotlarini atomik tarzda kiritish. Dry-run default, `--apply` bilan saqlanadi.
5. Regressiya testlari: rol bo'yicha cheklash, boshqa tuman yozuvlari, date-filter, o'lchov metrikasi, operator huquqi.

## O'lchovga oid qat'iy qoida

`flow_lps` — ma'lum lahzadagi oqim tezligi (litr/sekund). U **jami olingan suv m³** emas. Turli nuqtalar l/s ko'rsatkichlarini yig'ish orqali suv iste'moli, yo'qotish yoki limitni hisoblash mumkin emas. Haqiqiy m³ uchun kalibrlangan sensorlardan vaqtli hajm hisoblash metodikasi va qabul qilingan nazorat protokoli kerak.

Barcha yozuvlar faqat foydalanuvchi kiritgan yoki kalit bilan autentifikatsiyalangan qurilmadan kelgan bo'ladi. Hisoblagich bo'lmagan joy `—` ko'rsatiladi. Xaritadagi real GPS koordinatalar **hozircha bazada mavjud emas**, shu sabab haqiqiy xarita qo'shilmagan.

## Katalogni real ma'lumot bilan to'ldirish

Dastlab admin (`http://127.0.0.1:8000/admin/`) dan **District -> Area -> Canal -> Station** tartibida ma'lumotni qo'lda kiritish mumkin. Katta ro'yxat uchun `backend/import_templates/` ichida bo'sh sarlavha shablonlari berilgan:

- `areas.csv` ustunlari: `name`
- `canals.csv` ustunlari: `code,name,area_name`
- `stations.csv` ustunlari: `code,name,canal_code,is_enabled` (qurilma real ishlamasa `false`)

Quyidagi komandalar `backend` papkasida ishlaydi:

```powershell
.\.venv\Scripts\python.exe manage.py import_pilot_catalog areas import_templates\areas.csv
.\.venv\Scripts\python.exe manage.py import_pilot_catalog areas import_templates\areas.csv --apply
.\.venv\Scripts\python.exe manage.py import_pilot_catalog canals import_templates\canals.csv --apply
.\.venv\Scripts\python.exe manage.py import_pilot_catalog stations import_templates\stations.csv --apply
```

**Bo'sh CSV fayllarni to'ldirmasdan ishga tushirmang.** Nomlar va ID larni tegishli irrigatsiya tashkilotidan oling. Importni `--apply` siz sinang, natija to'g'ri bo'lsagina saqlang. Hozirgi frontend grafiklarda faqat bazadagi real o'lchovlar chiqadi.

## Windows ishga tushirish

1. ZIP'ni D diskdagi alohida papkaga chiqaring. Avvalgi v0.1 papkasini o'chirmang; agar unda real `db.sqlite3` bo'lsa, xavfsiz nusxa oling.
2. Yangi papkada `./setup_windows.bat` (`.\setup_windows.bat`) — virtual muhitni tayyorlaydi, barcha migratsiyalarni qo'llaydi.
3. `.\BOSHLASH_WINDOWS.bat` — Next.js (3000) va Django (8000).
4. `http://127.0.0.1:3000/kabinet` — real kabinet.
5. `.\TEKSHIRISH_WINDOWS.bat` — `manage.py check`, testlar, TypeScript va build.

## Migratsiyadagi muhim eslatma

Loyihaning o'zida haqiqiy foydalanuvchi/dala/sensor ma'lumotlari mavjud emas. v0.1 da to'ldirilgan `backend/db.sqlite3` ni **zaxiralang** va mos v0.2 `backend/` ichiga o'zingiz nazorat bilan nusxa ko'chiring, yoki ishlab turgan PostgreSQL `DATABASE_URL` bilan ulaning. Eski fayllarni ustiga ko'r-ko'rona yozmang.

## Qolgan asosiy vazifalar

- Qorako'lning tasdiqlangan hudud, kanal, dala, qurilma katalogini real manbadan olish.
- Real qurilma protokoli, kalibrlash, o'lchov aniqligi, xatolik chegarasini tasdiqlash.
- GPS/GeoJSON koordinatalari ma'lum bo'lganda xaritani real geografiyaga ulash.
- Production oldidan PostgreSQL, HTTPS, audit log, backup, monitoring, parol siyosati va deployment xavfsizligi.
- Real frontend ekranlarini API bilan testdan o'tkazish (bu muhitda paketlarni o'rnatib bo'lmadi).

**Bu versiya hali production tizimi emas; real pilotni boshlash uchun rolga mos ishlaydigan backend/frontend asosidir.**
