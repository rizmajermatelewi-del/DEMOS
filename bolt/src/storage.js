import { holdUntil, productById } from './shop.js'

const STOCK_KEY = 'barany-stock-v1'
const HOLD_KEY = 'barany-holds-v1'

function read(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) ?? 'null') ?? fallback
  } catch {
    return fallback
  }
}

/** The shop's own count wins over the built-in sample stock. */
export function loadStock() {
  const raw = read(STOCK_KEY, {})
  return raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}
}

export function setStock(id, qty) {
  const next = { ...loadStock(), [id]: Math.max(0, Math.floor(qty)) }
  localStorage.setItem(STOCK_KEY, JSON.stringify(next))
  return next
}

export function loadHolds() {
  const raw = read(HOLD_KEY, [])
  return Array.isArray(raw)
    ? raw.filter((h) => h && typeof h.id === 'string' && typeof h.productId === 'string' && Number.isInteger(h.qty) && h.qty > 0)
    : []
}

export function stockOf(product, stock) {
  return Number.isInteger(stock[product.id]) ? stock[product.id] : product.stock
}

/** What a customer can still reserve: shelf count minus what is already put aside. */
export function freeOf(product, stock, holds) {
  const held = holds.filter((h) => h.productId === product.id).reduce((n, h) => n + h.qty, 0)
  return Math.max(0, stockOf(product, stock) - held)
}

/** Re-reads storage so a stale screen cannot put aside more than is left. */
export function createHold(draft, now = new Date()) {
  const product = productById(draft.productId)
  const holds = loadHolds()
  const free = product ? freeOf(product, loadStock(), holds) : 0
  if (!Number.isInteger(draft.qty) || draft.qty < 1 || draft.qty > free) return { ok: false, free, holds }
  const hold = { id: crypto.randomUUID(), ...draft, holdUntil: holdUntil(now).iso, createdAt: now.toISOString() }
  const next = [hold, ...holds]
  localStorage.setItem(HOLD_KEY, JSON.stringify(next))
  return { ok: true, hold, holds: next }
}

/** picked: the customer took it, so it also leaves the shelf. */
export function closeHold(id, picked) {
  const holds = loadHolds()
  const hold = holds.find((h) => h.id === id)
  const next = holds.filter((h) => h.id !== id)
  localStorage.setItem(HOLD_KEY, JSON.stringify(next))
  let stock = loadStock()
  if (hold && picked) {
    const product = productById(hold.productId)
    if (product) stock = setStock(product.id, stockOf(product, stock) - hold.qty)
  }
  return { holds: next, stock }
}
