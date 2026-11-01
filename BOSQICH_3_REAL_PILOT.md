# AgroPulse Qorako‘l — 3-bosqich: haqiqiy ma’lumotlar sifati va xavfsiz import

**Bu frontend va backendning birgalikdagi v0.3 pilot versiyasi.** Haqiqiy kanal, fermer yoki sensor sonlari bu ZIP'ga uydirib kiritilmagan. Birinchi versiyadagi dizayn saqlangan. Ma’lumot bo‘lmasa «—»/«Hozircha qayd yo‘q» ko‘rsatiladi.

## 1. O‘rnatish va eski bazani saqlash

- v0.2 ishlab turgan bo‘lsa, uning **backend serverini to‘xtating**.
- Yangi v0.3 ZIP'ni alohida `D:\AgroPulse_QORAKOL_v0_3` papkasiga chiqaring.
- Agar v0.2 bazasida kiritilgan haqiqiy ma’lumotlar bo‘lsa, **yangi papkada setup'dan OLDIN** quyidagini bajarish mumkin:

```powershell
cd D:\AgroPulse_QORAKOL_v0_3
.\KOCHIRISH_DB.ps1 -OldProject "D:\AgroPulse_QORAKOL_FULLSTACK_PILOT_v0_2"
```

**OGOHLANTIRISH:** bu skript mavjud target bazani hech qachon o‘chirib yoki almashtirmaydi. V0.2 papka nomi kompyuteringizda boshqacha bo‘lsa, o‘sha haqiqiy yo‘lni yozing. `.env` konfiguratsiyasi va parollarni alohida saqlang; ularni GitHub'ga yubormang. Fayldan nusxa olishdan oldin ikkala serverni to‘xtating.

So‘ng:

```powershell
.\setup_windows.bat
.\BOSHLASH_WINDOWS.bat
```

Admin profilni avvalgidek `createsuperuser`/`set_role` bilan tayyorlang. `http://127.0.0.1:3000/kabinet` da haqiqiy dashboardni ko‘rasiz.

## 2. Tasdiqlangan ma’lumotlarni ketma-ket kiritish

Birinchi navbatda `init_qorakol`, keyin `import_pilot_catalog areas`, `canals`, `stations` orqali ma’lumotnomalarni kiriting. Namuna CSV fayllarida **faqat ustun nomlari** bor; haqiqiy qiymatlarni tashkilot vakili tasdiqlasin.

Fermer foydalanuvchilari Django Admin'da yaratiladi, ularning profili **farmer**, tumani **Qorako‘l** qilib belgilanadi. Keyin:

```powershell
cd backend
.\.venv\Scripts\python.exe manage.py import_pilot_data fields import_templates\fields.csv
.\.venv\Scripts\python.exe manage.py import_pilot_data fields import_templates\fields.csv --apply
```

`fields.csv`: `username,field_name,area_ha,crop,area_name,canal_code`.

O‘lchovlarni kiritish (faqat hujjatlashtirilgan o‘lchovlar):

```powershell
.\.venv\Scripts\python.exe manage.py import_pilot_data readings import_templates\readings.csv
.\.venv\Scripts\python.exe manage.py import_pilot_data readings import_templates\readings.csv --apply
```

`readings.csv`: `station_code,recorded_at,flow_lps,level_cm`. Vaqt **timezone bilan** ISO formatida bo‘ladi: `2026-10-28T13:30:00+05:00` (bu format misoli, haqiqiy qayd emas). `flow_lps` oniy suv oqimi, `level_cm` ixtiyoriy. CSV faqat foydalanuvchi tomonidan kiritilgan/import qilingan manba; sensor kelganini anglatmaydi.

- Default buyruq **dry-run**: hammasini tekshiradi, bazaga saqlamaydi.
- `--apply` to‘liq tranzaksiyada yozadi: bitta xato bo‘lsa, hammasi bekor qilinadi.
- Begona tumandagi fermer/kanal/sensor, takroriy yozuvlar, manfiy/cheksiz qiymatlar, noto‘g‘ri vaqtlar rad etiladi.
- Mavjud dala boshqa ko‘rsatkich bilan qayta kelsa, **avtomatik ustidan yozilmaydi**.
- Bir yuklamada maksimal 2000 qator. Avval faylni zaxiralang.

## 3. Monitoring sifati

Autentifikatsiya talab qiluvchi yangi endpoint:

`GET /api/v1/dashboard/data-quality/`

- `recent` — oxirgi 48 soatda qayd mavjud
- `stale` — oxirgi qayd 48 soatdan eski
- `no_data` — hech bir qayd kiritilmagan
- `disabled` — tizimda o‘chirilgan sensor nuqtasi
- `canals_without_area` — hududga biriktirilmagan kanallar soni

Bu **qurilmaning real onlayn/offlayn signali emas**; faqat o‘lchov yangiligi. Barcha ko‘rsatkichlar rol va tuman vakolati doirasida hisoblanadi. Ro‘yxat 500 punkt bilan chegaralangan; natija kesilgan bo‘lsa, `truncated=true` qaytadi.

Frontendda Hokimiyat va Irrigatsiya foydalanuvchilari `/kabinet` → Boshqaruv panelida **Ma’lumotlar sifati** bo‘limini ko‘radi. Fermerning umumiy ekrani soddaligicha qoladi.

## 4. Sinov

```powershell
.\tekshir_windows.bat
```

Tekshiruv Django testlari, TypeScript va production build'ni mahalliy kompyuteringizda ishga tushiradi. Internet va Python/Node paketlari kerak. Testlar muvaffaqiyatli o'tmaguncha v0.3 production deb belgilanmaydi.

## 5. Keyingi real ishlar

- Qorako‘l hokimiyati tomonidan tasdiqlangan hudud, kanallar va dala ro‘yxatlari
- Sensor modeli/protokoli, vaqt zonasi va aniq o‘lchov usullari
- Suv limiti yoki m³ hisob-kitobi uchun tasdiqlangan ma’lumot va o‘lchash metodikasi
- PostgreSQL migratsiya sinovi, log/audit, backup restore sinovi, server hosting va xavfsizlik

**Mavjud v0.2 dagi SQLite bazasi avtomatik ZIP ichiga kiritilmaydi.**
