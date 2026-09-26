/** Board materials: price per m² of 18 mm board, and a grain colour for the drawing. */
export const MATERIALS = {
  tolgy: { name: 'Tölgy', rate: 38000, base: '#c89b62', grain: '#a87b45' },
  dio: { name: 'Dió', rate: 52000, base: '#6f4a32', grain: '#553522' },
  nyir: { name: 'Nyír rétegelt', rate: 24000, base: '#e2cfa6', grain: '#c9b184' },
  mdf: { name: 'Festett MDF', rate: 19000, base: '#dfe2dc', grain: '#dfe2dc' },
}
export const LIMITS = { min: 40, max: 240 }
export const DEPTHS = [30, 45, 60]
const BOARD = 1.8 // cm
const BACK_RATE = 3000 // 3 mm HDF back, per m²
const HINGES_PER_DOOR = 9000
const LABOUR = 28000

/** Keep a size in whole centimetres inside the workshop's limits. */
export function clampSize(n) {
  return Math.round(Math.min(LIMITS.max, Math.max(LIMITS.min, Number(n) || LIMITS.min)))
}

/** One door up to 60 cm, then one door per started 60 cm. */
export function doorsFor(width) {
  return Math.max(1, Math.ceil(width / 60))
}

/** Parts to cut, in millimetres, the way a cut list is written. */
export function cutList({ w, h, d, shelves = 0, doors = 0 }) {
  const mm = (cm) => Math.round(cm * 10)
  const inner = w - 2 * BOARD
  const parts = [
    { name: 'Oldallap', qty: 2, a: mm(h), b: mm(d) },
    { name: 'Tető és fenék', qty: 2, a: mm(inner), b: mm(d) },
  ]
  if (shelves) parts.push({ name: 'Polc', qty: shelves, a: mm(inner - 0.2), b: mm(d - 2) })
  parts.push({ name: 'Hátfal (HDF)', qty: 1, a: mm(w), b: mm(h), back: true })
  if (doors) parts.push({ name: 'Ajtó', qty: doors, a: mm(h - 0.4), b: mm(w / doors - 0.4) })
  return parts
}

/** Rough quote from the cut list, rounded to the nearest thousand forints. */
export function quote(spec, material = 'tolgy') {
  const rate = (MATERIALS[material] ?? MATERIALS.tolgy).rate
  let board = 0
  let back = 0
  for (const p of cutList(spec)) {
    const m2 = (p.qty * p.a * p.b) / 1e6
    if (p.back) back += m2
    else board += m2
  }
  const raw = board * rate + back * BACK_RATE + (spec.doors ?? 0) * HINGES_PER_DOOR + LABOUR
  return { board: Math.round(board * 100) / 100, total: Math.round(raw / 1000) * 1000 }
}

/** Quote request errors. */
export function quoteProblems(data) {
  const next = {}
  if (String(data.name ?? '').trim().length < 2) next.name = 'Írd be a neved.'
  if (String(data.phone ?? '').replace(/\D/g, '').length < 8) next.phone = 'Egy hívható szám kell.'
  if (String(data.city ?? '').trim().length < 2) next.city = 'Hova készül a bútor?'
  return next
}
