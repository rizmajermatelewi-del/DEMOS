// Csavar Szerviz: árbecslés hiba szerint, munkalap-követés, nyomtatás. Minden adat kitalált.

export const DEVICES = {
  telefon: { name: 'Telefon', icon: 'device-mobile', brands: ['iPhone', 'Samsung', 'Xiaomi', 'Egyéb'] },
  laptop: { name: 'Laptop', icon: 'laptop', brands: ['Lenovo', 'HP', 'MacBook', 'Egyéb'] },
  tablet: { name: 'Tablet', icon: 'device-tablet', brands: ['iPad', 'Samsung', 'Egyéb'] },
}

// Alapár forintban (alsó, felső), és hogy gyors-e (aznap kész, ha van alkatrész).
export const FAULTS = {
  kijelzo: { name: 'Törött kijelző', icon: 'device-mobile', telefon: [18000, 32000], laptop: [34000, 58000], tablet: [26000, 44000], quick: true },
  akku: { name: 'Gyorsan merül', icon: 'battery-charging', telefon: [11000, 17000], laptop: [19000, 29000], tablet: [15000, 22000], quick: true },
  toltes: { name: 'Nem tölt', icon: 'plug', telefon: [8000, 14000], laptop: [12000, 22000], tablet: [9000, 16000], quick: true },
  viz: { name: 'Vizes lett', icon: 'drop', telefon: [12000, 38000], laptop: [18000, 64000], tablet: [14000, 42000], quick: false },
  nemindul: { name: 'Be se kapcsol', icon: 'power', telefon: [9000, 30000], laptop: [12000, 48000], tablet: [10000, 34000], quick: false },
  lassu: { name: 'Lassú, akad', icon: 'monitor-play', telefon: [6000, 9000], laptop: [9000, 16000], tablet: [6000, 9000], quick: true },
}

const PREMIUM = { iPhone: 1.4, MacBook: 1.5, iPad: 1.35 }
const round500 = (n) => Math.round(n / 500) * 500

function hash(s) {
  let h = 2166136261
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  return h >>> 0
}

/** Van-e raktáron az alkatrész (kitalált, de stabil). A szoftveres hibához nem kell alkatrész. */
export const inStock = (device, brand, fault) => fault === 'lassu' || hash(`${device}|${brand}|${fault}`) % 3 !== 0

export const WORK_DAYS = [1, 2, 3, 4, 5]
const OPEN = 9 * 60, CUTOFF = 14 * 60

/** A `plus`-adik munkanap a `date` napja után. */
export function nextWorkday(date, plus = 1) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  let n = 0
  while (n < plus) { d.setDate(d.getDate() + 1); if (WORK_DAYS.includes(d.getDay())) n++ }
  return d
}

/** Árbecslés és várható elkészülés. */
export function estimate(device, brand, fault, now) {
  const f = FAULTS[fault]
  const [lo, hi] = f[device]
  const k = PREMIUM[brand] ?? 1
  const stock = inStock(device, brand, fault)
  const min = now.getHours() * 60 + now.getMinutes()
  const workday = WORK_DAYS.includes(now.getDay())
  let ready
  if (!stock) ready = { kind: 'alkatresz', date: nextWorkday(now, 3) }
  else if (f.quick && workday && min >= OPEN && min < CUTOFF) ready = { kind: 'ma', date: now }
  else ready = { kind: 'kovetkezo', date: nextWorkday(now, f.quick ? 1 : 2) }
  return { low: round500(lo * k), high: round500(hi * k), stock, ready }
}

// Munkalap-követés
export const STAGES = ['Átvéve', 'Bevizsgálva', 'Alkatrész úton', 'Javítás alatt', 'Kész, átvehető']
export const CODE = /^CS-\d{4}$/

/** A munkalap állása: kitalált, de ugyanarra a kódra mindig ugyanaz. Érvénytelen kód: null. */
export function track(code) {
  const c = String(code ?? '').trim().toUpperCase().replace(/\s+/g, '')
  if (!CODE.test(c)) return null
  const stage = hash(c) % STAGES.length
  return { code: c, stage, done: stage === STAGES.length - 1 }
}

// Nyomtatás, fénymásolás
export const PRINT = { ff: 30, szines: 120 }

/** Oldalankénti ár, 100 oldaltól 20% kedvezmény; kétoldalasnál a lapok száma feleződik. */
export function printPrice(pages, color, duplex) {
  const p = Math.max(0, Math.floor(pages) || 0)
  const base = p * (color ? PRINT.szines : PRINT.ff)
  const total = p >= 100 ? Math.round(base * 0.8) : base
  return { total, sheets: duplex ? Math.ceil(p / 2) : p, discount: p >= 100 }
}
