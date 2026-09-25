import { dayStatus } from './order.js'

const KEY = 'habcsok-orders-v1'

function isOrder(o) {
  return Boolean(o && typeof o.id === 'string' && typeof o.pickupDate === 'string' && Array.isArray(o.lines))
}

export function loadOrders() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    return Array.isArray(raw) ? raw.filter(isOrder) : []
  } catch {
    return []
  }
}

/** Re-checks the day at save time: the screen may be showing an old capacity. */
export function createOrder(draft, now = new Date()) {
  const orders = loadOrders()
  const day = dayStatus(draft.pickupDate, draft.lines, orders, now)
  if (day.status !== 'open') return { ok: false, reason: day.status, orders }
  const order = { id: crypto.randomUUID(), ...draft, createdAt: now.toISOString() }
  const next = [...orders, order]
  localStorage.setItem(KEY, JSON.stringify(next))
  return { ok: true, order, orders: next }
}

export function deleteOrder(id) {
  const next = loadOrders().filter((o) => o.id !== id)
  localStorage.setItem(KEY, JSON.stringify(next))
  return next
}
