# AgroPulse Qorako‘l v0.5 — tekshiruv protokoli

## Shu ish jarayonida bajarildi

- Eski v0.4 ZIP tarkibi tekshirilib, shu loyihadan davom ettirildi.
- **34** ta backend Python faylining sintaksisi AST parser yordamida xatosiz o‘qildi (v0.5 yakuniy ro‘yxat qayta hisoblanadi).
- **34** ta frontend TypeScript/TSX faylning sintaksisi TypeScript parser bilan xatosiz o‘qildi.
- Yangi `0003_station_device_ingest.py` migratsiyasi modellar bilan mos maydonni qo‘shadi.
- Device endpointga yangi ko‘rsatkich, ruxsat nazorati va idempotent qayta yuborish implementatsiyasi kiritildi.
- Windows preflight, PostgreSQL tayyorlik tekshiruvi va xavfsiz eski SQLite ko‘chirish yo‘riqnomasi qo‘shildi.
- ZIP CRC va katalog tarkibi tekshiriladi.

## Ushbu muhitda BAJARILMADI

- `manage.py migrate`, `manage.py test agro` va `makemigrations --check --dry-run`: Django paketlari o‘rnatilmagan, tashqi paket manbasiga ulanib bo‘lmadi.
- `npm run lint` va `npm run build`: frontend `node_modules` mavjud emas, tashqi paket manbasiga ulanib bo‘lmadi.
- Haqiqiy PostgreSQL va qurilma API bilan end-to-end sinov: haqiqiy server/sensor ulanishi berilmagan.

**Natija:** v0.5 lokal sinovga topshiriladigan koddir. Runtime/regression testlar Windows muhitida o‘tkazilmaguncha productionga tayyor degan xulosa chiqmaydi.

## Windows tekshiruvi

```powershell
cd D:\AgroPulse_QORAKOL_v0_5
.\TEKSHIRISH_WINDOWS.bat
cd backend
.\.venv\Scripts\python.exe manage.py pilot_preflight
```

Agar `makemigrations --check` o‘zgarish kerak deb xabar bersa, kod/migratsiyani tekshirib, keyingi bosqichga o‘ting — productionga avtomatik ko‘chirmang.
