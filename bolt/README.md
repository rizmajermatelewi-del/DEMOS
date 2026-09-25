# Bárány Vas-Műszaki — készlet és félretétel

Bemutató projekt, saját kezdeményezés. Nem élő bolt, minden adat kitalált.

Élő: https://demo-vasbolt.vercel.app

## A probléma

Egy kis vas-műszaki boltot napközben leginkább azért hívnak, hogy „van-e
raktáron?”, és „meddig vannak nyitva?”. A vevő, aki nem telefonál, elindul,
és ha nincs, legközelebb a nagy barkácsáruházba megy. Egy teljes webshop
viszont túl sok egy ilyen boltnak: szállítás, online fizetés, raktárprogram.

## Mit csinál

- **Katalógus élő készlettel:** raktáron / már csak kevés / elfogyott,
  érkezési dátummal
- **Keresés ékezet nélkül is:** „csavarhuzo” megtalálja a csavarhúzót,
  „led e27” az izzót; kategória-szűrő, „csak ami raktáron van” kapcsoló
- **Nyitva / zárva jelzés** a fejlécben, percre pontosan, a mai nap
  kiemelve a nyitvatartásban
- **Félretétel, nem webshop:** a vevő kéri, a bolt a következő nyitvatartási
  nap zárásáig félreteszi, fizetni a pultnál kell
- **Bolt nézet** PIN mögött (a bemutató PIN-je a lapon ki van írva: `2468`):
  félretett áruk („Átvette” / „Visszatesz”) és a készlet +/− gombokkal,
  telefonról

## Döntések

- **Katalógus + félretétel, nem kosár.** Egy helyi boltnak a vevő bejön; az
  oldal dolga, hogy biztosan érdemes legyen bejönni.
- **A félretett darab nem látszik szabadnak.** A szabad mennyiség = polc −
  félretett. A `createHold` mentéskor újraolvassa a tárolt adatot, így egy
  régi képernyőről sem lehet több dobozt kérni, mint amennyi maradt.
- **Átvételkor a polcról is lejön.** Az „Átvette” csökkenti a készletet, a
  „Visszatesz” nem, mert az áru a polcon maradt.
- **A nyitvatartás adat, nem szöveg.** Ugyanabból a táblából jön a
  fejléc-jelzés, a „szombat 13:00-ig tartjuk” és a nyitvatartási táblázat, és
  percenként frissül.
- **localStorage, nem backend.** Élesben a készlet egy táblázatból vagy a
  pénztárprogramból jönne. A PIN nem biztonság.

## Futtatás

```bash
npm install
npm test      # nyitvatartás, félretétel, keresés, készlet
npm run dev
```

React 19 + Vite, Vitest. Betű: Archivo (latin-ext). A félretétel natív
`<dialog>` elemben nyílik.
