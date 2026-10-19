// Fekete Tinta tetováló: flash lap, ár- és alkalombecslés, konzultáció. Minden adat kitalált.

export const PLACEMENTS = {
  alkar: { name: 'Alkar', pain: 2, k: 1 },
  felkar: { name: 'Felkar', pain: 2, k: 1 },
  vall: { name: 'Váll', pain: 3, k: 1.05 },
  boka: { name: 'Boka', pain: 4, k: 1.15 },
  borda: { name: 'Borda', pain: 5, k: 1.25 },
  hat: { name: 'Hát', pain: 3, k: 1.1 },
}
export const STYLES = {
  vonal: { name: 'Vonalas', perCm2: 260, cmPerHour: 60 },
  arnyek: { name: 'Árnyékolt', perCm2: 380, cmPerHour: 40 },
  szines: { name: 'Színes', perCm2: 460, cmPerHour: 32 },
}
export const MIN_PRICE = 25000
export const SESSION_HOURS = 4
export const PAIN = ['', 'alig érezni', 'elviselhető', 'kellemetlen', 'erős', 'nagyon erős']

const round1000 = (n) => Math.round(n / 1000) * 1000

/** Becslés négyzet alakú mintára (`cm` az oldala): ársáv, idő, alkalmak száma. Érvénytelen: null. */
export function estimate(placementId, cm, styleId) {
  const p = PLACEMENTS[placementId], s = STYLES[styleId]
  const size = Number(cm)
  if (!p || !s || !Number.isFinite(size) || size < 3 || size > 40) return null
  const area = size * size
  const base = Math.max(MIN_PRICE, area * s.perCm2 * p.k)
  const hours = Math.max(1, Math.round((area / s.cmPerHour) * p.k * 2) / 2)
  return {
    low: round1000(base * 0.85), high: round1000(base * 1.15),
    hours, sessions: Math.ceil(hours / SESSION_HOURS), pain: p.pain,
    heal: hours > SESSION_HOURS ? '3–4 hét alkalmanként' : '2–3 hét',
  }
}

export const FLASH = [
  { id: 1, name: 'Fecske', size: 6, price: 32000, taken: false },
  { id: 2, name: 'Tőr és rózsa', size: 10, price: 48000, taken: true },
  { id: 3, name: 'Hold, csillagokkal', size: 5, price: 28000, taken: false },
  { id: 4, name: 'Kígyó', size: 12, price: 56000, taken: false },
  { id: 5, name: 'Szív szalaggal', size: 7, price: 34000, taken: false },
  { id: 6, name: 'Párduc', size: 11, price: 52000, taken: true },
]

/** Egy flash mintát csak egyszer varrunk: ami foglalt, az nem kérhető. 18 év alatt nem tetoválunk. */
export function claimProblems(item, name, phone, adult) {
  const out = []
  if (!item) out.push('Válasszon egy mintát a lapról.')
  else if (item.taken) out.push('Ezt már valaki lefoglalta, válasszon másikat.')
  if (!name?.trim()) out.push('Adja meg a nevét.')
  if ((phone ?? '').replace(/\D/g, '').length < 8) out.push('Adjon meg egy telefonszámot.')
  if (!adult) out.push('Csak 18 év fölött tetoválunk.')
  return out
}
