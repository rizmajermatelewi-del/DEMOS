/** The bar is the base membership; every add-on is a bumper plate in its IWF colour. */
export const BAR = { name: 'Alapbérlet', price: 12900, kg: 20 }
export const ADDONS = [
  { id: 'szemelyi', name: 'Személyi edzés, havi 4 alkalom', price: 26000, kg: 25, color: '#d62d20' },
  { id: 'csoport', name: 'Csoportos órák korlátlanul', price: 4900, kg: 20, color: '#1d4fd8' },
  { id: 'szauna', name: 'Szauna és gőzkabin', price: 3500, kg: 15, color: '#f2c230' },
  { id: 'etrend', name: 'Havi étrendterv', price: 6500, kg: 10, color: '#1f9d55' },
  { id: 'torolkozo', name: 'Törölköző minden edzésre', price: 1900, kg: 5, color: '#f1f1ee' },
]
export const TERMS = {
  havi: { name: 'Havonta mondható fel', factor: 1 },
  felev: { name: '6 hónap', factor: 0.9 },
  ev: { name: '12 hónap', factor: 0.8 },
}

const byId = Object.fromEntries(ADDONS.map((a) => [a.id, a]))

/** Monthly price, rounded to 100 Ft, after the commitment discount. */
export function monthly(ids = [], term = 'havi') {
  const sum = ids.reduce((s, id) => s + (byId[id]?.price ?? 0), BAR.price)
  return Math.round((sum * (TERMS[term] ?? TERMS.havi).factor) / 100) * 100
}

/** What the loaded bar would weigh: plates go on both sides. */
export function barWeight(ids = []) {
  return ids.reduce((s, id) => s + 2 * (byId[id]?.kg ?? 0), BAR.kg)
}

/** Heaviest plates go on first, next to the collar, like on a real bar. */
export function loadOrder(ids = []) {
  return ADDONS.filter((a) => ids.includes(a.id)).sort((a, b) => b.kg - a.kg)
}

const WEEK = [
  // 0 = Sunday ... 6 = Saturday
  [['09:00', 'Mobilitás', 14]],
  [['07:00', 'Reggeli köredzés', 12], ['17:30', 'Súlyemelés alapok', 8], ['19:00', 'Spinning', 16]],
  [['07:00', 'Reggeli köredzés', 12], ['18:00', 'Kettlebell', 10], ['19:15', 'Jóga', 14]],
  [['07:00', 'Reggeli köredzés', 12], ['17:30', 'Súlyemelés alapok', 8], ['19:00', 'Spinning', 16]],
  [['07:00', 'Reggeli köredzés', 12], ['18:00', 'Kettlebell', 10], ['19:15', 'Jóga', 14]],
  [['07:00', 'Reggeli köredzés', 12], ['17:00', 'Funkcionális', 12]],
  [['09:00', 'Szombati WOD', 14], ['10:30', 'Mobilitás', 14]],
]

// ponytail: bookings come from a date hash so the demo looks used and stays stable.
function taken(date, i, cap) {
  return (date.getDate() * 7 + i * 5 + date.getMonth()) % (cap + 1)
}

/** Classes on a given day with the spots still free. */
export function classesFor(date = new Date()) {
  return WEEK[date.getDay()].map(([time, name, cap], i) => ({
    id: `${date.getMonth() + 1}-${date.getDate()}-${i}`,
    time,
    name,
    cap,
    free: cap - taken(date, i, cap),
  }))
}

/** Free trial form errors. */
export function trialProblems(data) {
  const next = {}
  if (String(data.name ?? '').trim().length < 2) next.name = 'Írd be a neved.'
  if (String(data.phone ?? '').replace(/\D/g, '').length < 8) next.phone = 'Egy hívható szám kell.'
  return next
}
