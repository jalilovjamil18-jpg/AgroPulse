# AgroPulse Qorako‘l — 4-bosqich: Hokimiyatning hujjatli suv balansi

Ushbu v0.4 `v0.3` kodlari ustida yaratilgan: mavjud Next.js sayti, `/kabinet` dashboardlari va Django REST API saqlangan.

## Nima yangi?

- `WaterBalance` ma’lumotlar modeli: **hudud + oy**, rejalashtirilgan `m³`, amalda qayd etilgan `m³`, hujjat raqami, tasdiqlash sanasi va tasdiqlovchi.
- `GET /api/v1/dashboard/water-balance/?month=YYYY-MM` — hokimiyat va administrator uchun vakolatga mos oylik statistika.
- `GET /api/v1/reports/water-balance.csv?month=YYYY-MM` — xuddi shu tasdiqlangan yozuvlar CSV hisoboti.
- `/kabinet` → **Suv balansi** — oylik filtr, ko‘rsatkichlar, hududlar jadvali, hujjat manbasi, CSV yuklash, ma’lumoti yo‘q hududlar.
- `import_water_balance` — CSV'ni avval tekshiradi (dry-run); faqat `--apply` bilan **tasdiqlanmagan qoralama** yaratadi. Takroriy ma’lumotni ustidan yozmaydi.
- Django admin → **Water balances** — manbani tekshirgan superuser `verify_selected` harakati bilan qoralamani tasdiqlaydi; shundan keyingina hokimiyat hisobotida ko‘rinadi.

**Nima emas?** Sensor `l/s` qiymatlari suv hajmi `m³` emas. Ushbu modulda `m³` faqat tashqi, rasmiy hujjatdan kiritiladi. Qamrov yetishmasa yig‘indilar «qisman» deb belgilanadi; foiz faqat reja va amaldagi qiymati bor hududlardan hisoblanadi. Tasdiqlangan haqiqiy ma’lumotlar hali kiritilmagani uchun panellar bo‘sh bo‘lishi tabiiy. Manba fayllari ZIP'da YO‘Q.

## Yangilash va bazani saqlash

1. v0.3 ning backend serverini **to‘xtating**. Eski `backend/db.sqlite3` bazasining alohida backupini oling.
2. ZIP'ni masalan `D:\AgroPulse_QORAKOL_v0_4` ichiga chiqaring.
3. **Yangi papkada setup'dan oldin**, agar v0.3 dagi ma’lumotlarni saqlamoqchi bo‘lsangiz:

```powershell
cd D:\AgroPulse_QORAKOL_v0_4
.\KOCHIRISH_DB.ps1 -OldProject "D:\AgroPulse_QORAKOL_v0_3"
```

OldProject papkasini kompyuteringizdagi **haqiqiy v0.3 papka nomi** bilan almashtiring. Eski bazani copy qilish SQLite uchun, PostgreSQL bo‘lsa bu yo‘l ishlatilmaydi. `.env` maxfiy konfiguratsiyasini alohida saqlang.

4. So‘ng:

```powershell
.\setup_windows.bat
.\BOSHLASH_WINDOWS.bat
```

Yoki avvalgi virtual muhitni ishlatsangiz:

```powershell
cd backend
.\.venv\Scripts\python.exe manage.py migrate
cd ..
.\BOSHLASH_WINDOWS.bat
```

## Qorako‘l hududlarini va oylik hisobotni kiritish

1. `/admin/` da District = Qorako‘l va Area bo‘limida **tasdiqlangan hududlar** kiritilgan bo‘lishi kerak.
2. `backend/import_templates/water_balance.csv` ni haqiqiy hujjatdagi ma’lumotlar bilan to‘ldiring. Sarlavha:
   `area_name,month,planned_m3,actual_m3,document_reference,note`
3. District ID ni Django admindan oling; misol uchun **1** bo‘lishi mumkin, lekin tizimdan tekshiring. Quyidagi `1` ni haqiqiy ID bilan almashtiring.

```powershell
cd backend
.\.venv\Scripts\python.exe manage.py import_water_balance import_templates\water_balance.csv --district 1
.\.venv\Scripts\python.exe manage.py import_water_balance import_templates\water_balance.csv --district 1 --apply
```

4. `http://127.0.0.1:8000/admin/` → `Water balances` ga o‘ting. Tasdiqlovchi hujjatni tekshiring; yozuvlarni belgilab, **Tekshirilgan hujjat asosida tanlangan qoralamalarni tasdiqlash** amalini bajaring (faqat superuser).
5. Hokimiyat rolidagi foydalanuvchi `http://127.0.0.1:3000/kabinet` → `Suv balansi` → oy tanlash orqali ko‘radi.

> **Diqqat:** Hozir import qilingan CSV haqiqiy qog‘oz hisobotidan kelgani mustaqil avtomatik tasdiqlanmaydi. Tasdiqlovchi administrator manbani inson sifatida tekshirishi kerak. Hozircha faqat hujjat raqami saqlanadi, faylni yuklash/arxivlash va raqamli imzo keyingi bosqichdir.

## Sinov

`TEKSHIRISH_WINDOWS.bat`: Django `check`, avtomatik ruxsat testlari, TypeScript va Next.js build. Django paketlarini o‘rnatish hamda kompyuterda testdan o‘tkazish zarur. Ushbu ZIP **lokal pilot**, production server emas.

## Keyingi bosqich uchun ma’lumotlar

Hokimiyatdan aniq hududlar ro‘yxati, suv hisobot shakli, reja/haqiqiy hajmlar qaysi idorada tasdiqlanishi, ma’lumotlar davriyligi, sensor modeli hamda manba hujjatini olish kerak. Ular bo‘lmaguncha raqamlar o‘ylab yozilmaydi.
