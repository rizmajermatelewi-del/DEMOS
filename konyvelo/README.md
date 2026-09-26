# Pálfi Könyvelőiroda — havidíj-kalkulátor és határidőnapló

Bemutató projekt, saját kezdeményezés. Nem élő vállalkozás, minden adat és
ár kitalált. Az űrlap szándékosan nem küld e-mailt.

Élő: https://demo-konyvelo.vercel.app

## A probléma

Egy kisvállalkozó két dolgot akar tudni egy könyvelőtől, mielőtt felhívja:
mennyibe kerül, és figyel-e a határidőkre. A legtöbb irodai oldal erre egy
„Kérjen árajánlatot” gombot ad, és semmi mást.

## Mit csinál

- **Havidíj-kalkulátor, ami számolószalagra nyomtat.** Cégforma, bizonylatszám,
  alkalmazottak, ÁFA. Minden változásnál a gép kinyomtatja a módosult sort, a
  végösszeg piros tintával. A szalag letéphető, és csatolásként az
  ajánlatkérő űrlapra kerül.
- **Tépőnaptár a következő NAV-határidőkkel** (12-e járulék, 20-a ÁFA, május
  szja és beszámoló). Hétvégére eső határidő hétfőre tolódik. A lap letéphető.
- Magázó, nyugodt hang; űrlap mezőnkénti hibaüzenettel.
- `AccountingService` schema.org adat a helyi kereséshez.

## Döntések

- **Nincs keretrendszer.** HTML + CSS + egy kis script; a Vite csak build.
- **A számítás és a határidők egy tesztelt modulban** (`fee.js`), a DOM a
  `main.js`-ben.
- **Ünnepnapokat nem ismer** a határidő-számítás, csak hétvégét (jelölve a
  kódban).
- Fontok saját hosztolásból (@fontsource: Schibsted Grotesk + DM Mono), a
  hajtás feletti fájlok előtöltve. Mozgás csak `prefers-reduced-motion:
  no-preference` mellett.

## Mérés

Lighthouse mobil, 2026-09-26: 100 / 100 / 100 / 100.

## Futtatás

```bash
npm install
npm test      # díjszámítás, határidők, űrlap
npm run dev
```
