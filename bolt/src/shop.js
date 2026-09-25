/** Sample hardware shop. Every figure is invented and labelled as a demo on the page. */
export const BUSINESS = {
  name: 'Bárány Vas-Műszaki',
  city: 'Ócsa',
  address: 'Bajcsy-Zsilinszky utca 40.',
  phone: '+36 29 378 1145',
  adminPin: '2468',
}

/** Minutes from local midnight, per weekday (0 = Sunday). */
export const HOURS = {
  0: null,
  1: [7 * 60, 18 * 60],
  2: [7 * 60, 18 * 60],
  3: [7 * 60, 18 * 60],
  4: [7 * 60, 18 * 60],
  5: [7 * 60, 18 * 60],
  6: [7 * 60, 13 * 60],
}

export const WEEKDAYS = ['vasárnap', 'hétfő', 'kedd', 'szerda', 'csütörtök', 'péntek', 'szombat']

export const CATEGORIES = [
  { id: 'rogzites', name: 'Csavar, rögzítés' },
  { id: 'szerszam', name: 'Szerszám' },
  { id: 'festek', name: 'Festék' },
  { id: 'villany', name: 'Villany' },
  { id: 'kert', name: 'Kert' },
]

/** stock: pieces on the shelf. arrives: when an out-of-stock item is expected. */
export const PRODUCTS = [
  { id: 'facsavar', cat: 'rogzites', name: 'Facsavar 4×40, horganyzott', spec: '200 db/doboz', priceHuf: 1890, unit: 'doboz', stock: 34 },
  { id: 'tipli', cat: 'rogzites', name: 'Műanyag tipli 8 mm', spec: '100 db/doboz', priceHuf: 990, unit: 'doboz', stock: 52 },
  { id: 'dubel', cat: 'rogzites', name: 'Beütő dübel 6×40', spec: '50 db/doboz', priceHuf: 2490, unit: 'doboz', stock: 3 },
  { id: 'szilikon', cat: 'rogzites', name: 'Szaniter szilikon, fehér', spec: '280 ml, penészgátló', priceHuf: 2290, unit: 'db', stock: 0, arrives: 'next' },
  { id: 'csavarhuzo', cat: 'szerszam', name: 'Csavarhúzó készlet', spec: '6 részes, lapos + PH', priceHuf: 4990, unit: 'szett', stock: 8 },
  { id: 'vizmertek', cat: 'szerszam', name: 'Vízmérték 60 cm', spec: 'alumínium, 3 libella', priceHuf: 3990, unit: 'db', stock: 5 },
  { id: 'fureszlap', cat: 'szerszam', name: 'Szúrófűrészlap fához', spec: '5 db, T-befogás', priceHuf: 2690, unit: 'csomag', stock: 12 },
  { id: 'ecset', cat: 'festek', name: 'Laposecset 50 mm', spec: 'vegyes szőr', priceHuf: 890, unit: 'db', stock: 40 },
  { id: 'diszperzit', cat: 'festek', name: 'Beltéri falfesték, fehér', spec: '15 l, 2 rétegre ~90 m²', priceHuf: 14990, unit: 'vödör', stock: 2 },
  { id: 'lazur', cat: 'festek', name: 'Vékonylazúr, dió', spec: '2,5 l, kültéri', priceHuf: 9490, unit: 'db', stock: 0, arrives: 'week' },
  { id: 'izzo', cat: 'villany', name: 'LED izzó E27, 9 W', spec: 'meleg fehér, 806 lm', priceHuf: 1290, unit: 'db', stock: 60 },
  { id: 'hosszabbito', cat: 'villany', name: 'Elosztó 5 aljzat, kapcsolós', spec: '3 m kábel', priceHuf: 4490, unit: 'db', stock: 7 },
  { id: 'kabelkoto', cat: 'villany', name: 'Gyors vezetékösszekötő', spec: '3 pólusú, 10 db', priceHuf: 1590, unit: 'csomag', stock: 4 },
  { id: 'locsolotomlo', cat: 'kert', name: 'Locsolótömlő 1/2", 25 m', spec: 'UV-álló, 4 rétegű', priceHuf: 8990, unit: 'tekercs', stock: 6 },
  { id: 'lombsepru', cat: 'kert', name: 'Lombseprű, fém', spec: 'fanyéllel', priceHuf: 3490, unit: 'db', stock: 11 },
  { id: 'zsak', cat: 'kert', name: 'Kerti zsák 120 l', spec: '10 db, erős', priceHuf: 1990, unit: 'csomag', stock: 25 },
]

/** At or below this many free pieces the shelf counts as "running low". */
export const LOW_STOCK = 5

export function productById(id) {
  return PRODUCTS.find((p) => p.id === id)
}

export function minutesToLabel(min) {
  return `${Math.floor(min / 60)}:${String(min % 60).padStart(2, '0')}`
}

export function formatHuf(n) {
  return new Intl.NumberFormat('hu-HU', { style: 'currency', currency: 'HUF', maximumFractionDigits: 0 }).format(n)
}

export function isoLocal(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Noon on the day `n` days after `date`, so DST never shifts the date. */
function dayAfter(date, n) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + n, 12)
}

/** The first day with opening hours, at least `from` days after `now`. */
export function nextOpenDay(now, from = 1) {
  for (let i = from; i < from + 8; i += 1) {
    const d = dayAfter(now, i)
    if (HOURS[d.getDay()]) return { offset: i, date: d, hours: HOURS[d.getDay()] }
  }
  return null
}

/**
 * { open: true, closesAt } while the door is open,
 * otherwise { open: false, opensAt, offset, weekday }; offset 0 means later today.
 */
export function openState(now = new Date()) {
  const min = now.getHours() * 60 + now.getMinutes()
  const today = HOURS[now.getDay()]
  if (today && min >= today[0] && min < today[1]) return { open: true, closesAt: today[1] }
  if (today && min < today[0]) return { open: false, opensAt: today[0], offset: 0, weekday: now.getDay() }
  const next = nextOpenDay(now)
  return { open: false, opensAt: next.hours[0], offset: next.offset, weekday: next.date.getDay() }
}

export function openLabel(state) {
  if (state.open) return `Nyitva · ${minutesToLabel(state.closesAt)}-ig`
  const when = state.offset === 0 ? 'ma' : state.offset === 1 ? 'holnap' : WEEKDAYS[state.weekday]
  return `Zárva · ${when} ${minutesToLabel(state.opensAt)}-kor nyit`
}

/** A reservation is held until closing on the next open day after today. */
export function holdUntil(now = new Date()) {
  const next = nextOpenDay(now)
  return { iso: isoLocal(next.date), closesAt: next.hours[1], weekday: next.date.getDay() }
}

/** For the "back in stock" note: 'next' = next open day, 'week' = a week from now. */
export function arrivalIso(product, now = new Date()) {
  if (!product.arrives) return null
  return product.arrives === 'week' ? isoLocal(dayAfter(now, 7)) : isoLocal(nextOpenDay(now).date)
}

/** Lower-case and strip accents, so "csavarhuzo" finds "Csavarhúzó". */
export function fold(text) {
  return String(text ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
}

/** Every search word must appear in the name or spec; order does not matter. */
export function filterProducts(products, { query = '', cat = null, inStockOnly = false, available }) {
  const words = fold(query).split(/\s+/).filter(Boolean)
  return products.filter((p) => {
    if (cat && p.cat !== cat) return false
    if (inStockOnly && available(p) <= 0) return false
    const hay = fold(`${p.name} ${p.spec}`)
    return words.every((w) => hay.includes(w))
  })
}

export function stockLevel(free) {
  if (free <= 0) return 'none'
  return free <= LOW_STOCK ? 'low' : 'ok'
}
