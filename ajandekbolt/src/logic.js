// Masni Ajándékbolt: ajándékkereső, csomagolás, félretétel. Minden adat kitalált.

export const WHO = [
  ['anya', 'Anyának'], ['apa', 'Apának'], ['baratno', 'Barátnőnek'], ['kollega', 'Kollégának'], ['gyerek', 'Gyereknek'], ['hazigazda', 'Házigazdának'],
]
export const OCCASIONS = [['szulinap', 'Születésnap'], ['nevnap', 'Névnap'], ['karacsony', 'Karácsony'], ['koszonet', 'Köszönet']]

export const STOCK = [
  { id: 1, name: 'Kézzel festett bögre', price: 4900, icon: 'coffee', stock: 6, who: ['anya', 'apa', 'kollega', 'baratno'], occ: ['szulinap', 'nevnap', 'karacsony'] },
  { id: 2, name: 'Szójagyertya, füge és cédrus', price: 5900, icon: 'flame', stock: 9, who: ['anya', 'baratno', 'hazigazda'], occ: ['szulinap', 'nevnap', 'karacsony', 'koszonet'] },
  { id: 3, name: 'Kerámia tálka, egyedi mázzal', price: 7400, icon: 'cooking-pot', stock: 3, who: ['anya', 'hazigazda', 'baratno'], occ: ['karacsony', 'koszonet', 'szulinap'] },
  { id: 4, name: 'Helyi termelői teaválogatás', price: 3600, icon: 'tea-bag', stock: 14, who: ['kollega', 'anya', 'hazigazda'], occ: ['koszonet', 'nevnap', 'karacsony'] },
  { id: 5, name: 'Vászon jegyzetfüzet, varrott', price: 2900, icon: 'note-pencil', stock: 20, who: ['kollega', 'baratno', 'apa'], occ: ['koszonet', 'nevnap', 'szulinap'] },
  { id: 6, name: 'Fa kirakós, 12 darabos', price: 6900, icon: 'puzzle-piece', stock: 4, who: ['gyerek'], occ: ['szulinap', 'karacsony', 'nevnap'] },
  { id: 7, name: 'Akvarell festőkészlet', price: 8900, icon: 'paint-brush', stock: 2, who: ['gyerek', 'baratno'], occ: ['szulinap', 'karacsony'] },
  { id: 8, name: 'Kézműves keksz díszdobozban', price: 3200, icon: 'cookie', stock: 0, who: ['kollega', 'hazigazda', 'gyerek'], occ: ['koszonet', 'karacsony', 'nevnap'] },
  { id: 9, name: 'Pozsgás növény kaspóban', price: 4400, icon: 'plant', stock: 7, who: ['kollega', 'baratno', 'anya', 'hazigazda'], occ: ['koszonet', 'szulinap', 'nevnap'] },
  { id: 10, name: 'Bőr kulcstartó, monogrammal', price: 5400, icon: 'key', stock: 5, who: ['apa', 'kollega'], occ: ['nevnap', 'szulinap', 'karacsony'] },
  { id: 11, name: 'Zoknicsomag, három pár', price: 4200, icon: 'sneaker-move', stock: 11, who: ['apa', 'baratno', 'gyerek'], occ: ['karacsony', 'nevnap', 'szulinap'] },
  { id: 12, name: 'Mini borválogatás, két üveg', price: 9800, icon: 'wine', stock: 3, who: ['apa', 'hazigazda'], occ: ['koszonet', 'karacsony', 'szulinap'] },
]

export const WRAPS = [
  { id: 'kraft', name: 'Kraft papír, madzaggal', price: 0, paper: '#c9a27a', ribbon: '#efe6d4' },
  { id: 'masni', name: 'Színes papír, nagy masnival', price: 600, paper: '#2f6f5e', ribbon: '#e2483d' },
  { id: 'doboz', name: 'Díszdoboz selyempapírral', price: 1500, paper: '#1d1b2e', ribbon: '#e8c46a' },
]

/** A kérésnek megfelelő termékek: az elfogyottak a végén, a keret fölöttiek kimaradnak. */
export function suggest({ who, occ, budget }) {
  return STOCK
    .filter((p) => p.price <= budget && (!who || p.who.includes(who)) && (!occ || p.occ.includes(occ)))
    .sort((a, b) => (b.stock > 0) - (a.stock > 0) || b.price - a.price)
}

export const wrapOf = (id) => WRAPS.find((w) => w.id === id) ?? WRAPS[0]
export const total = (item, wrapId) => item.price + wrapOf(wrapId).price
export const CARD_MAX = 90

/** Mi akadályozza a félretételt; üres lista = mehet. */
export function reserveProblems(item, card, name, phone) {
  const out = []
  if (!item) out.push('Válasszon egy ajándékot.')
  else if (item.stock < 1) out.push('Ez most elfogyott, de jövő héten jön újra.')
  if ((card ?? '').length > CARD_MAX) out.push(`A kártyára legfeljebb ${CARD_MAX} karakter fér.`)
  if (!name?.trim()) out.push('Adja meg a nevét.')
  if ((phone ?? '').replace(/\D/g, '').length < 8) out.push('Adjon meg egy telefonszámot.')
  return out
}

// Nyitvatartás percben (0 = vasárnap, null = zárva)
export const HOURS = { 0: null, 1: [600, 1080], 2: [600, 1080], 3: [600, 1080], 4: [600, 1080], 5: [600, 1080], 6: [540, 780] }

/** Meddig tesszük félre: a következő nyitvatartási nap zárásáig (a mai nap nem számít). */
export function holdUntil(date) {
  for (let i = 1; i <= 8; i++) {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate() + i)
    const h = HOURS[d.getDay()]
    if (h) return { date: d, close: h[1] }
  }
  return null
}

/** Rövid, könnyen bediktálható félretételi kód. */
export function holdCode(item, name, date) {
  let h = 7
  for (const c of `${item.id}|${name}|${date.toDateString()}`) h = (h * 31 + c.charCodeAt(0)) >>> 0
  const A = 'ABCDEFGHJKLMNPRSTUVZ'
  return `${A[h % A.length]}${A[(h >>> 5) % A.length]}-${String(h % 1000).padStart(3, '0')}`
}
