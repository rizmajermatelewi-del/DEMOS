# Masni Ajándékbolt: ajándékkereső és félretétel

Bemutató projekt, saját kezdeményezés. Nem élő bolt, minden adat kitalált.

## A probléma

Egy helyi ajándékbolt oldala többnyire egy galéria a polcról. Aki ajándékot
keres, nem tudja, mi van most bent, mi fér bele a keretébe, és hogy érdemes-e
beugrania. A webshop egy kis boltnak túl sok (szállítás, online fizetés).

## Mit csinál

- **Ajándékkereső:** kinek (anya, kolléga, gyerek…), mire (névnap,
  karácsony, köszönet…), legfeljebb mennyi. A készletből ajánl, az elfogyott
  a végére kerül, a kevés darabszám jelölve (`suggest`).
- **Csomagolás élő előnézettel:** kraft, színes papír masnival, díszdoboz;
  a CSS-ből rajzolt ajándék és a kártya szövege gépelés közben frissül.
- **Félretétel, nem webshop:** a következő nyitvatartási nap zárásáig
  (`holdUntil`, vasárnapot átugorja), rövid bediktálható kóddal
  (`holdCode`). A végén azt is mutatja, mit lát a bolt a telefonján.

## Döntések

- Fizetés a boltban: így egy kis boltnak nincs szállítás és online fizetés.
- Vanilla JS + Vite. Logika: `src/logic.js`, tesztek: `npm test`.

## Források

Fotók: Unsplash (ingyenes licenc). Betűk: Syne, Work Sans (SIL OFL). Ikonok: Phosphor (MIT).
