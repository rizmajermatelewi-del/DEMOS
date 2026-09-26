# Kispipa Büfé — napi menü

Bemutató projekt, saját kezdeményezés. Nem élő étterem, minden adat kitalált.

Élő: https://demo-napi-menu.vercel.app

## A probléma

A legtöbb kisvendéglő a napi menüt egy kinyomtatott lap fotójaként teszi ki
Facebookra. A vendég nem találja meg keresőből, telefonon nehezen olvasható,
és a tulajdonosnak minden nap újra kell fotóznia.

## Mit csinál

- Nyilvános „mai menü” tábla: leves, főételek, desszert, forintárak
- Heti áttekintés (hétfő–péntek, hétvégén zárva)
- Jelszavas szerkesztő a tulajdonosnak (bemutató jelszó: `menu2026`)

## Döntések

- **Rossz adat nem írhatja felül a táblát.** A `normalizeMenu` minden napot
  ellenőriz (üres név, negatív vagy 100 000 Ft feletti ár, hiányzó leves vagy
  desszert). Ha egy nap hibás, a heti minta marad a helyén, nem egy félig üres
  lap.
- **A mentés is ugyanazon az ellenőrzésen megy át**, nem csak a betöltés — a
  szerkesztő nem tud olyat elmenteni, amit a tábla nem tud kirajzolni.
- **localStorage + sessionStorage, nem backend.** A menü a böngészőben marad,
  a belépés csak a munkamenetig él. Élesben Supabase auth + egy tábla jönne;
  a tábla és az ellenőrzés nem változna.
- **A jelszó nem biztonság.** A bemutatóban a lapon ki van írva; élesben
  valódi bejelentkezés kell.

## Futtatás

```bash
npm install
npm test      # tárolás + ellenőrzés
npm run dev
```

React 19 + Vite, `node --test`. Betű: Sofia Sans Condensed + Figtree (@fontsource,
latin-ext). A menü betűtáblán jelenik meg; a szerkesztő mellett élőben látszik,
hogyan kerül ki a táblára. Hétvégén a tábla már a hétfői menüt mutatja.
