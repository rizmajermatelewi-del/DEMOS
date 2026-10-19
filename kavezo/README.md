# Szemközt kávézó és borbár: nappal kávé, este bor

Bemutató projekt, saját kezdeményezés. Nem élő vállalkozás, minden adat kitalált.

## A probléma

Egy kávézó, ami este borbár, két közönségnek szól, de az oldala többnyire
csak az egyiknek: reggeli kávét keresők nem tudják, hogy este bor és program
van, az esti vendég pedig egy reggeli étlapot lát. Az esti programokra (kvíz,
borkóstoló, koncert) telefonon foglalnak, és senki nem tudja, mennyi hely maradt.

## Mit csinál

- **Napszak-csúszka:** 7:00 és éjfél között húzható. Az egész oldal színe
  átúszik nappaliból estibe, a fotó is, és a kínálat a napszakhoz igazodik
  (reggel, napközben, aperitivo, este).
- **Nyitva / zárva** a fejlécben a valódi idő szerint, a mai nap kiemelve a
  nyitvatartásban.
- **Esti programok** jegyként, szabad hellyel (`upcoming`): kedd kvíz,
  csütörtök borkóstoló, péntek jazz. Asztalkérés létszámmal, asztal vagy
  bárpult; betelt estére nem enged, a kvízcsapat legfeljebb 6 fő.
- A végén megmutatja, hogyan látja a pult a kérést.

## Döntések

- Egy CSS-változó (`--n`, 0 = nappal, 1 = este) keveri a két palettát
  `color-mix`-szel, így a teljes oldal egyetlen számtól függ.
- Vanilla JS + Vite. Logika: `src/logic.js`, tesztek: `npm test`.

## Források

Fotók: Unsplash (ingyenes licenc). Betűk: Bodoni Moda, Hanken Grotesk (SIL OFL, Fontsource).
