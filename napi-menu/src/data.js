export const BUSINESS = {
  name: 'Kispipa Büfé',
  city: 'Szeged',
  address: 'Tisza Lajos krt. 42.',
  phone: '+36 62 555 0142',
  hours: 'Hétfő-péntek 11:00-15:00',
  adminPassword: 'menu2026',
}

export function formatHuf(n) {
  if (!Number.isFinite(Number(n))) return '-'
  return new Intl.NumberFormat('hu-HU', {
    style: 'currency',
    currency: 'HUF',
    maximumFractionDigits: 0,
  }).format(n)
}

/** How prices are pinned on a letterboard: 2 390,- */
export function boardPrice(n) {
  if (!Number.isFinite(Number(n)) || String(n).trim() === '') return '?'
  return `${new Intl.NumberFormat('hu-HU').format(Number(n))},-`
}

export function isoLocal(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function formatDay(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Intl.DateTimeFormat('hu-HU', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date(y, m - 1, d, 12))
}

export function weekdayName(day) {
  return ['vasárnap', 'hétfő', 'kedd', 'szerda', 'csütörtök', 'péntek', 'szombat'][day]
}

/** Full forms. Suffix-gluing gets csütörtök and péntek wrong. */
export const DAY_COPY = {
  1: { title: 'hétfői', every: 'hétfőn' },
  2: { title: 'keddi', every: 'kedden' },
  3: { title: 'szerdai', every: 'szerdán' },
  4: { title: 'csütörtöki', every: 'csütörtökön' },
  5: { title: 'pénteki', every: 'pénteken' },
}

/** The allergen codes the board prints after a dish, with the legend text. */
export const ALLERGENS = {
  G: 'glutén',
  T: 'tojás',
  L: 'tej',
  H: 'hal',
  Z: 'zeller',
  M: 'mustár',
  D: 'diófélék',
}

/** Weekly template, keyed by Date.getDay(). Weekend is closed. */
export const SEED = {
  1: {
    soup: 'Újházi tyúkhúsleves',
    soupPrice: 890,
    soupAllergens: ['G', 'T', 'Z'],
    mains: [
      { name: 'Sertéspörkölt nokedlivel', price: 2490, allergens: ['G', 'T'] },
      { name: 'Rántott sajt rizzsel', price: 2290, allergens: ['G', 'T', 'L'] },
    ],
    dessert: 'Somlói galuska',
    dessertPrice: 790,
    dessertAllergens: ['G', 'T', 'L', 'D'],
    note: 'A pörkölt gluténmentes nokedlivel is kérhető.',
    closed: false,
  },
  2: {
    soup: 'Gulyásleves',
    soupPrice: 990,
    soupAllergens: ['G', 'Z'],
    mains: [
      { name: 'Csirkepaprikás galuskával', price: 2390, allergens: ['G', 'T', 'L'] },
      { name: 'Töltött káposzta', price: 2590, allergens: ['L'] },
    ],
    dessert: 'Túró rudi szelet',
    dessertPrice: 490,
    dessertAllergens: ['G', 'T', 'L'],
    note: '',
    closed: false,
  },
  3: {
    soup: 'Húsleves cérnametélttel',
    soupPrice: 890,
    soupAllergens: ['G', 'T', 'Z'],
    mains: [
      { name: 'Rántott hús petrezselymes burgonyával', price: 2690, allergens: ['G', 'T'] },
      { name: 'Kelkáposzta főzelék pörkölttel', price: 2290, allergens: ['G', 'L'] },
    ],
    dessert: 'Palacsinta',
    dessertPrice: 690,
    dessertAllergens: ['G', 'T', 'L'],
    note: '',
    closed: false,
  },
  4: {
    soup: 'Zöldborsóleves',
    soupPrice: 850,
    soupAllergens: ['G', 'L'],
    mains: [
      { name: 'Brassói aprópecsenye', price: 2590, allergens: [] },
      { name: 'Túrós csusza', price: 1990, allergens: ['G', 'T', 'L'] },
    ],
    dessert: 'Almás pite',
    dessertPrice: 590,
    dessertAllergens: ['G', 'T', 'L'],
    note: '',
    closed: false,
  },
  5: {
    soup: 'Frankfurti leves',
    soupPrice: 890,
    soupAllergens: ['G', 'L', 'M'],
    mains: [
      { name: 'Halászlé', price: 2890, allergens: ['H'] },
      { name: 'Rántott gomba tartárral', price: 2190, allergens: ['G', 'T', 'L', 'M'] },
    ],
    dessert: 'Krémes',
    dessertPrice: 550,
    dessertAllergens: ['G', 'T', 'L'],
    note: 'A halászlé csípős.',
    closed: false,
  },
}

export function dayMenu(week, date) {
  const day = date.getDay()
  if (day === 0 || day === 6) return { closed: true, weekend: true }
  return week[day] ?? { closed: true }
}
