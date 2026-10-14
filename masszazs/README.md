# Oldó Masszázsstúdió — „Mennyi időd van?”

Bemutató projekt, saját kezdeményezés. Nem élő vállalkozás, minden ár és
időpont kitalált. A foglalás szándékosan nem megy el.

Élő: https://demo-masszazs.vercel.app

## A probléma

Aki masszázsra jelentkezik, ritkán tudja, hogy „svéd” vagy „sport” kell neki.
Azt tudja, hol fáj, és hogy mennyi ideje van. A legtöbb szalon oldala mégis a
kezelések nevével kezd.

## Mit csinál (újratervezve 2026-10-14)

- **Óra-összerakó.** Kiválasztod az időt (30-120 perc, 15-ösével) és a
  területeket; az oldal 5 perces lépésekben beosztja az időt (minden terület
  kap egy minimumot, a többit súly szerint osztja), és kiírja az árat
  (`composeSession`, `priceFor`, tesztelve). Ha a területek nem férnek bele,
  megmondja, hány perc kell, és egy gombbal átállítja.
- **A terv sávja:** színes blokkok percre, kezdési időkkel, mint egy napirend.
- **Első szabad időpontok** a választott hosszhoz: kedd-szombat, legalább két
  órával előre, zárás előtt befejeződik (`freeSlots`, tesztelve).
- **Ajándékutalvány percre**, élő előnézettel, egy évig érvényes
  (`voucherExpiry`, tesztelve, a február 29-et is kezeli).
- Masszőr, a stúdió fotói, vélemények, GYIK.
- `HealthAndBeautyBusiness` schema.org adat.

## Döntések

- **Nappali fény, len és agyag.** A korábbi sötét, testtérképes változat
  helyett; Máté szerint a funkció és a dizájn sem volt jó.
- **Nincs keretrendszer.** A logika a `therapy.js`-ben, tesztelve.
- A foglaltság egy dátumból számolt, stabil mintázat, nem véletlen.
- Betűk: Familjen Grotesk + Onest (@fontsource, SIL OFL). Fotók: Unsplash
  (ingyenes licenc). Minden mozgás kikapcsol `prefers-reduced-motion` alatt.

## Futtatás

```bash
npm install
npm test
npm run dev
```
