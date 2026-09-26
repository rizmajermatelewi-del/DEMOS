import { OPEN_WINDOWS, SLOT_STEP_MIN } from './data.js'

export function isoLocal(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function nextDays(count, from = new Date()) {
  const start = new Date(from)
  start.setHours(12, 0, 0, 0)
  const out = []
  for (let i = 0; i < count; i += 1) {
    const copy = new Date(start)
    copy.setDate(start.getDate() + i)
    out.push(isoLocal(copy))
  }
  return out
}

export function atMinutes(iso, minutes) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d, Math.floor(minutes / 60), minutes % 60, 0, 0)
}

/**
 * Free start-times, in minutes from midnight.
 * A slot is offered only when the whole service fits the opening window,
 * it does not overlap a booking, and it has not already started.
 */
export function slotsForDate(iso, durationMin, bookings, now = new Date()) {
  const day = atMinutes(iso, 12 * 60).getDay()
  const window = OPEN_WINDOWS[day]
  if (!window) return []

  const taken = (Array.isArray(bookings) ? bookings : []).filter(
    (b) => b && b.date === iso && Number.isFinite(b.startMin) && Number.isFinite(b.durationMin),
  )
  const slots = []

  for (let start = window.start; start + durationMin <= window.end; start += SLOT_STEP_MIN) {
    const startAt = atMinutes(iso, start)
    if (startAt.getTime() <= now.getTime()) continue

    const endAt = startAt.getTime() + durationMin * 60_000
    const clash = taken.some((b) => {
      const bStart = atMinutes(b.date, b.startMin).getTime()
      const bEnd = bStart + b.durationMin * 60_000
      return startAt.getTime() < bEnd && endAt > bStart
    })
    if (!clash) slots.push(start)
  }

  return slots
}

/**
 * One comb tooth per half hour of the opening window. A tooth is 'past',
 * 'taken' (overlaps a booking), 'start' (the whole service fits from here)
 * or 'free' (open, but the service would run into a booking or closing).
 */
export function combTeeth(iso, slots, bookings, now = new Date()) {
  const window = OPEN_WINDOWS[atMinutes(iso, 12 * 60).getDay()]
  if (!window) return []
  const starts = new Set(slots)
  const dayBookings = bookings.filter((b) => b.date === iso)
  const teeth = []
  for (let min = window.start; min < window.end; min += SLOT_STEP_MIN) {
    const taken = dayBookings.some((b) => min < b.startMin + b.durationMin && min + SLOT_STEP_MIN > b.startMin)
    let state = 'free'
    if (atMinutes(iso, min).getTime() <= now.getTime()) state = 'past'
    else if (taken) state = 'taken'
    else if (starts.has(min)) state = 'start'
    teeth.push({ min, state })
  }
  return teeth
}
