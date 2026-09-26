# Zománc Fogászat — fogszín-skála és sürgősségi időpont

Bemutató projekt, saját kezdeményezés. Nem élő vállalkozás, minden ár
kitalált. Az időpontkérés szándékosan nem megy el.

Élő: https://demo-fogaszat.vercel.app

## A probléma

Fogorvoshoz sokan félve mennek, és két kérdéssel: mi fog történni, és
mennyibe kerül. A fehérítésnél ráadásul azt sem tudják, mennyit érdemes
várni. A legtöbb rendelő oldala erre egy szolgáltatáslistát ad.

## Mit csinál

- **Fogszín-skála.** A 16 árnyalatú VITA skálán beállítod a mostani és a
  kívánt színt (csúszkával vagy a fülekre kattintva); a mosoly-rajz átszíneződik,
  és kiírja, hány fehérítés kell és kb. mennyiért (`whiteningQuote`, tesztelve).
  A terv csatolható az időpontkéréshez.
- **Most fáj?** A következő sürgősségi időpont a valódi órából számolva:
  hétköznap 7:30-8:30, negyedóránként, hétvégén hétfőre ugrik (`emergencySlot`,
  tesztelve).
- Árak előre, és egy „Félek a fogorvostól” jelölő, amire a visszaigazolás is
  reagál.
- `Dentist` schema.org adat.

## Döntések

- **Nincs keretrendszer.** A logika a `shade.js`-ben, tesztelve.
- A szöveg Atkinson Hyperlegible betűvel megy, mert idősebb, szorongó
  pácienseknek is jól olvasható; a címek Onest.
- A skála színei közelítések, nem a gyári minták pontos másolatai.
- Fotó: Unsplash Bg81yWKZlMg.

## Mérés

Lighthouse mobil, 2026-09-26: 100 / 100 / 100 / 100.

## Futtatás

```bash
npm install
npm test
npm run dev
```
