# Küllő Kerékpárszerviz: bökjön rá, mi a baja

Bemutató projekt, saját kezdeményezés. Nem élő vállalkozás, minden adat kitalált.

## A probléma

Aki biciklit visz szervizbe, ritkán tudja, hogy hívják, ami nem jó rajta
(bowden, váltó, centírozás). Az oldalakon szolgáltatáslista van, amiből nem
derül ki, mennyi lesz és mikor fér be a munka. Tavasszal pedig mindenki
egyszerre jönne.

## Mit csinál

- **Kattintható bicikli:** a rajzon kerék, fék, lánc, váltó, kormány; az
  alkatrészre bökve a hozzá tartozó szolgáltatások árral és idővel.
- **Munkalap:** a kijelöltekből összeg és szerelőidő (`workOrder`). Csomag
  (átvizsgálás, nagyszerviz) mellett a beállítás benne van, csak a csere
  számít külön.
- **Leadási napok szabad szerelőidővel** (`dropDays`): csak az a nap
  választható, ahová befér a munka; szombatra csak rövid munka (`fits`).

## Döntések

- A rajz SVG, a pontok valódi gombok a rajz fölött (billentyűzettel és
  képernyőolvasóval is használható).
- Vanilla JS + Vite. Logika: `src/logic.js`, tesztek: `npm test`.

## Források

Fotók: Unsplash (ingyenes licenc). Betűk: Saira, Saira Condensed (SIL OFL).
