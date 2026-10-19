// Mancs Állatorvosi Rendelő: oltási naptár, rendelés / ügyelet. Tájékoztató mintaadat, a sorrendről az állatorvos dönt.

// Oltások életkor szerint (napban). `yearly`: utána évente ismétlődik.
export const PLAN = {
  kutya: [
    { id: 'komb1', name: 'Kombinált oltás (parvo, szopornyica)', age: 42 },
    { id: 'komb2', name: 'Kombinált oltás, 2. kör', age: 63 },
    { id: 'chip', name: 'Mikrochip', age: 84, mandatory: true, note: '4 hónapos korig' },
    { id: 'komb3', name: 'Kombinált oltás, 3. kör', age: 84 },
    { id: 'veszettseg', name: 'Veszettség elleni oltás', age: 90, mandatory: true, yearly: true, note: 'utána évente ismételni' },
    { id: 'kombev', name: 'Kombinált emlékeztető', age: 365, yearly: true },
  ],
  macska: [
    { id: 'komb1', name: 'Kombinált oltás (macskanátha, panleukopénia)', age: 56 },
    { id: 'komb2', name: 'Kombinált oltás, 2. kör', age: 84 },
    { id: 'veszettseg', name: 'Veszettség elleni oltás', age: 90, yearly: true, note: 'ajánlott, ha kijár' },
    { id: 'kombev', name: 'Kombinált emlékeztető', age: 365, yearly: true },
  ],
}

const DAY = 86400000
const toDate = (iso) => new Date(`${iso}T12:00:00Z`)
const iso = (d) => d.toISOString().slice(0, 10)
export const addDays = (s, n) => iso(new Date(toDate(s).getTime() + n * DAY))
const diffDays = (a, b) => Math.round((toDate(b) - toDate(a)) / DAY)

/**
 * Oltási naptár a születési dátumból. A múltbeli tétel kész, ha `done` tartalmazza, különben késik.
 * Az évente ismétlődőnek kész után a következő esedékességét mutatja. 30 napon belül: esedékes.
 */
export function schedule(species, birth, today, done = []) {
  if (!PLAN[species] || !birth || birth > today) return []
  return PLAN[species].map((v) => {
    let date = addDays(birth, v.age)
    if (v.yearly && done.includes(v.id)) while (date <= today) date = addDays(date, 365)
    const inDays = diffDays(today, date)
    const status = done.includes(v.id) && !v.yearly ? 'kesz' : inDays < 0 ? 'kesik' : inDays <= 30 ? 'esedekes' : 'kesobb'
    return { ...v, date, inDays, status }
  }).sort((a, b) => a.date.localeCompare(b.date))
}

/** Életkor szövegesen: hét, hónap, év. */
export function ageText(birth, today) {
  const d = diffDays(birth, today)
  if (d < 0) return ''
  if (d < 70) return `${Math.floor(d / 7)} hetes`
  if (d < 730) return `${Math.floor(d / 30.4)} hónapos`
  return `${Math.floor(d / 365.25)} éves`
}

// Rendelési idő percben (0 = vasárnap); ezen kívül ügyelet.
export const HOURS = { 0: [], 1: [[480, 720], [900, 1140]], 2: [[480, 720], [900, 1140]], 3: [[480, 720], [900, 1140]], 4: [[480, 720], [900, 1140]], 5: [[480, 720], [900, 1140]], 6: [[540, 720]] }

/** Most rendelés van-e; ha nem, mikor kezdődik a következő (ma vagy a következő napokon). */
export function clinicState(date) {
  const day = date.getDay()
  const min = date.getHours() * 60 + date.getMinutes()
  const now = HOURS[day].find(([a, b]) => min >= a && min < b)
  if (now) return { open: true, until: now[1] }
  for (let i = 0; i < 8; i++) {
    const d = (day + i) % 7
    const next = HOURS[d].find(([a]) => i > 0 || a > min)
    if (next) return { open: false, inDays: i, opens: next[0] }
  }
  return { open: false }
}
