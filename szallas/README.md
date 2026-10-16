# Diófa Vendégház: kulcstábla és közvetlen foglalás

Bemutató projekt, saját kezdeményezés. Nem élő szállás, minden adat kitalált
(árak, foglaltság, vendégkönyv).

## A probléma

Egy négyszobás vendégház a vendégei nagy részét foglalási portálokon kapja,
és minden foglalás után kb. 15% jutalékot fizet. A saját oldala, ha van,
egy fotógaléria telefonszámmal: a vendég nem látja, van-e szabad szoba,
mennyibe kerül IFA-val együtt, és miért érné meg közvetlenül foglalnia.

## Mit csinál

- **Kulcstábla:** a dátum, az éjszakák, a létszám és a kutya megadása után
  csak a szabad szobák kulcsa lóg a táblán. A foglalt kampó mellett krétával
  ott van, mikortól szabad. Ami szabad, de nem jó (kicsi, kutyával nem),
  az halványan lóg, krétás megjegyzéssel.
- **Szállásjegy:** soronkénti ár (éjszakák, hétvégi felár, pótágy, kutya,
  reggeli) és az IFA külön, csak a 18 év feletti vendégekre.
- **Ugyanaz a szoba, két áron:** a portálár (szállásdíj + jutalék) és a
  közvetlen ár egymás alatt, a különbség forintban.
- **Ha semmi sem jó** a megadott feltételekkel, megmutatja az első érkezési
  napot, amikor van hely, és egy gombbal oda ugrik.
- **Foglalási kérés, nem fizetés:** név, elérhetőség, érkezés sávja, előleg
  átutalással vagy SZÉP-kártyával. A végén megmutatja, mit kap a vendég
  e-mailben, és mit lát a gazda a telefonján (jutalék: 0 Ft).

## Döntések

- **Kérés + előleg, nem online fizetés.** Egy kis vendégház így dolgozik:
  visszaigazol, előleget kér, a SZÉP-kártya elfogadása kötelező szokás.
- **A foglaltság kitalált, de stabil:** ugyanarra a napra mindig ugyanaz jön
  ki (`isBooked`), hétvégén több a foglalt éj.
- Vanilla JS + Vite, keretrendszer nélkül. A logika a `src/stay.js`-ben,
  tesztekkel (`npm test`, node:test).

## Források

Fotók: Unsplash (ingyenes licenc). Betűk: Sofia Sans, Sofia Sans Condensed,
Caveat (SIL OFL, Fontsource). Ikonok: Phosphor (MIT).
