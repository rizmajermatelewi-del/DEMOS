# Szálirány Asztalosműhely — szekrény méretre, a rajzon

Bemutató projekt, saját kezdeményezés. Nem élő vállalkozás, minden ár
becslés és mintaadat. Az ajánlatkérés szándékosan nem megy el.

Élő: https://demo-asztalos.vercel.app

## A probléma

Asztalosnál az első kérdés mindig az, hogy „nagyjából mennyi lenne”. Erre
általában csak felmérés után jön válasz, addig a vevő nem tudja, belefér-e.

## Mit csinál

- **Szekrény a rajzon.** Elölnézeti műszaki rajz méretvonalakkal; a kék
  fogantyúkkal húzod a szélességet és a magasságot (egész centire, 40-240 cm),
  vagy beírod. Mélység, polcok száma, ajtó, faanyag (tölgy, dió, nyír
  rétegelt, festett MDF, a rajzon a fa erezetével).
- **Becsült ár és szabásjegyzék** élőben: oldallap, tető/fenék, polcok,
  hátfal, ajtók mm-ben, ebből anyag + vasalat + munkadíj (`cabinet.js`,
  tesztelve).
- A rajz csatolható az ajánlatkéréshez.
- Többi munka: konyha, beépített szekrény, lépcső, ablak és üvegezés.
- `HomeAndConstructionBusiness` schema.org adat.

## Döntések

- **Nincs keretrendszer.** A számítás a `cabinet.js`-ben, a rajzolás és a
  húzás (Pointer Events, `setPointerCapture`) a `main.js`-ben.
- A beírt méretet csak a mező elhagyásakor vágja a határok közé, hogy gépelés
  közben ne ugráljon.
- A „ceruza” egyszer rajzolja ki a szekrényt, amikor a tábla a nézetbe ér;
  húzáskor már nem animál.
- Fontok saját hosztolásból (@fontsource: Archivo + Caveat).
- Fotó: Unsplash PxlKOcj0a3Q.

## Mérés

Lighthouse mobil, 2026-09-26: 99 / 100 / 100 / 100.

## Futtatás

```bash
npm install
npm test
npm run dev
```
