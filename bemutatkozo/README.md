# Kovács Villanyszerelés — egyoldalas bemutatkozó

Bemutató projekt, saját kezdeményezés. Nem élő vállalkozás, minden adat
kitalált. Az űrlap szándékosan nem küld e-mailt.

Élő: https://demo-bemutatkozo.vercel.app

## A probléma

Egy villanyszerelőnek nem webshop vagy CMS kell, hanem egy oldal, ami
telefonon egy másodperc alatt betölt, megmondja, mit vállal és hol, és egy
koppintással hívható. A legtöbb ilyen oldal egy nehéz sablon, ami lassabb,
mint amit a tartalma indokol.

## Mit csinál

- Egy oldal: mit vállal, hol dolgozik, mikor érhető el, hívás gomb
- Ajánlatkérő, ahol a munkát kismegszakítók felkapcsolásával választod ki egy
  DIN-sínes elosztótáblán; a felkapcsolt kör leírása kigyullad
- Fejléc-LED a valódi nyitvatartásból: zöld, ha most hívható, különben piros a
  következő időponttal (`status.js`, tesztelve)
- Mezőnként megnevezett hiba; egy felkapcsolt munka kiváltja a leírást
- `Electrician` típusú schema.org adat (cím, nyitvatartás, kiszállási terület)
  a helyi kereséshez

## Mérés

Lighthouse, mobil emuláció, 2026-09-26, az újratervezés után:

| Performance | Accessibility | Best Practices | SEO |
|---|---|---|---|
| 99 | 100 | 100 | 100 |

A fontok saját hosztolásúak (@fontsource: Saira + Martian Mono), a hajtás
feletti fájlok előtöltve.

## Döntések

- **Nincs keretrendszer.** Sima HTML + CSS + egy 36 soros script. A Vite csak
  build eszköz. Egy oldalhoz, ami nem változik, a React több kódot szállítana,
  mint maga a tartalom.
- **Az űrlap-ellenőrzés külön, tesztelt függvény** (`validate.js`), a DOM
  kezelése a `main.js`-ben. A hibaüzenet a mező mellé kerül, `aria-invalid`
  és `aria-describedby` jelzéssel, a fókusz az első hibás mezőre ugrik.
- **A hívás a fő cselekvés**, nem az űrlap: a telefonszám a fejlécben és a
  hero-ban is `tel:` link.
- **A bemutató nem küld e-mailt.** Élesben egy űrlapszolgáltatás (pl.
  Formspree) kerülne a submit mögé.

## Futtatás

```bash
npm install
npm test      # űrlap-ellenőrzés
npm run dev
```

Vite, `node --test`.
