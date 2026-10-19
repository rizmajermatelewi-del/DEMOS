# Lencse Optika: recept, keret, szemvizsgálat

Bemutató projekt, saját kezdeményezés. Nem élő vállalkozás, minden adat kitalált.

## A probléma

A szemüvegrecept számsor (SPH, CYL, AX, ADD), amit senki nem ért, és nem
derül ki belőle, mennyibe kerül majd a lencse. Az optikák oldala többnyire
márkalogók és nyitvatartás.

## Mit csinál

- **Látásvizsgáló tábla a nyitóképen**, a legalsó sor az üzlet neve.
- **Recept-magyarázó:** a két szem értékeiből közérthető mondatok
  (`describe`), ellenőrzés (negyed lépés, tengely a cilinderhez:
  `recipeProblems`), és lencseajánlás az erősebb szem alapján: 1,5 / 1,6 /
  1,67 / 1,74 index, multifokális felárral, egy pár árával (`lensFor`).
- **Keret az arcformához:** arcforma és keret választható, a tükörben
  SVG-rajzon látszik, és megmondja, miért ajánlott vagy nem.
- **Szemvizsgálat** 20 perces időpontokkal (`examSlots`).

## Döntések

- Lenyíló listák a recepthez: nincs tizedesvessző-pont gond, és csak
  érvényes érték választható.
- Vanilla JS + Vite. Logika: `src/logic.js`, tesztek: `npm test`.

## Források

Fotók: Unsplash (ingyenes licenc). Betű: Epilogue (SIL OFL).
