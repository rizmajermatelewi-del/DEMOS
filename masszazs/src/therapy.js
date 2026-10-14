/**
 * The areas a session can cover. `weight` is how much of the time an area takes
 * when there is room, `min` is the least that is worth doing on it.
 */
export const AREAS = [
  { id: 'nyak', name: 'Nyak és váll', weight: 3, min: 10, color: '#c86a4a' },
  { id: 'hat', name: 'Hát', weight: 4, min: 15, color: '#d99a5b' },
  { id: 'derek', name: 'Derék', weight: 3, min: 10, color: '#a8794f' },
  { id: 'fej', name: 'Fej és arc', weight: 1, min: 5, color: '#8f9e86' },
  { id: 'kar', name: 'Kar és kéz', weight: 1, min: 5, color: '#b7a58c' },
  { id: 'lab', name: 'Láb', weight: 2, min: 10, color: '#6f8a7e' },
  { id: 'talp', name: 'Talp', weight: 2, min: 10, color: '#56707a' },
]

export const MINUTES = [30, 45, 60, 75, 90, 105, 120]
const PRICES = { 30: 7400, 45: 9900, 60: 12900, 75: 14900, 90: 16900, 105: 18900, 120: 20900 }

/** Price for a session length; unknown lengths are rounded up to the next one on the list. */
export function priceFor(minutes) {
  const m = MINUTES.find((x) => x >= minutes) ?? MINUTES.at(-1)
  return PRICES[m]
}

/**
 * Split `minutes` between the chosen areas in 5-minute steps: every area gets at least
 * its minimum, the rest is shared by weight. Nothing chosen means a whole-body relax session.
 * Returns { parts: [{ id, name, minutes, color }], fits, need } where `need` is the shortest
 * length the chosen areas fit into.
 */
export function composeSession(minutes, ids = []) {
  const chosen = AREAS.filter((a) => ids.includes(a.id))
  const areas = chosen.length ? chosen : AREAS
  const need = areas.reduce((s, a) => s + a.min, 0)
  const shortest = MINUTES.find((m) => m >= need) ?? MINUTES.at(-1)
  if (need > minutes) return { parts: [], fits: false, need: shortest }
  const spare = minutes - need
  const totalWeight = areas.reduce((s, a) => s + a.weight, 0)
  const parts = areas.map((a) => ({ ...a, minutes: a.min + Math.floor((spare * a.weight) / totalWeight / 5) * 5 }))
  // Hand out what rounding left over, heaviest areas first.
  let left = minutes - parts.reduce((s, p) => s + p.minutes, 0)
  const order = [...parts].sort((x, y) => y.weight - x.weight)
  for (let i = 0; left > 0; i = (i + 1) % order.length, left -= 5) order[i].minutes += 5
  return { parts: parts.map(({ id, name, minutes: m, color }) => ({ id, name, minutes: m, color })), fits: true, need: shortest }
}

// Opening: Tuesday to Saturday, 10:00-19:00 (Sat 10:00-15:00), on a 30-minute grid.
const HOURS = { 2: [10, 19], 3: [10, 19], 4: [10, 19], 5: [10, 19], 6: [10, 15] }

// ponytail: fake bookings from a date hash, so the demo looks lived-in and stays stable.
function booked(date, minutes) {
  const n = date.getDate() * 31 + date.getMonth() * 7 + minutes / 30
  return n % 5 === 0 || n % 7 === 0
}

/** The next `count` start times where a `minutes`-long treatment fits, at least 2 hours from now. */
export function freeSlots(now = new Date(), minutes = 60, count = 6) {
  const earliest = new Date(now.getTime() + 2 * 3600e3)
  const out = []
  const day = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  for (let d = 0; d < 21 && out.length < count; d++, day.setDate(day.getDate() + 1)) {
    const hours = HOURS[day.getDay()]
    if (!hours) continue
    for (let m = hours[0] * 60; m + minutes <= hours[1] * 60 && out.length < count; m += 30) {
      const start = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, m)
      if (start < earliest) continue
      let free = true
      for (let k = 0; k < minutes; k += 30) if (booked(start, m + k)) free = false
      if (free) out.push(start)
    }
  }
  return out
}

/** Booking form errors. */
export function bookingProblems(data) {
  const next = {}
  if (!data.slot) next.slot = 'Válasszon egy időpontot.'
  if (String(data.name ?? '').trim().length < 2) next.name = 'Kérjük, írja be a nevét.'
  if (String(data.phone ?? '').replace(/\D/g, '').length < 8) next.phone = 'Egy hívható szám kell.'
  return next
}

/** A gift voucher is valid for a year; a 29 February voucher runs to 28 February. */
export function voucherExpiry(from = new Date()) {
  const y = from.getFullYear() + 1
  const m = from.getMonth()
  const last = new Date(y, m + 1, 0).getDate()
  return new Date(y, m, Math.min(from.getDate(), last))
}

/** "2027. október 14." */
export function huDate(d) {
  const MONTHS = ['január', 'február', 'március', 'április', 'május', 'június', 'július', 'augusztus', 'szeptember', 'október', 'november', 'december']
  return `${d.getFullYear()}. ${MONTHS[d.getMonth()]} ${d.getDate()}.`
}
