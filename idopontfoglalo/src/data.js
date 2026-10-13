/** Sample salon. Every figure is invented and labelled as a demo on the page. */
export const BUSINESS = {
  name: 'Szálka Fodrászat',
  city: 'Kecskemét',
  address: 'Szabadság tér 8.',
  phone: '+36 70 412 8831',
  email: 'foglalas@szalka-fodraszat.demo',
  hours: 'Hétfő-péntek 9:00-18:00, szombat 9:00-14:00',
  adminPin: '2468',
}

/** shade: the colour of this strand on the swatch ring. Hair colours, not UI accents. */
export const SERVICES = [
  { id: 'noi-vagas', name: 'Női hajvágás', durationMin: 45, priceHuf: 6500, shade: '#3a2a1e', blurb: 'Mosás, vágás, szárítás. Rövid és középhosszú hajra.' },
  { id: 'ferfi-vagas', name: 'Férfi hajvágás', durationMin: 30, priceHuf: 4200, shade: '#17140f', blurb: 'Gépi és ollós vágás, kontúr, szárítás.' },
  { id: 'festes', name: 'Festés, melír', durationMin: 90, priceHuf: 14500, shade: '#8b3a1d', blurb: 'Egyszínű festés vagy melír, ápoló kezeléssel.' },
  { id: 'balayage', name: 'Balayage', durationMin: 150, priceHuf: 24900, shade: '#c39a6b', blurb: 'Kézzel festett, puha átmenet a tövétől a végéig.' },
  { id: 'alkalmi', name: 'Alkalmi frizura', durationMin: 60, priceHuf: 9800, shade: '#5e3d2c', blurb: 'Esküvő, ballagás, fotózás. Tartós formázás.' },
  { id: 'apolas', name: 'Hajápoló kezelés', durationMin: 45, priceHuf: 7900, shade: '#dccbb2', blurb: 'Mélyhidratáló pakolás és fejbőrmasszázs.' },
]

/** Minutes from local midnight. Sunday is closed. */
export const OPEN_WINDOWS = {
  0: null,
  1: { start: 9 * 60, end: 18 * 60 },
  2: { start: 9 * 60, end: 18 * 60 },
  3: { start: 9 * 60, end: 18 * 60 },
  4: { start: 9 * 60, end: 18 * 60 },
  5: { start: 9 * 60, end: 18 * 60 },
  6: { start: 9 * 60, end: 14 * 60 },
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
