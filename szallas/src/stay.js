// Diófa Vendégház: szobák, foglaltság, ár. Minden adat kitalált mintaadat.

export const ROOMS = [
  {
    id: 1, name: 'Padlásszoba', photo: 'szoba-padlas', sleeps: 3, size: 26, nightly: 26000,
    beds: 'franciaágy + egy pótágy', dog: false,
    perks: ['fenyő lambéria, ferde tető', 'íróasztal a kerekablaknál', 'saját fürdő zuhanyzóval'],
  },
  {
    id: 2, name: 'Kandallós szoba', photo: 'szoba-kandallo', sleeps: 2, size: 30, nightly: 32000,
    beds: 'franciaágy', dog: false,
    perks: ['kandalló, a fát mi készítjük be', 'gerendás mennyezet', 'kád és zuhany is'],
  },
  {
    id: 3, name: 'Kertre néző szoba', photo: 'szoba-kert', sleeps: 2, size: 22, nightly: 24000,
    beds: 'két külön ágy vagy összetolva', dog: true,
    perks: ['földszint, lépcső nélkül', 'kutyával is jöhetnek', 'kijárat a diófa alá'],
  },
  {
    id: 4, name: 'Csillagnéző', photo: 'szoba-este', sleeps: 2, size: 16, nightly: 21000,
    beds: 'franciaágy', dog: false,
    perks: ['tetőablak az ágy fölött', 'a legcsendesebb szoba', 'saját fürdő zuhanyzóval'],
  },
]

export const WEEKEND_EXTRA = 4000 // péntek és szombat éjszaka
export const EXTRA_BED = 6000 // a harmadik fő éjszakánként (csak a padlásszobában)
export const DOG = 3000 // éjszakánként
export const BREAKFAST = 3500 // fő / reggel
export const IFA = 450 // idegenforgalmi adó, 18 év felett, fő / éj (mintaérték)
export const PORTAL_MARKUP = 0.15 // ennyivel drágább ugyanaz a portálon, mert ott ennyi a jutalék
export const MIN_NIGHTS = 2

const DAY = 86400000
const toDate = (iso) => new Date(`${iso}T12:00:00Z`)
export const addDays = (iso, n) => new Date(toDate(iso).getTime() + n * DAY).toISOString().slice(0, 10)
export const nightsOf = (arrival, nights) => Array.from({ length: nights }, (_, i) => addDays(arrival, i))
export const isWeekendNight = (iso) => [5, 6].includes(toDate(iso).getUTCDay())

// Kitalált, de stabil foglaltság: ugyanarra a napra mindig ugyanaz jön ki, hétvégén több a vendég.
function hash(s) {
  let h = 2166136261
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  return (h >>> 0) % 100
}
export const isBooked = (roomId, iso) => hash(`${roomId}:${iso}`) < (isWeekendNight(iso) ? 48 : 16)
export const roomFree = (roomId, arrival, nights) => nightsOf(arrival, nights).every((d) => !isBooked(roomId, d))

const round100 = (n) => Math.round(n / 100) * 100

/** Az ár soronként, ahogy a vendég látja; a portálár ugyanaz a szállásdíj jutalékkal. */
export function quote(room, { arrival, nights, adults, kids = 0, dog = false, breakfast = false }) {
  const list = nightsOf(arrival, nights)
  const weekend = list.filter(isWeekendNight).length
  const lines = [{ label: `${nights} éj × ${String(room.nightly).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} Ft`, amount: nights * room.nightly }]
  if (weekend) lines.push({ label: `hétvégi felár (${weekend} éj)`, amount: weekend * WEEKEND_EXTRA })
  const guests = adults + kids
  if (guests > 2) lines.push({ label: 'pótágy', amount: nights * EXTRA_BED * (guests - 2) })
  if (dog) lines.push({ label: 'kutya', amount: nights * DOG })
  if (breakfast) lines.push({ label: `reggeli (${guests} fő × ${nights} reggel)`, amount: guests * nights * BREAKFAST })
  const stay = lines.reduce((s, l) => s + l.amount, 0)
  const ifa = adults * nights * IFA
  const portal = round100(stay * (1 + PORTAL_MARKUP)) + ifa
  return { lines, stay, ifa, total: stay + ifa, portal, saving: portal - (stay + ifa) }
}

/** Mi akadályozza a foglalást; üres lista = kérhető. */
export function problems(room, { arrival, nights, adults, kids = 0, dog = false }, today) {
  const out = []
  if (!arrival || arrival < today) out.push('Az érkezés nem lehet a múltban.')
  if (nights < MIN_NIGHTS) out.push(`Legalább ${MIN_NIGHTS} éjszakára fogadunk vendéget.`)
  if (adults < 1) out.push('Legalább egy felnőtt kell.')
  if (adults + kids > room.sleeps) out.push(`A ${room.name} legfeljebb ${room.sleeps} főt fogad.`)
  if (dog && !room.dog) out.push('Kutyával a Kertre néző szobát tudjuk adni.')
  if (arrival && nights >= 1 && !roomFree(room.id, arrival, nights)) out.push('Erre az időre a szoba már foglalt.')
  return out
}

/** Az első érkezés `from`-tól, amikor legalább `need` szoba szabad `nights` éjre. */
export function firstOpen(from, nights, need = 1, limit = 120) {
  for (let i = 0; i < limit; i++) {
    const day = addDays(from, i)
    if (ROOMS.filter((r) => roomFree(r.id, day, nights)).length >= need) return day
  }
  return from
}
