# Pipacs Virágkötészet — csokorkötő

Bemutató projekt, saját kezdeményezés. Nem élő vállalkozás, minden ár és
készlet kitalált. A rendelés szándékosan nem megy el.

Élő: https://demo-viragbolt.vercel.app

## A probléma

Egy kis virágbolt oldalán általában egy fotógaléria és egy telefonszám van.
Aki csokrot akar, felhív, és szóban próbálja elmagyarázni, mit szeretne. Ez
a boltnak is időbe kerül.

## Mit csinál

- **Csokorkötő.** A mai vödrökből szálanként választasz (ár/szál, élő készlet,
  max. 35 szál). A csokor SVG-ben élőben kötődik: a virágok a közepére, a
  zöldek a szélére kerülnek, felváltva jobbra-balra; a meglévő szálak
  átcsúsznak az új helyükre, az újak kinőnek, a kivett szál kiemelkedik.
- Csomagolás: kraftpapír, selyempapír, kalapdoboz, felárral.
- **Kártya a szalagon.** Amit a kártyára írsz, azonnal megjelenik a masnira
  kötött cédulán.
- Átvételi napok: vasárnap zárva, aznapra 16 óráig, szombaton csak délelőtt.
- `Florist` schema.org adat.

## Döntések

- **Nincs keretrendszer.** A csokor logikája (`bouquet.js`: készlet, ár,
  elrendezés, átvételi napok, űrlap) tesztelt, a rajzolás a `main.js`-ben.
- **Kulcsolt SVG-elemek** (`rozsa-1`, `rozsa-2`…): így a szálak CSS
  transitionnel mozognak, nem rajzolódik újra az egész csokor.
- Fontok saját hosztolásból (@fontsource: Cormorant Garamond + Karla). A
  számok Karlával mennek, mert a Cormorant régi stílusú számjegyei rosszul
  olvashatók árakban.
- Fotó: Unsplash 24HcJhf0u6M, álló kivágás, a kötény logója elmosva.

## Mérés

Lighthouse mobil, 2026-09-26: 98 / 100 / 100 / 100.

## Futtatás

```bash
npm install
npm test
npm run dev
```
