# Súlypont Edzőterem — bérlet súlyzórúdon

Bemutató projekt, saját kezdeményezés. Nem élő vállalkozás, minden ár és
óra kitalált. A jelentkezés szándékosan nem megy el.

Élő: https://demo-edzoterem.vercel.app

## A probléma

Az edzőtermek árlistája általában öt bérlettípus egy táblázatban, apró
betűs feltételekkel. Aki csak gépezni és néha szaunázni jár, nem tudja, melyik
az övé, és mennyit fizet olyanért, amit nem használ.

## Mit csinál

- **Bérlet a rúdon.** Az alapbérlet a 20 kg-os rúd; minden extra egy
  bumper tárcsa a súlyemelő színkódja szerint (piros 25, kék 20, sárga 15,
  zöld 10, fehér 5). A tárcsák mindkét oldalra felcsúsznak, a legnehezebb
  kerül a zárhoz; a rúd „súlya” mellett ott a havidíj.
- Hűségkedvezmény: havi, 6 hónap (−10%), 12 hónap (−20%).
- **Mai órák** élő szabad hellyel; az elmúlt órák zárva, ha a napiak véget
  értek, a holnapiakat mutatja.
- Ingyenes első edzés, az összerakott bérlet csatolva.
- `ExerciseGym` schema.org adat.

## Döntések

- **Nincs keretrendszer.** Ár, súly, tárcsasorrend és órarend a `plates.js`-ben,
  tesztelve; a rajzolás a `main.js`-ben, kulcsolt SVG-elemekkel.
- A foglaltság dátumból számolt, stabil mintázat.
- Fontok saját hosztolásból (@fontsource: Anton + Rubik).
- Fotó: Unsplash qZ-U9z4TQ6A.

## Mérés

Lighthouse mobil, 2026-09-26: 99 / 100 / 100 / 100.

## Futtatás

```bash
npm install
npm test
npm run dev
```
