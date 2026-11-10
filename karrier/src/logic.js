// Hajnal Pékség, karrier: minden számítás itt, hogy tesztelhető legyen.
// Bérek és műszakok mintaadatok (bemutató projekt).

export const DAYS = ['Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat', 'Vasárnap']
export const SHIFTS = {
  hajnal: { label: 'Hajnal', start: 3, end: 11 },
  delelott: { label: 'Délelőtt', start: 6, end: 14 },
  delutan: { label: 'Délután', start: 13, end: 20 },
}
export const NIGHT_PCT = 15 // éjszakai pótlék a 22 és 6 óra közötti munkára

const days = (...idx) => idx
export const JOBS = [
  { id: 'pek', title: 'Pék, péksegéd', shift: 'hajnal', days: days(0, 1, 2, 3, 4, 5), needDays: 5, hourly: 2600,
    needs: ['Nem kell végzettség, megtanítjuk', 'Egészségügyi kiskönyv (segítünk intézni)'] },
  { id: 'elado', title: 'Eladó a boltban', shift: 'delelott', alt: 'delutan', days: days(0, 1, 2, 3, 4, 5), needDays: 5, hourly: 2150,
    needs: ['Kedves a vevőkkel', 'Kasszát betanítjuk'] },
  { id: 'kiszallito', title: 'Reggeli kiszállító', shift: 'hajnal', days: days(0, 1, 2, 3, 4), needDays: 3, hourly: 2350,
    needs: ['B kategóriás jogosítvány', 'Céges autóval, részmunkaidő'] },
]

export const slot = (day, shift) => `${day}:${shift}`

/** Az éjszakai (22–6) órák száma egy műszakban. */
export function nightHours(start, end) {
  const overlap = (a, b) => Math.max(0, Math.min(end, b) - Math.max(start, a))
  return overlap(0, 6) + overlap(22, 24)
}

/** Hány napon passzol a jelölt egy munkához (bármelyik engedett műszakban). */
export function match(avail, job) {
  const shifts = [job.shift, job.alt].filter(Boolean)
  const covered = job.days.filter((d) => shifts.some((s) => avail.has(slot(d, s))))
  const pct = Math.min(1, covered.length / job.needDays)
  return { covered: covered.length, need: job.needDays, pct }
}

export function verdict(pct) {
  if (pct >= 1) return { key: 'jo', text: 'Pont Önnek való' }
  if (pct >= 0.6) return { key: 'talan', text: 'Megbeszélhető' }
  return { key: 'nem', text: 'Most nem illik' }
}

/** Heti bruttó becslés: a passzoló napok (legfeljebb a kért számig) × műszakóra, éjszakai pótlékkal, 100-ra kerekítve. */
export function weeklyGross(job, coveredDays) {
  const d = Math.min(coveredDays, job.needDays)
  const s = SHIFTS[job.shift]
  const hours = s.end - s.start
  const night = nightHours(s.start, s.end)
  const perDay = hours * job.hourly + night * job.hourly * (NIGHT_PCT / 100)
  return Math.round((d * perDay) / 100) * 100
}

/** Magyar mobilszám: +36 vagy 06, majd 20/30/31/50/70 és 7 számjegy. Szóköz, kötőjel mindegy. */
export function validPhone(raw) {
  const s = String(raw).replace(/[\s\-()/]/g, '')
  return /^(\+36|06)(20|30|31|50|70)\d{7}$/.test(s)
}

export const forint = (n) => `${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0')}\u00a0Ft`
