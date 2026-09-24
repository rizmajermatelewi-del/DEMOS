import { slotsForDate } from './slots.js'

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

export function createBooking(draft, now = new Date()) {
  const bookings = loadBookings()
  const free = slotsForDate(draft.date, draft.durationMin, bookings, now)
  if (!free.includes(draft.startMin)) {
    return { ok: false, bookings }
  }
  const booking = {
    id: crypto.randomUUID(),
    ...draft,
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
