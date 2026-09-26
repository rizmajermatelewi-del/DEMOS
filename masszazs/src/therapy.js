/** Body zones on the map, back view. */
export const ZONES = {
  fej: 'Fej',
  nyak: 'Nyak',
  vall: 'Váll',
  hat: 'Felső hát',
  derek: 'Derék',
  csipo: 'Csípő',
  kar: 'Kar',
  lab: 'Láb',
  talp: 'Talp',
}

export const TREATMENTS = {
  svedTeljes: { name: 'Teljes testes svédmasszázs', minutes: 90, price: 16900 },
  svedRelax: { name: 'Relaxáló svédmasszázs', minutes: 60, price: 12900 },
  nyakVall: { name: 'Nyak-váll-fej kezelés', minutes: 30, price: 7400 },
  hatDerek: { name: 'Hát- és derékmasszázs', minutes: 45, price: 9900 },
  sport: { name: 'Sportmasszázs', minutes: 60, price: 13900 },
  talp: { name: 'Talpmasszázs', minutes: 40, price: 8400 },
}

const UPPER = new Set(['fej', 'nyak', 'vall'])
const BACK = new Set(['hat', 'derek', 'csipo'])

/**
 * Which treatment fits the marked zones. level: 1 = feszes, 2 = fáj, 3 = nagyon fáj.
 * Returns the treatment key and a one-line reason for the recommendation card.
 */
export function recommend(zones = [], level = 1) {
  const z = new Set(zones)
  if (z.size === 0) return { key: 'svedRelax', why: 'Nem fáj semmi? Akkor egy óra csak a pihenésért.' }
  if (z.size >= 4) return { key: 'svedTeljes', why: 'Több helyen feszül, ezért az egész testet átvesszük.' }
  if ([...z].every((x) => x === 'talp')) return { key: 'talp', why: 'Talp és lábfej, olajjal, reflexpontokkal.' }
  if ([...z].every((x) => UPPER.has(x))) return { key: 'nyakVall', why: 'Gépnél ülőknek: nyak, váll, fejbőr, fél óra alatt.' }
  if (z.has('lab') && level === 3) return { key: 'sport', why: 'Erős fájdalom a lábban: mélyebb, sportmasszázs.' }
  if ([...z].some((x) => BACK.has(x))) {
    return level === 3
      ? { key: 'sport', why: 'Erősen fájó hát: mélyebb technikával dolgozunk.' }
      : { key: 'hatDerek', why: 'Hát és derék, oda-vissza, a lapockák között is.' }
  }
  return { key: 'svedRelax', why: 'A jelölt helyekre több időt szánunk egy teljes órán belül.' }
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
