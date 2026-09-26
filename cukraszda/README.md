# Habcsók Cukrászda — torta-előrendelés

Bemutató projekt, saját kezdeményezés. Nem élő cukrászda, minden adat kitalált.

Élő: https://demo-cukraszda.vercel.app

## A probléma

A tortarendelés egy kis cukrászdában telefonon és Messengeren jön, egy füzetbe
kerül, és péntek este derül ki, hogy szombatra nyolc torta van felírva, pedig
hat fér bele. A felirat helyesírását a pultos betűzi vissza, a „mikorra kész?”
kérdésre pedig mindig ugyanaz a válasz: két nap.

## Mit csinál

- **Kínálat:** torták két méretben, tálcák; mindegyiknél ott van, hány nappal
  előre kell kérni, és mit tartalmaz (allergének)
- **Kosár:** darabszám, felirat tortánként (legfeljebb 30 karakter), végösszeg
- **Átvétel:** csak olyan nap választható, amire a rendelés elkészül és a
  cukrászdának van még kapacitása; időpont félórás sávokban
- **Pult nézet** PIN mögött (a bemutató PIN-je a lapon ki van írva: `2468`):
  rendelések napok szerint, a napi tortaszámmal

## Döntések

- **A napot a szabály számolja, nem a vevő.** Torta két nap, tálca egy nap,
  14:00 után leadott rendelésnél plusz egy nap, hétfőn zárva. Az
  `earliestPickup` és a `dayStatus` ezt számolja, tesztekkel.
- **Napi kapacitás tortában mérve.** Hat torta fér bele egy napba; ha a kosár
  nem fér a maradékba, a nap „betelt”. Tálcát betelt napra is lehet kérni,
  mert az nem a tortasütő idejét viszi.
- **Mentéskor újra ellenőriz.** A `createOrder` a mentés pillanatában újra
  kiszámolja a napot, és elutasítja a rendelést, ha közben betelt.
- **A kiválasztott nap magától elenged, ha a kosár nő.** Ha valaki kedden
  még befér egy tortával, de hozzáad egy másodikat, a kedd kijelölése
  megszűnik, és újat kell választani.
- **Fizetés átvételkor.** Online fizetés nincs; egy kis cukrászdának ez
  kevesebb adminisztráció. Élesben ide jönne egy SMS-visszaigazolás.
- **localStorage, nem backend.** A PIN nem biztonság, csak azt mutatja, hogy
  a pult más nézetet lát.

## Futtatás

```bash
npm install
npm test      # átvételi nap, kapacitás, végösszeg, tárolás
npm run dev
```

## Dizájn

Régi magyar cukrászda portálja: csíkos málnaszínű napellenző, alatta szilvaszínű
cégtábla neon írott "Habcsók" felirattal, ami betöltéskor kétszer felvillan. A
torták matricaszerű kártyák menta árnyékkal, a tálcák egy cserélhető betűs
árlista-táblán, a kosár egy csíkos szalagos tortásdoboz. Kutatás: Awwwards
(Bernice Bakery, Nine Times Bakery), a barna-krém pékségpaletta ellenpéldának.

React 19 + Vite, Vitest. Betűk: Sacramento (neon) + Bricolage Grotesque,
helyben (@fontsource). Fotó: Lummi (szabad felhasználás).
