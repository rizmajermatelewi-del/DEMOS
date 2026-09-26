# Oldó Masszázsstúdió — „Hol fáj?” testtérkép

Bemutató projekt, saját kezdeményezés. Nem élő vállalkozás, minden ár és
időpont kitalált. A foglalás szándékosan nem megy el.

Élő: https://demo-masszazs.vercel.app

## A probléma

Aki masszázsra jelentkezik, ritkán tudja, hogy „svéd”, „sport” vagy
„talp” kell neki. Azt tudja, hol fáj. A legtöbb szalon oldala mégis a
kezelések nevével kezd.

## Mit csinál

- **Testtérkép.** Hátulnézetes alak, a fájó zónákra koppintva azok
  „felmelegszenek”; mellette ugyanez kavics alakú jelölőkkel, billentyűzettel
  is. A fájdalom erőssége (feszül / fáj / nagyon fáj) is számít.
- **Ajánlás:** kezelés, időtartam, ár és egy mondat, hogy miért
  (`recommend`, tesztelve). Egy gombbal átviszi a foglaláshoz.
- **Első szabad időpontok** a kezelés hosszához: kedd-szombat, legalább
  két órával előre, zárás előtt befejeződik (`freeSlots`, tesztelve).
- Árlista, ahol a kavics mérete a kezelés hosszát mutatja.
- A hero-ban egy 4 mp be, 6 mp ki ritmusú légző gyűrű.
- `HealthAndBeautyBusiness` schema.org adat.

## Döntések

- **Sötét téma**, mert egy masszázsszoba félhomályos; ez az egyetlen sötét
  demó a sorozatban.
- **Nincs keretrendszer.** A logika a `therapy.js`-ben, tesztelve.
- A foglaltság egy dátumból számolt, stabil mintázat, nem véletlen, így a
  bemutató minden betöltéskor ugyanazt mutatja.
- Fontok saját hosztolásból (@fontsource: Sora + Manrope). Minden mozgás
  lassú, és `prefers-reduced-motion` alatt kikapcsol.
- Fotó: Unsplash 3aGV2ViCzrM.

## Mérés

Lighthouse mobil, 2026-09-26: 97 / 100 / 100 / 100.

## Futtatás

```bash
npm install
npm test
npm run dev
```
