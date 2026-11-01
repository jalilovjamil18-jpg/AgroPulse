# AgroPulse Qorako‘l — Full Stack Pilot v0.5

**5-bosqich: qurilmalar monitoringi + sensor API hardening + PostgreSQL tayyorgarligi.**

**O‘rnatish va o‘zgarishlar:** [BOSQICH_5_SENSOR_POSTGRES.md](BOSQICH_5_SENSOR_POSTGRES.md).

**Asosiy kabinet:** `http://127.0.0.1:3000/kabinet` · **Admin:** `http://127.0.0.1:8000/admin/` · **API:** `http://127.0.0.1:8000/api/v1/health/`

**Avvalgi bosqichlar** pastda saqlangan. Real ma’lumot bo‘lmasa, real kabinetda sun’iy son ko‘rsatilmaydi.

---

# AgroPulse — Qorako‘l Full Stack Pilot v0.4

**Yangi bosqich:** Hokimiyatning hujjatga asoslangan oylik suv balansi, tasdiqlash va CSV hisobotlari. Bosqich 4 qo‘llanma: [BOSQICH_4_SUV_BALANSI.md](BOSQICH_4_SUV_BALANSI.md).

# AgroPulse — Qorako‘l Full Stack Pilot v0.3

**Yangi ishlar:** tasdiqlangan dala va o‘lchov CSV importi (dry-run/apply), ma’lumot sifati API va Hokimiyat/Irrigatsiya kabinetida yangi panel.

**To‘liq ko‘rsatma:** [BOSQICH_3_REAL_PILOT.md](BOSQICH_3_REAL_PILOT.md).

# AgroPulse — Qorako‘l Full Stack Pilot (v0.2)

**Bitta kompaniya sayti + yagona demo platforma + rolga mos haqiqiy backendga ulangan kabinet.**

**v0.2 yangi bosqich:** real rolga mos hudud/kanal/dala statistikasi, operator ogohlantirishlari, vaqt filtrlari va tasdiqlangan kataloglarni CSV dan kiritish. Batafsil `BOSQICH_2_QORAKOL.md` faylida. Dizayn va ommaviy sayt saqlangan.

- Ochiq sayt: `http://127.0.0.1:3000` — tasdiqlangan dizayn; platforma bo‘limida **faqat DEMO**.
- **Haqiqiy kabinet:** `http://127.0.0.1:3000/kabinet` — Django API, real DB, rol huquqlari. Login talab qilinadi.
- API: `http://127.0.0.1:8000/api/v1/health/`.
- Django admin: `http://127.0.0.1:8000/admin/`.

## Windows: 3 qadam
1. Loyihani `D:` ga ZIP'dan chiqaring; VS Code terminalida **ZIP ichidagi** papkani oching.
2. `./setup_windows.bat` (PowerShell: `.\setup_windows.bat`): bir marta Python va npm paketlarini o‘rnating, migration ishlasin, Qorako‘l tumani nomi yaratilsin. **Hech qanday soxta suv raqami yaratilmaydi.**
3. [Django administrator](#administratorni-yaratish) yaratib, `.\BOSHLASH_WINDOWS.bat` ni ishga tushiring.

### Administratorni yaratish
```powershell
cd backend
.\.venv\Scripts\python.exe manage.py createsuperuser
.\.venv\Scripts\python.exe manage.py set_role SIZNING_LOGIN admin --district "Qorako‘l"
cd ..
```
Parolni terminalning o‘zida kiriting. Uni kodga, README'ga yoki GitHub'ga yozmang.

### Hokimiyat, irrigatsiya, fermer hisoblari
Django admin `/admin/` orqali `Users` dan foydalanuvchilarni yarating va `Agro profiles` da rolni **farmer / irrigation / authority** va hududni Qorako‘l qilib belgilang. Irrigatsiya uchun **assigned_canals** belgilang. Fermerga `Fields` orqali faqat o‘zining dalalarini biriktiring. Keyin haqiqiy kabinetda foydalanuvchi login-paroli bilan kiring.

Ma'lumotlarni shu tartibda admin orqali kiriting: `District` -> `Area` -> `Canal` -> `Station` -> `Field` -> `Reading` -> `Alert`.

**Eslatma**: `Reading.flow_lps` — suv oqimining ayni vaqtdagi tezligi (l/s). Uni m³ hajm deb ko‘rsatish yoki yig‘ish noto‘g‘ri. Haqiqiy hajmni hisoblash qo‘shimcha vaqt bo‘yicha integratsiya va o‘lchash metodikasini talab qiladi.

### Qurilmadan o‘lchov kelishi
`backend/.venv/Scripts/python.exe manage.py set_device_key STATION_CODE` buyrug‘i bilan har bir sensor uchun alohida secret yaratiladi; uning faqat SHA256 xeshi bazada saqlanadi. Qurilma `POST /api/v1/devices/ingest/` ga `X-Device-Key` yuboradi. **Bu real qurilma hali ulanmagan**; interfeys uning borligini uydirmaydi.

### Sinov
`.\TEKSHIRISH_WINDOWS.bat` Django `check`, rol/ruxsat testlari, frontend TypeScript va Next.js build tekshiruvlarini ishga tushiradi.

### Production ogohlantirishlari
Bu v0.1 **lokal pilot**, Internetga ochish uchun tayyor production xizmat emas. Productionda PostgreSQL (`backend/requirements-postgres.txt`), `DJANGO_DEBUG=0`, kuchli `DJANGO_SECRET_KEY`, `DATABASE_URL`, aniq CORS domainlari, HTTPS, log/audit, backup, login rate limitni Redis orqali taqsimlash, monitoring va foydalanuvchi roziligi talab qilinadi. `backend/.env` va `.env.local` GitHub'ga chiqmaydi.

***Backend noldan boshlanadi, mavjud dizayn saqlanadi. Demo statistikalar real raqam sifatida ko‘rsatilmaydi.***

### GitHub'ga keyingi yuklash
Bu ZIP loyihani `jojik1/AgroPulse-Frontend` repositoryga yuborishdan oldin maxfiy fayllarni tekshiring:
```powershell
git status --short
git add .
git diff --cached --name-only
git commit -m "Add Django API and real Qorakol pilot cabinet"
git push origin main
```
`backend/.env`, `frontend/.env.local`, bazadagi haqiqiy ma'lumotlar, `.venv` va `node_modules` GitHub'ga chiqmasin. Joriy loyihani yuklayotgan papka aynan o'sha Git repository ekanini `git remote -v` bilan tekshiring. Agar ZIP yangi papkaga ochilgan bo'lsa, eski repositoryni alohida yo'qotmang; Git remote avtomatik berilmaydi.
