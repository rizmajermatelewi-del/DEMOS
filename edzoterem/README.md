# Súlypont Edzőterem — „Mikor üres a terem?”

Bemutató projekt, saját kezdeményezés. Nem élő vállalkozás, minden ár, óra és
telítettségi adat kitalált. A jelentkezés szándékosan nem megy el.

Élő: https://demo-edzoterem.vercel.app

## A probléma

Az edzőteremben a legnagyobb bosszúság nem az ár, hanem a sor a pad és a
guggolóállvány mellett. Aki rugalmas, szívesen jönne, amikor üres, de nem
tudja, mikor az.

## Mit csinál (újratervezve 2026-10-14)

- **Heti telítettségi térkép:** napok × órák, színnel. Egy órára koppintva
  megmutatja a telítettséget és azt, hogy a szabad súlyoknál, a gépeknél, a
  kardiónál és a funkcionális részen hány hely szabad, plusz a nap
  legcsendesebb két óráját (`crowd`, `freeByZone`, `quietest`, tesztelve).
  Telefonon a tengelyek megfordulnak: órák lefelé, napok oldalra.
- **„Erre az időre jönnék”** gomb: a kiválasztott időpontot beírja az
  ingyenes első edzés jelentkezésébe.
- **Bérletkalkulátor:** heti hány alkalom alapján napijegy, 10 alkalmas és havi
  bérlet havi ára és alkalmankénti ára, a legolcsóbb kiemelve (`compare`,
  tesztelve).
- A fejlécben az aktuális telítettség, órarend, edzők, GYIK.
- `ExerciseGym` schema.org adat.

## Döntések

- **Beton, kréta, jelzőnarancs.** A korábbi súlytárcsás bérletválasztó helyett;
  Máté szerint a funkció és a dizájn sem volt jó.
- **Nincs keretrendszer.** A logika a `crowd.js`-ben, tesztelve; a telítettség
  egy kitalált, de hihető heti görbe (reggeli és munka utáni csúcs), stabil.
- Betűk: Barlow + Barlow Condensed (@fontsource, SIL OFL). Fotók: Unsplash.

## Futtatás

```bash
npm install
npm test
npm run dev
```
