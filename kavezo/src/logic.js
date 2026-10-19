// Szemközt kávézó és borbár: nyitvatartás, napszak szerinti kínálat, esti programok. Minden adat kitalált.

// Nyitvatartás percben, a hét napja szerint (0 = vasárnap).
export const HOURS = {
  0: [9 * 60, 18 * 60],
  1: [7 * 60, 23 * 60], 2: [7 * 60, 23 * 60], 3: [7 * 60, 23 * 60], 4: [7 * 60, 23 * 60], 5: [7 * 60, 24 * 60],
  6: [8 * 60, 24 * 60],
}

// Napszakok: a kínálat ehhez igazodik.
export const MODES = [
  { id: 'reggel', from: 7 * 60, name: 'Reggel', line: 'Kávé és reggeli, ablak mellett.' },
  { id: 'delutan', from: 11 * 60, name: 'Napközben', line: 'Sütemény, szendvics, egy újabb kávé.' },
  { id: 'aperitivo', from: 17 * 60, name: 'Aperitivo', line: 'Fröccs és sós falatok munka után.' },
  { id: 'este', from: 19 * 60, name: 'Este', line: 'Borbár: pohárra mért bor, sajt, halk zene.' },
]

export function modeAt(min) {
  let m = MODES[0]
  for (const x of MODES) if (min >= x.from) m = x
  return m
}

/** Mennyire esti a hangulat: 16:00 előtt 0, 20:00 után 1, közte átmenet. */
export const nightness = (min) => Math.min(1, Math.max(0, (min - 16 * 60) / (4 * 60)))

export const MENU = {
  reggel: [
    ['Espresso', 690, 'a hét kávéjából, egy adag'], ['Cappuccino', 990, 'helyi tejjel vagy zabitallal'],
    ['Lágy tojás pirítóssal', 1890, 'két tojás, vaj, metélőhagyma'], ['Kakaós csiga', 790, 'reggel hétkor jön a pékségből'],
  ],
  delutan: [
    ['Flat white', 1090, 'dupla ristretto, kevés tej'], ['Répatorta', 1290, 'krémsajtos bevonattal'],
    ['Sonkás-sajtos melegszendvics', 1990, 'savanyú uborkával'], ['Házi limonádé', 990, 'bodzás vagy gyömbéres'],
  ],
  aperitivo: [
    ['Hosszúlépés', 890, 'olaszrizling, szódával'], ['Aperol spritz', 2190, 'narancsszelettel'],
    ['Pogácsa és olajbogyó', 1290, 'a pultról, amíg van'], ['Alkoholmentes spritz', 1490, 'keserű narancs, rozmaring'],
  ],
  este: [
    ['Olaszrizling, 1 dl', 790, 'Badacsony, száraz'], ['Kékfrankos, 1 dl', 890, 'Villány, testes'],
    ['Sajttál három sajttal', 3490, 'dióval és birsalmasajttal'], ['Pirított mandula', 990, 'füstös sóval'],
  ],
}

/** Nyitva van-e az adott pillanatban; ha igen, meddig, ha nem, mikor nyit és hány nap múlva. */
export function openState(date) {
  const day = date.getDay()
  const min = date.getHours() * 60 + date.getMinutes()
  const [o, c] = HOURS[day]
  if (min >= o && min < c) return { open: true, until: c }
  if (min < o) return { open: false, opens: o, inDays: 0 }
  const next = (day + 1) % 7
  return { open: false, opens: HOURS[next][0], inDays: 1 }
}

// Heti programok: a hét napja szerint ismétlődnek.
export const PROGRAMS = {
  2: { name: 'Kocsmakvíz', time: '19:30', seats: 24, price: 0, note: 'csapatban 2-6 fő, a nyertes asztal egy üveg bort kap' },
  4: { name: 'Borkóstoló', time: '19:00', seats: 14, price: 6900, note: 'öt bor egy borásszal, sajttal' },
  5: { name: 'Jazz a sarokban', time: '20:00', seats: 30, price: 0, note: 'élő duó, belépő nincs' },
}

const DAY = 86400000
const iso = (d) => d.toISOString().slice(0, 10)
const fromIso = (s) => new Date(`${s}T12:00:00Z`)
function hash(s) {
  let h = 2166136261
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  return h >>> 0
}

/** A következő `n` program `from`-tól (ISO nap). A szabad hely kitalált, de stabil; a közelebbi est teltebb. */
export function upcoming(from, n = 6) {
  const out = []
  for (let i = 0; out.length < n && i < 60; i++) {
    const d = iso(new Date(fromIso(from).getTime() + i * DAY))
    const p = PROGRAMS[fromIso(d).getUTCDay()]
    if (!p) continue
    const soon = Math.max(0, 1 - i / 21) // a következő három hét fokozatosan telik
    const taken = Math.min(p.seats, Math.round(p.seats * (0.25 + 0.6 * soon)) + (hash(d + p.name) % 4))
    out.push({ date: d, ...p, left: p.seats - taken })
  }
  return out
}

/** Asztalfoglalás egy programra; üres lista = mehet. */
export function bookingProblems(event, people) {
  const out = []
  if (!event) out.push('Válasszon egy estét.')
  if (!Number.isInteger(people) || people < 1) out.push('Legalább egy főre foglaljon.')
  if (event && people > event.left) out.push(event.left ? `Erre az estére már csak ${event.left} hely maradt.` : 'Erre az estére betelt a hely.')
  if (event?.name === 'Kocsmakvíz' && people > 6) out.push('A kvízen egy csapat legfeljebb 6 fő.')
  return out
}

export const clock = (min) => `${Math.floor(min / 60) % 24}:${String(min % 60).padStart(2, '0')}`
