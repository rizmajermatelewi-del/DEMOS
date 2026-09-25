# Kormos Autószerviz — időpont és árajánlat

Bemutató projekt, saját kezdeményezés. Nem élő szerviz, minden adat kitalált.

Élő: https://demo-szerviz.vercel.app

## A probléma

Egy kis szervizben a telefon egész nap csörög: „mikor hozhatom?”, „mennyi
lesz?”. A szerelő a kocsi alól veszi fel, az időpont egy füzetbe kerül, az
árajánlat fejben marad. Két autó jön ugyanarra az emelőre, a harmadik ügyfél
pedig nem ér el senkit, és elviszi máshova az autót.

## Mit csinál

- **Időpontfoglalás:** munka választása (időtartam + ár), nap, szabad leadási
  sáv, rendszám és elérhetőség
- **Árajánlatkérés:** rendszám, autó, évjárat, a hiba leírása; a szerviz
  visszahív
- **Műhely nézet** PIN mögött (a bemutató PIN-je a lapon ki van írva: `2468`):
  a nap foglalásai és a nyitott ajánlatkérések egy listában

## Döntések

- **Két belépő, mert kétféle ügyfél van.** Aki tudja, mi kell (olajcsere,
  vizsga előtti átnézés), az foglal. Aki csak azt tudja, hogy „kopog”, az
  leírja, és hívást kér. A foglalóban egy link átviszi az ajánlatkérőbe, az
  autó és az elérhetőség adatai megmaradnak.
- **Csak az a sáv jelenik meg, amibe a teljes munka belefér**, és mentéskor
  újra ellenőrzi, hogy közben nem foglalták-e le. A sávszámítás
  (`slots.js`) az időpontfoglaló demóból jön, tesztekkel.
- **A rendszámot a gép egységesíti.** `abc123`, `ABC 123`, `aabb123` mind
  elfogadott, és `ABC-123` / `AA BB-123` alakban kerül a listába. Így a
  műhelyben egy rendszám egyféleképp néz ki.
- **localStorage, nem backend.** Élesben a foglalás egy adatbázisba és SMS-
  vagy e-mail-emlékeztetőbe menne; a sávszámítás nem változna.
- **A PIN nem biztonság.** Csak azt mutatja, hogy a szerviz más nézetet lát,
  mint az ügyfél. Élesben valódi bejelentkezés kell.

## Futtatás

```bash
npm install
npm test      # sávszámítás, tárolás, rendszám
npm run dev
```

## Dizájn

Az oldal egy papír munkalap: szürke nyomtatványpapír, indigókék minden,
amit kitöltenek, piros csak a pecsét és a hiba. A munkák pontozott vezetővel
árlistaként, a napok és időpontok nyomtatványos négyzetekként, a foglalás
végén "BEÍRVA" pecsét. Kutatás: Awwwards (Oreck Vacuum Repair, Speeders Car
Wash), sablonos sötét-műhelyes oldalak ellenpéldának.

React 19 + Vite, Vitest. Betűk: Big Shoulders Display + IBM Plex Sans/Mono
(latin-ext). Fotók: Lummi (szabad felhasználás).
