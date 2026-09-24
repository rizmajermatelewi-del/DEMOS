# Szálka Fodrászat — időpontfoglaló

Bemutató projekt, saját kezdeményezés. Nem élő szalon, minden adat kitalált.

Élő: https://demo-idopontfoglalo.vercel.app

## A probléma

Egy kis fodrászat telefonon és üzenetben egyezteti az időpontokat. Két vendég
ugyanarra az órára, egy festés, ami átcsúszik a zárásba, egy foglalás, amiről
csak egy munkatárs tud — ezek mind abból jönnek, hogy a naptár egy fejben van.

## Mit csinál

- Szolgáltatásválasztó (időtartam + ár), napválasztó, szabad sávok
- Foglalási űrlap, mezőnként megnevezett hibával
- Megerősítő képernyő
- Admin lista PIN mögött (a bemutató PIN-je a lapon ki van írva: `2468`)

## Döntések

- **Csak az a sáv jelenik meg, amibe a teljes szolgáltatás belefér.** Egy 90
  perces festés 17:00-kor nem ajánlható, ha 18:00-kor zár a szalon. Ezt a
  `slotsForDate` számolja, nem a felület.
- **A dupla foglalást mentéskor is ellenőrzi.** A `createBooking` a mentés
  pillanatában újraszámolja a szabad sávokat, és elutasítja a foglalást, ha a
  sáv közben betelt — nem bízik abban, amit a képernyő korábban mutatott.
- **A sérült tárolt adat nem dönti le az oldalt.** A `loadBookings` kiszűri a
  hiányos bejegyzéseket, rossz JSON esetén üres listával indul.
- **localStorage, nem backend.** A bemutató szándékosan egy böngészőben él,
  e-mail nem megy ki. Élesben ugyanez a logika Supabase táblára és egy
  tranzakciós e-mailre (pl. Resend) kerülne; a sávszámítás nem változna.
- **A PIN nem biztonság.** A bemutatóban csak azt mutatja, hogy a szalon más
  nézetet lát, mint a vendég. Élesben valódi bejelentkezés kell.

## Futtatás

```bash
npm install
npm test      # sávszámítás + tárolás
npm run dev
```

React 19 + Vite, Vitest.
