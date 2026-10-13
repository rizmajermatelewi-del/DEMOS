import { ALLERGENS, SEED } from './data.js'

const KEY = 'kispipa-week-v2'
const AUTH = 'kispipa-auth'
const ORDERS = 'kispipa-orders-v1'
const DAYS = [1, 2, 3, 4, 5]
const STATUSES = ['uj', 'kesz', 'atadva']

function priceOk(value) {
  const n = Number(value)
  return Number.isFinite(n) && n >= 0 && n <= 100_000
}

/** Known allergen codes only, each once, in the legend's order. */
export function normalizeAllergens(list) {
  const wanted = new Set(Array.isArray(list) ? list.map((c) => String(c).trim().toUpperCase()) : [])
  return Object.keys(ALLERGENS).filter((code) => wanted.has(code.toUpperCase()))
}

/** A day the board can render. Anything else falls back to the seed. */
export function normalizeMenu(menu) {
  if (!menu || typeof menu !== 'object' || !Array.isArray(menu.mains) || menu.mains.length === 0) return null
  if (!priceOk(menu.soupPrice) || !priceOk(menu.dessertPrice)) return null
  const mains = menu.mains.map((item) => ({
    name: String(item?.name ?? '').trim(),
    price: Number(item?.price),
    allergens: normalizeAllergens(item?.allergens),
  }))
  if (mains.some((item) => !item.name || !priceOk(item.price))) return null
  const soup = String(menu.soup ?? '').trim()
  const dessert = String(menu.dessert ?? '').trim()
  if (!soup || !dessert) return null
  return {
    soup,
    soupPrice: Number(menu.soupPrice),
    soupAllergens: normalizeAllergens(menu.soupAllergens),
    mains,
    dessert,
    dessertPrice: Number(menu.dessertPrice),
    dessertAllergens: normalizeAllergens(menu.dessertAllergens),
    note: String(menu.note ?? ''),
    closed: Boolean(menu.closed),
  }
}

export function loadWeek() {
  const base = structuredClone(SEED)
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? 'null')
    if (!saved || typeof saved !== 'object') return base
    for (const key of DAYS) {
      const clean = normalizeMenu(saved[key])
      if (clean) base[key] = clean
    }
    return base
  } catch {
    return base
  }
}

export function saveDay(day, menu) {
  const week = loadWeek()
  const clean = normalizeMenu(menu)
  if (!DAYS.includes(day) || !clean) return { ok: false, week }
  week[day] = clean
  const stored = {}
  for (const key of DAYS) stored[key] = week[key]
  localStorage.setItem(KEY, JSON.stringify(stored))
  return { ok: true, week }
}

/* Orders are kept per day, so yesterday's tickets never reach today's
   counter. Only the current day is stored; an older key is dropped. */
function readOrders(dateIso) {
  try {
    const saved = JSON.parse(localStorage.getItem(ORDERS) ?? 'null')
    if (!saved || saved.date !== dateIso || !Array.isArray(saved.orders)) return []
    return saved.orders.filter((o) => o && Number.isInteger(o.no) && Array.isArray(o.lines) && STATUSES.includes(o.status))
  } catch {
    return []
  }
}

function writeOrders(dateIso, orders) {
  localStorage.setItem(ORDERS, JSON.stringify({ date: dateIso, orders }))
}

export function loadOrders(dateIso) {
  return readOrders(dateIso)
}

/** Numbers run from 1 each day, like the tickets on a real counter. */
export function addOrder(dateIso, order) {
  const orders = readOrders(dateIso)
  const no = orders.reduce((max, o) => Math.max(max, o.no), 0) + 1
  const saved = { ...order, no, status: 'uj' }
  writeOrders(dateIso, [...orders, saved])
  return saved
}

export function setOrderStatus(dateIso, no, status) {
  if (!STATUSES.includes(status)) return readOrders(dateIso)
  const orders = readOrders(dateIso).map((o) => (o.no === no ? { ...o, status } : o))
  writeOrders(dateIso, orders)
  return orders
}

export function isLoggedIn() {
  return sessionStorage.getItem(AUTH) === '1'
}

export function login(password, expected) {
  if (password !== expected) return false
  sessionStorage.setItem(AUTH, '1')
  return true
}

export function logout() {
  sessionStorage.removeItem(AUTH)
}

/* Loyalty card: one stamp per takeaway order, the tenth meal is free. */
const STAMPS = 'kispipa-stamps-v1'
export const CARD_SIZE = 10

export function loadStamps() {
  const n = Number(localStorage.getItem(STAMPS))
  return Number.isInteger(n) && n >= 0 && n <= CARD_SIZE ? n : 0
}

/** Adds a stamp. A full card starts over, and `free` says this order filled it. */
export function addStamp() {
  const next = loadStamps() + 1
  const free = next >= CARD_SIZE
  localStorage.setItem(STAMPS, String(free ? 0 : next))
  return { count: free ? CARD_SIZE : next, free }
}
