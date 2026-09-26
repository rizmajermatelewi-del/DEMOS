/**
 * VITA classical shades ordered from lightest to darkest (the value-ordered guide
 * dentists use for whitening), with an approximate enamel colour for the drawing.
 */
export const SHADES = [
  { code: 'B1', color: '#f4efe2' },
  { code: 'A1', color: '#f1e8d3' },
  { code: 'B2', color: '#efe3c6' },
  { code: 'D2', color: '#e9dcc4' },
  { code: 'A2', color: '#ecdcbb' },
  { code: 'C1', color: '#e4dac7' },
  { code: 'C2', color: '#ddd0b6' },
  { code: 'D4', color: '#dfcfae' },
  { code: 'A3', color: '#e5d1a8' },
  { code: 'D3', color: '#dccbae' },
  { code: 'B3', color: '#e2cc9c' },
  { code: 'A3.5', color: '#dcc293' },
  { code: 'B4', color: '#d8bf8c' },
  { code: 'C3', color: '#cfc0a0' },
  { code: 'A4', color: '#cdb183' },
  { code: 'C4', color: '#bfae8b' },
]

// One in-office whitening session lightens about three steps on the guide.
const STEPS_PER_SESSION = 3
export const SESSION_PRICE = 45000
export const CHECKUP_PRICE = 12000

/** Sessions needed to go from one guide position to a lighter one. */
export function sessionsNeeded(from, to) {
  const steps = from - to
  return steps <= 0 ? 0 : Math.ceil(steps / STEPS_PER_SESSION)
}

/** Whitening quote: a check-up and cleaning first, then the sessions. */
export function whiteningQuote(from, to) {
  const sessions = sessionsNeeded(from, to)
  return { sessions, total: sessions ? CHECKUP_PRICE + sessions * SESSION_PRICE : 0 }
}

// Emergency hours: every weekday 7:30-8:30, first come first served, 15 minutes each.
const EMERGENCY = { start: 7 * 60 + 30, end: 8 * 60 + 30, step: 15 }

/** The next emergency slot from `now`: today if the hour has not passed, otherwise the next weekday. */
export function emergencySlot(now = new Date()) {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const min = now.getHours() * 60 + now.getMinutes()
  const weekday = (x) => x.getDay() >= 1 && x.getDay() <= 5
  if (weekday(d) && min < EMERGENCY.end - EMERGENCY.step) {
    const next = Math.max(EMERGENCY.start, Math.ceil((min + 1) / EMERGENCY.step) * EMERGENCY.step)
    return { date: d, minutes: next, today: true }
  }
  do d.setDate(d.getDate() + 1)
  while (!weekday(d))
  return { date: d, minutes: EMERGENCY.start, today: false }
}

/** Booking form errors. */
export function bookingProblems(data) {
  const next = {}
  if (String(data.name ?? '').trim().length < 2) next.name = 'Kérjük, írja be a nevét.'
  if (String(data.phone ?? '').replace(/\D/g, '').length < 8) next.phone = 'Egy hívható szám kell.'
  if (!data.reason) next.reason = 'Miért jönne?'
  return next
}
