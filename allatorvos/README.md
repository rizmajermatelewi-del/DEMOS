# Mancs Állatorvosi Rendelő: oltási naptár és ügyelet

Bemutató projekt, saját kezdeményezés. Nem élő vállalkozás, minden adat kitalált,
a naptár tájékoztató, nem orvosi tanács.

## A probléma

Kölyökkutyánál, kiscicánál a gazda nem tudja fejben tartani, mikor jön a
következő oltás, melyik kötelező (veszettség, mikrochip), és mikor van
rendelés. A rendelő telefonja ezekkel a kérdésekkel csörög.

## Mit csinál

- **Oltási naptár:** faj és születési dátum alapján idővonal (`schedule`):
  megvolt / elmaradt / hamarosan (30 napon belül) / később, a kötelezők
  kiemelve, az évente ismétlődők a „megvolt” jelölés után a következő évre
  ugranak.
- **SMS-emlékeztető kérése:** 5 nappal előtte, ha az már elmúlt, még aznap.
- **Rendelés vagy ügyelet** a fejlécben a valódi idő szerint
  (`clinicState`), ügyeleti szám kiemelve.

## Döntések

- A naptár a gazdának szól: dátumokkal, nem hetekben számolva.
- Vanilla JS + Vite. Logika: `src/logic.js`, tesztek: `npm test`.

## Források

Fotók: Unsplash (ingyenes licenc). Betűk: Rubik, Nunito (SIL OFL). Ikonok: Phosphor (MIT).
