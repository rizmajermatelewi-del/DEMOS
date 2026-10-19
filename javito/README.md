# Csavar Szerviz: árbecslés, munkalap, nyomtatás

Bemutató projekt, saját kezdeményezés. Nem élő vállalkozás, minden adat kitalált.

## A probléma

Egy telefon- és számítógép-javítót egész nap ugyanazzal hívnak: „mennyi
lenne a kijelző?”, „kész van már?”. Az oldala egy szolgáltatáslista
telefonszámmal, árat és határidőt nem mond.

## Mit csinál

- **Árbecslés:** eszköz, márka, hiba, és máris nyugtát kap a vendég:
  ársáv, raktáron van-e az alkatrész, és mikorra lesz kész (`estimate`:
  gyors hiba raktárról 14 óráig aznap, alkatrészre várva 3 munkanap,
  a hétvégét átugorja).
- **Munkalap-követés:** a munkalapszámmal (CS-1234) pecsétes lépésekben
  mutatja, hol tart a javítás (`track`). A minták: CS-2422, CS-2417, CS-2419.
- **Nyomtatás, fénymásolás:** oldalszám, színes, kétoldalas, 100 oldaltól
  kedvezmény (`printPrice`).

## Döntések

- Ársáv, nem fix ár: a pontos összeget bevizsgálás után mondják, a vendég
  jóváhagyásával. Ez a szokás egy kis szervizben.
- Vanilla JS + Vite. Logika: `src/logic.js`, tesztek: `npm test`.

## Források

Fotók: Unsplash (ingyenes licenc). Betűk: JetBrains Mono, IBM Plex Sans (SIL OFL). Ikonok: Phosphor (MIT).
