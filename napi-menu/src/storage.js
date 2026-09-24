import { SEED } from './data.js'

const KEY = 'kispipa-week-v2'
const AUTH = 'kispipa-auth'
const DAYS = [1, 2, 3, 4, 5]

function priceOk(value) {
  const n = Number(value)
  return Number.isFinite(n) && n >= 0 && n <= 100_000
}

/** A day the board can render. Anything else falls back to the seed. */
export function normalizeMenu(menu) {
  if (!menu || typeof menu !== 'object' || !Array.isArray(menu.mains) || menu.mains.length === 0) return null
  if (!priceOk(menu.soupPrice) || !priceOk(menu.dessertPrice)) return null
  const mains = menu.mains.map((item) => ({
    name: String(item?.name ?? '').trim(),
    price: Number(item?.price),
  }))
  if (mains.some((item) => !item.name || !priceOk(item.price))) return null
  const soup = String(menu.soup ?? '').trim()
  const dessert = String(menu.dessert ?? '').trim()
  if (!soup || !dessert) return null
  return {
    soup,
    soupPrice: Number(menu.soupPrice),
    mains,
    dessert,
    dessertPrice: Number(menu.dessertPrice),
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
