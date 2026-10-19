// Lencse Optika: recept-magyarázó, lencseajánló, keret az arcformához, szemvizsgálat. Minden adat kitalált.

const fmt = (n) => (n > 0 ? '+' : n < 0 ? '−' : '') + Math.abs(n).toFixed(2).replace('.', ',')

/** Egy szem receptje közérthetően. sph, cyl dioptriában, ax fokban, add a közeli olvasáshoz. */
export function describe({ sph = 0, cyl = 0, ax = 0, add = 0 }) {
  const out = []
  if (sph < 0) out.push(`${fmt(sph)} dioptria rövidlátás: a távoli dolgok homályosak${sph <= -6 ? ', ez erős' : sph <= -3 ? ', ez közepes' : ', ez enyhe'}.`)
  else if (sph > 0) out.push(`${fmt(sph)} dioptria távollátás: közelre kell jobban erőlködnie${sph >= 4 ? ', ez erős' : sph >= 2 ? ', ez közepes' : ', ez enyhe'}.`)
  else out.push('Gömbi eltérés nincs (0,00).')
  if (cyl !== 0) out.push(`${fmt(cyl)} dioptria szemtengelyferdülés (cilinder), ${ax}°-os tengelyben: a szaruhártya nem egyformán görbült, ezért egyes vonalak elmosódnak.`)
  if (add > 0) out.push(`Olvasáshoz ${fmt(add)} dioptriával erősebb rész kell (addíció): ez jellemzően 40 év fölött jelenik meg.`)
  return out
}

/** Mi hiányzik vagy nem stimmel a receptben; üres lista = rendben. */
export function recipeProblems({ sph, cyl, ax, add }) {
  const out = []
  const quarter = (n) => Number.isFinite(n) && Math.abs(n * 4 - Math.round(n * 4)) < 1e-9
  if (!quarter(sph) || sph < -20 || sph > 20) out.push('A gömbi érték (SPH) −20 és +20 között, negyedenként változik.')
  if (!quarter(cyl) || cyl < -6 || cyl > 0) out.push('A cilinder (CYL) 0 és −6 között, negyedenként változik.')
  if (cyl !== 0 && !(Number.isInteger(ax) && ax >= 0 && ax <= 180)) out.push('Cilinder mellé tengely (AX) is kell, 0 és 180 fok között.')
  if (!quarter(add) || add < 0 || add > 3.5) out.push('Az addíció (ADD) 0 és +3,50 között van.')
  return out
}

// Lencseindex: minél erősebb a recept, annál vékonyabb anyag éri meg.
export const LENSES = [
  { index: '1.5', upTo: 2, price: 9900, note: 'alap, enyhe receptre' },
  { index: '1.6', upTo: 4, price: 18900, note: 'vékonyabb, könnyebb' },
  { index: '1.67', upTo: 6, price: 29900, note: 'jóval vékonyabb széle' },
  { index: '1.74', upTo: Infinity, price: 44900, note: 'a legvékonyabb, erős receptre' },
]

/** A két szem közül az erősebbhez (gömbi + cilinder abszolút értéke) választ; ár egy párra. */
export function lensFor(right, left) {
  const power = Math.max(...[right, left].map((e) => Math.abs(e.sph ?? 0) + Math.abs(e.cyl ?? 0)))
  const lens = LENSES.find((l) => power <= l.upTo)
  const progressive = (right.add ?? 0) > 0 || (left.add ?? 0) > 0
  return { ...lens, power, progressive, pair: lens.price * 2 + (progressive ? 30000 : 0) }
}

// Keret az arcformához
export const FACES = {
  kerek: { name: 'Kerek', frames: ['szogletes', 'macskaszem'], why: 'szögletes keret ad neki karaktert' },
  ovalis: { name: 'Ovális', frames: ['kerek', 'szogletes', 'pilota'], why: 'szinte minden jól áll, bátran kísérletezhet' },
  szogletes: { name: 'Szögletes', frames: ['kerek', 'pilota'], why: 'lekerekített keret lágyítja a vonásokat' },
  sziv: { name: 'Szív alakú', frames: ['pilota', 'kerek'], why: 'lefelé szélesedő keret egyensúlyozza a széles homlokot' },
}
export const FRAMES = { kerek: 'Kerek', szogletes: 'Szögletes', macskaszem: 'Macskaszem', pilota: 'Pilóta' }

// Szemvizsgálat: 20 perces sávok
export const EXAM_DAYS = [1, 2, 3, 4, 5, 6]
function hash(s) {
  let h = 2166136261
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  return h >>> 0
}
/** A következő `n` vizsganap szabad időpontjai (stabil, kitalált foglaltsággal). */
export function examSlots(from, n = 4) {
  const out = []
  for (let i = 1; out.length < n && i < 21; i++) {
    const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + i)
    if (!EXAM_DAYS.includes(d.getDay())) continue
    const end = d.getDay() === 6 ? 12 * 60 : 17 * 60
    const times = []
    for (let m = 9 * 60; m + 20 <= end; m += 20) if (hash(`${d.toDateString()}|${m}`) % 3 === 0) times.push(m)
    out.push({ date: d, times: times.slice(0, 6) })
  }
  return out
}
