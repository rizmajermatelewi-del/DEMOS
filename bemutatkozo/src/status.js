/** Mon-Fri 8:00-17:00, in minutes from midnight. */
const OPEN = 8 * 60
const CLOSE = 17 * 60
const DAYS = ['vasárnap', 'hétfő', 'kedd', 'szerda', 'csütörtök', 'péntek', 'szombat']

/** Whether the phone is answered right now, and when it will be next. */
export function phoneStatus(now = new Date()) {
  const day = now.getDay()
  const min = now.getHours() * 60 + now.getMinutes()
  const weekday = day >= 1 && day <= 5
  if (weekday && min >= OPEN && min < CLOSE) return { open: true, label: 'Most hívható, 17:00-ig' }
  if (weekday && min < OPEN) return { open: false, label: 'Ma 8:00-tól hívható' }
  const next = day === 5 || day === 6 ? 1 : day === 0 ? 1 : day + 1
  const when = next === (day + 1) % 7 ? 'holnap' : DAYS[next]
  return { open: false, label: `Most nem, ${when} 8:00-tól` }
}
