/** Sample garage. Every figure is invented and labelled as a demo on the page. */
export const BUSINESS = {
  name: 'Kormos Autószerviz',
  city: 'Gyál',
  address: 'Ipar utca 14.',
  phone: '+36 30 618 2270',
  email: 'muhely@kormos-autoszerviz.demo',
  hours: 'Hétfő–péntek 7:30–17:00 · szombat 8:00–12:00',
  adminPin: '2468',
}

export const SERVICES = [
  {
    id: 'olajcsere',
    name: 'Olajcsere + szűrők',
    durationMin: 60,
    priceHuf: 24900,
    blurb: 'Motorolaj, olaj- és levegőszűrő. Az ár munkadíj + alap olaj.',
  },
  {
    id: 'diagnosztika',
    name: 'Hibakód-olvasás',
    durationMin: 30,
    priceHuf: 9900,
    blurb: 'Számítógépes diagnosztika, szóban elmondjuk, mit látunk.',
  },
  {
    id: 'fek',
    name: 'Fékbetét-csere (egy tengely)',
    durationMin: 90,
    priceHuf: 19900,
    blurb: 'Munkadíj. Az alkatrészt előre egyeztetjük, vagy hozhatod.',
  },
  {
    id: 'vizsga',
    name: 'Műszaki vizsga előtti átnézés',
    durationMin: 90,
    priceHuf: 14900,
    blurb: 'Átnézzük, ami a vizsgán elbukhat, és írásban kapod a listát.',
  },
  {
    id: 'klima',
    name: 'Klímatöltés',
    durationMin: 60,
    priceHuf: 18900,
    blurb: 'Leszívás, vákuumpróba, töltés. Szivárgásnál előbb szólunk.',
  },
]

/** Minutes from local midnight. Sunday is closed. */
export const OPEN_WINDOWS = {
  0: null,
  1: { start: 7 * 60 + 30, end: 17 * 60 },
  2: { start: 7 * 60 + 30, end: 17 * 60 },
  3: { start: 7 * 60 + 30, end: 17 * 60 },
  4: { start: 7 * 60 + 30, end: 17 * 60 },
  5: { start: 7 * 60 + 30, end: 17 * 60 },
  6: { start: 8 * 60, end: 12 * 60 },
}

export const SLOT_STEP_MIN = 30

export function formatHuf(n) {
  return new Intl.NumberFormat('hu-HU', {
    style: 'currency',
    currency: 'HUF',
    maximumFractionDigits: 0,
  }).format(n)
}

export function minutesToLabel(min) {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/**
 * Hungarian plates: old "ABC-123" and new "AA AA-123" (space and dash optional).
 * Returns the plate in its canonical form, or null.
 */
export function normalizePlate(raw) {
  const plate = String(raw ?? '').toUpperCase().replace(/[\s-]/g, '')
  if (/^[A-Z]{3}\d{3}$/.test(plate)) return `${plate.slice(0, 3)}-${plate.slice(3)}`
  if (/^[A-Z]{4}\d{3}$/.test(plate)) return `${plate.slice(0, 2)} ${plate.slice(2, 4)}-${plate.slice(4)}`
  return null
}
