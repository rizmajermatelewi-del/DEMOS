/* Takeaway pre-orders: which pickup times are still offered, what the
   order costs, and whether the form is complete. Pure functions, so the
   rules are tested without a browser. */

export const OPEN_MIN = 11 * 60
export const CLOSE_MIN = 15 * 60
/** Minutes the kitchen needs before an order can be picked up. */
export const LEAD_MIN = 20
export const STEP_MIN = 15
export const MAX_QTY = 9

function hhmm(minutes) {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
}

/** Pickup times left today: every 15 minutes from opening to the last
    quarter before closing, never sooner than the kitchen can cook. Before
    opening the whole day is offered; at the weekend nothing is. */
export function pickupSlots(now) {
  const day = now.getDay()
  if (day === 0 || day === 6) return []
  const earliest = now.getHours() * 60 + now.getMinutes() + LEAD_MIN
  const first = Math.max(OPEN_MIN, Math.ceil(earliest / STEP_MIN) * STEP_MIN)
  const slots = []
  for (let m = first; m <= CLOSE_MIN - STEP_MIN; m += STEP_MIN) slots.push(hhmm(m))
  return slots
}

/** The board's dishes as order lines, with stable ids. */
export function menuItems(menu) {
  if (!menu || menu.closed) return []
  return [
    { id: 'soup', name: menu.soup, price: Number(menu.soupPrice), allergens: menu.soupAllergens ?? [] },
    ...menu.mains.map((item, i) => ({ id: `main-${i}`, name: item.name, price: Number(item.price), allergens: item.allergens ?? [] })),
    { id: 'dessert', name: menu.dessert, price: Number(menu.dessertPrice), allergens: menu.dessertAllergens ?? [] },
  ]
}

export function orderLines(items, qty) {
  return items.filter((item) => (qty[item.id] ?? 0) > 0).map((item) => ({ ...item, qty: qty[item.id] }))
}

export function orderTotal(lines) {
  return lines.reduce((sum, line) => sum + line.qty * line.price, 0)
}

export function clampQty(n) {
  return Math.min(MAX_QTY, Math.max(0, Math.trunc(Number(n) || 0)))
}

/** Hungarian mobile or landline, with or without spaces: +36 30 123 4567, 06 62 555 0142. */
export function phoneOk(value) {
  const digits = String(value).replace(/[\s\-/()]/g, '')
  return /^(\+36|06)\d{8,9}$/.test(digits)
}

/** Field errors, keyed by field. An empty object means the order can go. */
export function validateOrder({ lines, slot, name, phone }, slots) {
  const errors = {}
  if (!lines.length) errors.items = 'Válassz legalább egy ételt.'
  if (!slots.includes(slot)) errors.slot = 'Válassz átvételi időt.'
  if (String(name ?? '').trim().length < 2) errors.name = 'Írd be a neved.'
  if (!phoneOk(phone)) errors.phone = 'Telefonszám, például 06 30 123 4567.'
  return errors
}
