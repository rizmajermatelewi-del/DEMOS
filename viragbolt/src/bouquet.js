/** Today's buckets. Prices per stem in Ft; stock is what is left in the shop today. */
export const FLOWERS = [
  { id: 'rozsa', name: 'Rózsa', latin: 'Rosa', price: 890, stock: 18, kind: 'focal', color: '#b3202c' },
  { id: 'tulipan', name: 'Tulipán', latin: 'Tulipa', price: 450, stock: 25, kind: 'focal', color: '#ef7b45' },
  { id: 'gerbera', name: 'Gerbera', latin: 'Gerbera', price: 520, stock: 12, kind: 'focal', color: '#f2b705' },
  { id: 'liziantusz', name: 'Liziantusz', latin: 'Eustoma', price: 690, stock: 9, kind: 'focal', color: '#a58bcf' },
  { id: 'eukaliptusz', name: 'Eukaliptusz', latin: 'Eucalyptus', price: 390, stock: 30, kind: 'green', color: '#7f9d86' },
  { id: 'fatyolvirag', name: 'Fátyolvirág', latin: 'Gypsophila', price: 350, stock: 20, kind: 'green', color: '#f4f1ea' },
]
export const WRAPS = {
  kraft: { name: 'Kraftpapír', price: 0 },
  selyem: { name: 'Selyempapír', price: 400 },
  doboz: { name: 'Kalapdoboz', price: 2400 },
}
export const BINDING = 1200
export const MAX_STEMS = 35

const byId = Object.fromEntries(FLOWERS.map((f) => [f.id, f]))

/** Clamp a stem count to what is in stock and what one bouquet can hold. */
export function setCount(counts, id, n) {
  const others = Object.entries(counts).reduce((sum, [k, v]) => (k === id ? sum : sum + v), 0)
  const max = Math.min(byId[id].stock, MAX_STEMS - others)
  return { ...counts, [id]: Math.max(0, Math.min(max, n)) }
}

export function stemCount(counts) {
  return Object.values(counts).reduce((a, b) => a + b, 0)
}

/** Price lines: stems, the wrap, and binding once there is anything to bind. */
export function price(counts, wrap = 'kraft') {
  const stems = FLOWERS.reduce((sum, f) => sum + (counts[f.id] ?? 0) * f.price, 0)
  const n = stemCount(counts)
  const w = n ? (WRAPS[wrap] ?? WRAPS.kraft).price : 0
  const binding = n ? BINDING : 0
  return { stems, wrap: w, binding, total: stems + w + binding }
}

/**
 * Where each stem goes in the fan. Focal flowers take the middle, greens the edges,
 * alternating left and right so the bouquet stays balanced. Angles in degrees.
 */
export function arrange(counts) {
  const order = [...FLOWERS.filter((f) => f.kind === 'focal'), ...FLOWERS.filter((f) => f.kind === 'green')]
  const stems = order.flatMap((f) => Array.from({ length: counts[f.id] ?? 0 }, () => f.id))
  const spread = Math.min(56, 10 + stems.length * 2.8)
  return stems.map((id, i) => {
    const side = i % 2 ? 1 : -1
    const step = Math.ceil(i / 2)
    const angle = i === 0 ? 0 : side * Math.min(spread, (step * spread) / Math.max(1, Math.ceil((stems.length - 1) / 2)))
    // Shorter towards the edges, with a small fixed wobble so rows do not line up.
    const length = 150 - Math.abs(angle) * 0.9 + ((i * 37) % 23) - 11
    return { id, angle: Math.round(angle * 10) / 10, length: Math.round(length) }
  })
}

/** Order form errors. */
export function orderProblems(data, counts) {
  const next = {}
  if (stemCount(counts) === 0) next.stems = 'Tegyen legalább egy szálat a csokorba.'
  if (String(data.name ?? '').trim().length < 2) next.name = 'Kérjük, írja be a nevét.'
  if (String(data.phone ?? '').replace(/\D/g, '').length < 8) next.phone = 'Egy hívható szám kell.'
  if (!data.day) next.day = 'Melyik napon viszi el?'
  if (String(data.card ?? '').length > 80) next.card = 'A kártyára legfeljebb 80 betű fér.'
  return next
}

const SAME_DAY_UNTIL = 16 // an order after 16:00 is bound tomorrow
const WEEKDAYS = ['vas', 'hét', 'kedd', 'sze', 'csüt', 'pén', 'szo']

/** The next `count` pickup days: Sunday is closed, today only until 16:00. */
export function pickupDays(now = new Date(), count = 5) {
  const out = []
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  if (now.getHours() >= SAME_DAY_UNTIL) d.setDate(d.getDate() + 1)
  while (out.length < count) {
    if (d.getDay() !== 0) {
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      out.push({ iso, day: d.getDate(), weekday: WEEKDAYS[d.getDay()], saturday: d.getDay() === 6 })
    }
    d.setDate(d.getDate() + 1)
  }
  return out
}
