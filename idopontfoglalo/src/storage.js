import { slotsForDate } from './slots.js'
import { ANY, availability, staffFor } from './staff.js'

const KEY = 'szalka-bookings-v2'

function isBooking(entry) {
  return Boolean(
    entry &&
      typeof entry.id === 'string' &&
      typeof entry.date === 'string' &&
      Number.isFinite(entry.startMin) &&
      Number.isFinite(entry.durationMin),
  )
}

export function loadBookings() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    return Array.isArray(raw) ? raw.filter(isBooking) : []
  } catch {
    return []
  }
}

function save(bookings) {
  localStorage.setItem(KEY, JSON.stringify(bookings))
}

/** A draft with a staffId is checked against that stylist's calendar; "anyone"
    goes to the first eligible stylist free at that start. A draft without
    one is checked against every booking, as before stylists existed. */
export function createBooking(draft, now = new Date()) {
  const bookings = loadBookings()
  let staffId = draft.staffId
  if (staffId) {
    const ids = staffId === ANY ? staffFor(draft.serviceId).map((s) => s.id) : [staffId]
    const free = availability(draft.date, draft.durationMin, bookings, ids, now).who.get(draft.startMin) ?? []
    if (!free.length) return { ok: false, bookings }
    staffId = free[0]
  } else if (!slotsForDate(draft.date, draft.durationMin, bookings, now).includes(draft.startMin)) {
    return { ok: false, bookings }
  }
  const booking = {
    id: crypto.randomUUID(),
    ...draft,
    ...(staffId ? { staffId } : {}),
    createdAt: now.toISOString(),
  }
  const next = [...bookings, booking]
  save(next)
  return { ok: true, booking, bookings: next }
}

export function deleteBooking(id) {
  const next = loadBookings().filter((b) => b.id !== id)
  save(next)
  return next
}
