# AgroPulse — Dashboard UI 2.0 (Yagona sayt)

## Nima o'zgardi

Bosh sahifada `/#platforma` manzilida joylashgan yagona Raqamli platforma paneli foydalanuvchi tasdiqlagan birinchi dashboard maketidagi tuzilmaga yaqinlashtirildi:

- Chap yon navigatsiya: Boshqaruv paneli, Xarita va maydonlar, Suv monitoringi, Qurilmalar, Tahlillar, Hisobotlar, Ogohlantirishlar, Sozlamalar.
- Yuqorida Fermer, Irrigatsiya, Hokimiyat va Administrator uchun demo rol tanlash.
- 4 ta ro'lga mos ko'rsatkichlar kartasi.
- Katta SVG grafik: suv, tuproq namligi, yog'ingarchilik va vaqt oralig'ini tanlash.
- Sxematik xarita: uchta tanlanadigan nuqta va maydon konturlari.
- Oxirgi hodisalar va bosilganda kengayuvchi izohlar.
- Jadval: qidirish va UTF-8 CSV namuna eksporti.
- Alohida qurilmalar, tavsiyalar va sozlamalar bo'limlari.
- Uch til uchun yangi matnlar (UZ/RU/EN).
- Kichik ekranlar uchun responsive moslashuv; telefon menyusi ochiladi.

Oldingi korporativ bosh sahifa, sarlavha, kanal foni, logotip, rol-status prinsipi va tashqi API arxitekturasi saqlandi.

## Muhim

Hamma raqamlar, xarita nuqtalari, hodisalar, foydalanish ma'lumotlari va jadval satrlari sintetik DEMO ma'lumotlaridir. Ular haqiqiy sensor yoki tashkilot natijalarini ifodalamaydi.
Haqiqiy login, ma'lumot saqlash, rollar bo'yicha server ruxsatlari va jonli sensor API boshqa dasturchi tomonidan amalga oshirilishi kerak. Frontenddagi rol tanlash faqat demo.

## Windows'da ishga tushirish

1. ZIP faylni D diskdagi yangi papkaga chiqaring.
2. Oldingi AgroPulse server terminalini Ctrl+C bilan to'xtating.
3. Yangi papkani VS Code'da oching.
4. `BOSHLASH_WINDOWS.bat` ni ishga tushiring.
5. http://127.0.0.1:3000/#platforma manzilini oching.
6. Grafikka, xarita pinlariga, rollarga, chap menyuga, CSV eksportiga va qidiruvga bosing.
7. Texnik tekshiruv uchun boshqa terminalda `TEKSHIRISH_WINDOWS.bat` ni ishga tushiring.

## Tekshiruv

- TypeScript/TSX fayllarining parse tekshiruvi: 0 xato.
- Loyiha ichki route/asset/source tekshiruvi: 0 xato va 0 ogohlantirish.
- Yangi dashboard komponentining TypeScript tip tekshiruvi maxsus stub deklaratsiyalar bilan: 0 xato (to'liq Next.js build emas).
- To'liq production build, Playwright/brauzer va API integratsiyasi bu muhitda o'tkazilmadi.
