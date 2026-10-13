import { OPEN_WINDOWS } from './data.js'
import { atMinutes, combTeeth, slotsForDate } from './slots.js'

/** Three stylists, each with the services they take and their own calendar. */
export const STAFF = [
  { id: 'reka', name: 'Réka', role: 'Festés, balayage', bio: 'Tizenkét éve fest. Ha nem tudod, mit szeretnél, vele érdemes kezdeni.', services: ['noi-vagas', 'festes', 'balayage', 'alkalmi', 'apolas'] },
  { id: 'bence', name: 'Bence', role: 'Férfi és női vágás', bio: 'Rövid hajak, éles kontúrok. Gépre és ollóra egyformán.', services: ['ferfi-vagas', 'noi-vagas'] },
  { id: 'dora', name: 'Dóra', role: 'Alkalmi frizura, ápolás', bio: 'Esküvők és ballagások. Próbafrizurát is vállal, egy héttel előtte.', services: ['alkalmi', 'festes', 'noi-vagas', 'balayage', 'apolas'] },
]

/** "Whoever is free": the union of the eligible stylists' calendars. */
export const ANY = 'barki'

export function staffFor(serviceId) {
  return STAFF.filter((s) => s.services.includes(serviceId))
}

export function staffName(id) {
  return STAFF.find((s) => s.id === id)?.name ?? ''
}

/** Deterministic 0..1 from a string, so the sample calendar is the same on every visit. */
function hash01(text) {
  let h = 2166136261
  for (const ch of text) h = Math.imul(h ^ ch.charCodeAt(0), 16777619)
  return ((h >>> 0) % 10000) / 10000
}

/** Two or three invented appointments per stylist per open day, so each
    calendar looks lived-in and the stylists differ. Shown as taken teeth,
    never listed in the salon's calendar. */
export function sampleBusy(iso, staffId) {
  const window = OPEN_WINDOWS[atMinutes(iso, 12 * 60).getDay()]
  if (!window) return []
  const halfHours = (window.end - window.start) / 30
  const count = 2 + Math.floor(hash01(`${iso}:${staffId}:n`) * 2)
  const durations = [30, 45, 60, 90]
  const out = []
  for (let i = 0; i < count; i += 1) {
    const durationMin = durations[Math.floor(hash01(`${iso}:${staffId}:d${i}`) * durations.length)]
    const startMin = window.start + Math.floor(hash01(`${iso}:${staffId}:s${i}`) * halfHours) * 30
    if (startMin + durationMin <= window.end) out.push({ date: iso, startMin, durationMin, staffId, sample: true })
  }
  return out
}

/** What blocks one stylist: their own bookings, legacy bookings that name
    nobody (they block everyone), and their sample appointments. */
export function busyFor(staffId, iso, bookings) {
  const own = (Array.isArray(bookings) ? bookings : []).filter((b) => b && (!b.staffId || b.staffId === staffId))
  return [...own, ...sampleBusy(iso, staffId)]
}

/** Free starts across the given stylists, and who is free at each one. */
export function availability(iso, durationMin, bookings, staffIds, now = new Date()) {
  const who = new Map()
  for (const id of staffIds) {
    for (const start of slotsForDate(iso, durationMin, busyFor(id, iso, bookings), now)) {
      who.set(start, [...(who.get(start) ?? []), id])
    }
  }
  return { slots: [...who.keys()].sort((a, b) => a - b), who }
}

/** The comb for several stylists: a tooth is taken only when every one of them is busy then. */
export function teethFor(iso, slots, bookings, staffIds, now = new Date()) {
  const per = staffIds.map((id) => combTeeth(iso, [], busyFor(id, iso, bookings), now))
  if (!per.length || !per[0].length) return []
  const starts = new Set(slots)
  return per[0].map(({ min, state }, i) => {
    if (state === 'past') return { min, state }
    if (starts.has(min)) return { min, state: 'start' }
    const allTaken = per.every((teeth) => teeth[i].state === 'taken')
    return { min, state: allTaken ? 'taken' : 'free' }
  })
}

/** The earliest free start across the given days, or null. Feeds the
    "next free" lines in the hero and under each stylist. */
export function firstFree(days, durationMin, bookings, staffIds, now = new Date()) {
  for (const iso of days) {
    const [startMin] = availability(iso, durationMin, bookings, staffIds, now).slots
    if (startMin != null) return { date: iso, startMin }
  }
  return null
}
