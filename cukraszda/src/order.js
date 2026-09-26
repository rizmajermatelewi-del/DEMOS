/** Sample pastry shop. Every figure is invented and labelled as a demo on the page. */
export const BUSINESS = {
  name: 'Habcsók Cukrászda',
  city: 'Szigetszentmiklós',
  address: 'Gyári út 21.',
  phone: '+36 20 544 9160',
  hours: 'Kedd-vasárnap 9:00-18:00, hétfő zárva',
  adminPin: '2468',
}

/** leadDays: how many days ahead the kitchen needs. */
export const PRODUCTS = [
  {
    id: 'eszterhazy',
    kind: 'torta',
    name: 'Eszterházy torta',
    blurb: 'Diós piskóta, vaníliás krém, fondant a tetején. Tojást, diót, glutént tartalmaz.',
    leadDays: 2,
    sizes: [
      { id: '12', label: '12 szelet', priceHuf: 16900 },
      { id: '16', label: '16 szelet', priceHuf: 21900 },
    ],
  },
  {
    id: 'csoki',
    kind: 'torta',
    name: 'Csokoládé mousse torta',
    blurb: 'Étcsokoládés mousse, kakaós piskóta, ganache. Tojást, tejet, glutént tartalmaz.',
    leadDays: 2,
    sizes: [
      { id: '12', label: '12 szelet', priceHuf: 15900 },
      { id: '16', label: '16 szelet', priceHuf: 20900 },
    ],
  },
  {
    id: 'malna',
    kind: 'torta',
    name: 'Málnás-mascarpone torta',
    blurb: 'Vaníliás piskóta, mascarpone krém, friss málna. Tojást, tejet, glutént tartalmaz.',
    leadDays: 2,
    sizes: [
      { id: '12', label: '12 szelet', priceHuf: 17900 },
      { id: '16', label: '16 szelet', priceHuf: 22900 },
    ],
  },
  {
    id: 'somloi',
    kind: 'talca',
    name: 'Somlói galuska tál',
    blurb: '8 adag, csokoládéöntettel és tejszínhabbal külön dobozban.',
    leadDays: 1,
    sizes: [{ id: '8', label: '8 adag', priceHuf: 8900 }],
  },
  {
    id: 'pogacsa',
    kind: 'talca',
    name: 'Tepertős pogácsa tálca',
    blurb: '40 darab, reggel sütve. Rendezvényre, irodába.',
    leadDays: 1,
    sizes: [{ id: '40', label: '40 db', priceHuf: 7900 }],
  },
  {
    id: 'vegyes',
    kind: 'talca',
    name: 'Vegyes sütemény tál',
    blurb: '20 darab: krémes, zserbó, isler, mignon. A válogatás napi.',
    leadDays: 1,
    sizes: [{ id: '20', label: '20 db', priceHuf: 12900 }],
  },
]

export const CLOSED_WEEKDAYS = [1]
export const OPEN = { start: 9 * 60, end: 18 * 60 }
export const PICKUP_STEP_MIN = 30
/** Whole cakes the kitchen can finish in one day. */
export const DAILY_CAKE_LIMIT = 6
/** An order after this time counts as placed the next day. */
export const CUTOFF_MIN = 14 * 60
export const INSCRIPTION_MAX = 30
export const QTY_MAX = 3

export function productById(id) {
  return PRODUCTS.find((p) => p.id === id)
}

export function sizeOf(line) {
  return productById(line.productId)?.sizes.find((s) => s.id === line.sizeId)
}

export function isoLocal(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Noon keeps DST shifts from moving the date. */
export function noonOf(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d, 12)
}

export function addDays(iso, n) {
  const date = noonOf(iso)
  date.setDate(date.getDate() + n)
  return isoLocal(date)
}

export function cakeCount(lines) {
  return lines.reduce((sum, l) => sum + (productById(l.productId)?.kind === 'torta' ? l.qty : 0), 0)
}

export function lineTotal(line) {
  return (sizeOf(line)?.priceHuf ?? 0) * line.qty
}

export function cartTotal(lines) {
  return lines.reduce((sum, l) => sum + lineTotal(l), 0)
}

/** The first day the whole basket can be ready. An empty basket still needs a day. */
export function earliestPickup(lines, now = new Date()) {
  const lead = Math.max(1, ...lines.map((l) => productById(l.productId)?.leadDays ?? 1))
  const late = now.getHours() * 60 + now.getMinutes() >= CUTOFF_MIN
  return addDays(isoLocal(now), lead + (late ? 1 : 0))
}

export function cakesBookedOn(iso, orders) {
  return (Array.isArray(orders) ? orders : [])
    .filter((o) => o && o.pickupDate === iso && Array.isArray(o.lines))
    .reduce((sum, o) => sum + cakeCount(o.lines), 0)
}

/**
 * closed: the shop is shut. early: the kitchen cannot finish it by then.
 * full: this basket's cakes do not fit the day's capacity. open: pickable.
 */
export function dayStatus(iso, lines, orders, now = new Date()) {
  if (CLOSED_WEEKDAYS.includes(noonOf(iso).getDay())) return { status: 'closed' }
  if (iso < earliestPickup(lines, now)) return { status: 'early' }
  const left = DAILY_CAKE_LIMIT - cakesBookedOn(iso, orders)
  if (cakeCount(lines) > left) return { status: 'full', left }
  return { status: 'open', left }
}

export function pickupTimes() {
  const out = []
  for (let m = OPEN.start; m + PICKUP_STEP_MIN <= OPEN.end; m += PICKUP_STEP_MIN) out.push(m)
  return out
}

export function minutesToLabel(min) {
  return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`
}

export function formatHuf(n) {
  return new Intl.NumberFormat('hu-HU', { style: 'currency', currency: 'HUF', maximumFractionDigits: 0 }).format(n)
}
