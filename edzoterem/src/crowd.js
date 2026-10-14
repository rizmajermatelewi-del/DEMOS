/** Opening hours: weekdays 6-22, weekends 8-20. Day index as in Date#getDay (0 = Sunday). */
export function openHours(day) {
  return day === 0 || day === 6 ? [8, 20] : [6, 22]
}

const bump = (h, at, width, height) => height * Math.exp(-(((h - at) / width) ** 2))

// ponytail: an invented but believable week (morning and after-work peaks), stable for a demo.
/** How full the gym is, 0-100, for an hour that starts at `hour`. Null when closed. */
export function crowd(day, hour) {
  const [open, close] = openHours(day)
  if (hour < open || hour >= close) return null
  const weekend = day === 0 || day === 6
  let v = weekend
    ? 10 + bump(hour, 10.5, 2, 60) + bump(hour, 17, 2, 25)
    : 12 + bump(hour, 7, 1.2, 50) + bump(hour, 18, 1.6, 78) + bump(hour, 12.5, 1, 12)
  if (day === 1) v *= 1.1
  if (day === 5 && hour >= 17) v *= 0.72
  v += ((day * 7 + hour * 13) % 9) - 4
  return Math.max(3, Math.min(98, Math.round(v)))
}

/** A word for a crowd value. */
export function level(pct) {
  if (pct == null) return 'Zárva'
  if (pct < 35) return 'Szinte üres'
  if (pct < 65) return 'Közepes'
  return 'Tele'
}

export const ZONES = [
  { id: 'szabad', name: 'Szabad súlyok', detail: '4 pad, 2 guggolóállvány', cap: 12 },
  { id: 'gep', name: 'Gépek', detail: '18 erősítőgép', cap: 18 },
  { id: 'kardio', name: 'Kardió', detail: '6 futópad, 4 evezőgép', cap: 10 },
  { id: 'funk', name: 'Funkcionális rész', detail: 'kettlebell, labdák, kötél', cap: 8 },
]

/** How many places are free in each zone. Free weights fill up after work, cardio before it. */
export function freeByZone(day, hour) {
  const pct = crowd(day, hour)
  if (pct == null) return []
  const lean = { szabad: hour >= 16 ? 1.15 : 0.8, kardio: hour < 10 ? 1.15 : 0.9, gep: 1, funk: hour >= 17 ? 1.05 : 0.85 }
  return ZONES.map((z) => {
    const used = Math.round((z.cap * pct * lean[z.id]) / 100)
    return { ...z, free: Math.max(0, Math.min(z.cap, z.cap - used)) }
  })
}

/** The start of the quietest two-hour window of a day. */
export function quietest(day) {
  const [open, close] = openHours(day)
  let best = open
  for (let h = open; h < close - 1; h++) {
    if (crowd(day, h) + crowd(day, h + 1) < crowd(day, best) + crowd(day, best + 1)) best = h
  }
  return best
}

export const PASSES = [
  { id: 'napi', name: 'Napijegy', price: 2200, note: 'alkalmanként' },
  { id: 'tiz', name: '10 alkalmas', price: 18000, note: '2 hónapig érvényes' },
  { id: 'havi', name: 'Havi bérlet', price: 12900, note: 'korlátlan' },
]

/** Monthly cost of each pass for `perWeek` visits, and which is cheapest. */
export function compare(perWeek) {
  const visits = Math.max(1, Math.round(perWeek * 4.3))
  const rows = PASSES.map((p) => {
    const monthly = p.id === 'napi' ? visits * p.price : p.id === 'tiz' ? visits * (p.price / 10) : p.price
    return { ...p, monthly, perVisit: Math.round(monthly / visits) }
  })
  const min = Math.min(...rows.map((r) => r.monthly))
  return { visits, rows: rows.map((r) => ({ ...r, best: r.monthly === min })) }
}

export function trialProblems(data) {
  const next = {}
  if (String(data.name ?? '').trim().length < 2) next.name = 'Írd be a neved.'
  if (String(data.phone ?? '').replace(/\D/g, '').length < 8) next.phone = 'Egy hívható szám kell.'
  return next
}
