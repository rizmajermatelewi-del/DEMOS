# Dr. Halmi Ügyvédi Iroda: mennyi és meddig

Bemutató projekt, saját kezdeményezés. Nem élő vállalkozás, minden adat kitalált,
nem jogi tanács.

## A probléma

Aki ügyvédet keres, két dolgot kérdez először: mennyibe kerül és meddig
tart. A legtöbb irodai oldal szakterület-listát mutat, díjat és határidőt nem,
és az első találkozóra sokan hiányos iratokkal érkeznek.

## Mit csinál

- **Milyen ügye van?** Hat gyakori ügytípus: mit csinál az iroda, mennyi
  ideig tart, várható munkadíj (`feeFor`; ingatlannál a vételár 0,8%-a,
  legalább 80 000 Ft, a vételár beírható).
- **Hozza magával:** ügyirat-dosszié az ügyhöz tartozó iratokkal,
  pipálható (`docsProgress`), és kinyomtatható (nyomtatáskor csak a lista).
- **Első konzultáció:** 30 perces időpontok, kedden és csütörtökön este 6-ig
  (`consultSlots`).

## Döntések

- Díj sávval és alsó határral: ez a gyakorlat, és már ez is több, mint amit
  a legtöbb oldal mond.
- Vanilla JS + Vite. Logika: `src/logic.js`, tesztek: `npm test`.

## Források

Fotók: Unsplash (ingyenes licenc). Betűk: Newsreader, Public Sans (SIL OFL).
