# v0.4 — test holati

**Yig‘ishdagi statik tekshiruvlar:** barcha backend `.py` fayllarining Python sintaksisi; 33 ta frontend `.ts/.tsx` fayllari parser tekshiruvi; 2 ta yangilangan TSX komponenti transpilation; ZIP yaxlitligi.

**Muhit cheklovi:** ushbu qurilish muhitida Django va Next.js kutubxonalari o‘rnatilmagan, internet orqali paket yuklash mavjud emas. Shuning uchun quyidagilar bu yerda **bajarilmadi**: Django `manage.py check`, migratsiya, `agro.test_water_balance` va mavjud testlar, TypeScript to‘liq typecheck, Next.js `npm run build`, brauzer end-to-end sinov.

Windows'da o‘rnatish tugagach quyidagini bajaring:

```powershell
.\TEKSHIRISH_WINDOWS.bat
```

Shuningdek o‘zingizdagi haqiqiy test bazasida `/admin/` → Water balances → verify_selected → `/kabinet` → Suv balansi ishlashini tekshiring. Testlar yakunlanmasdan tizimni productionga chiqarish mumkin emas.
