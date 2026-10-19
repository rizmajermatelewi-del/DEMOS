// Küllő Kerékpárszerviz: alkatrészenkénti szolgáltatások, munkalap, leadási napok. Minden adat kitalált.

export const PARTS = {
  kerek: { name: 'Kerék', services: [['defekt', 'Defektjavítás, belső cseréje', 3500, 20], ['centir', 'Kerékcentírozás', 4500, 30], ['kulso', 'Külső gumi cseréje', 2500, 15]] },
  fek: { name: 'Fék', services: [['fekall', 'Fék beállítása', 2500, 15], ['betet', 'Fékbetét csere (párban)', 3000, 15], ['bowden', 'Fékbowden csere', 3500, 25]] },
  lanc: { name: 'Lánc', services: [['tisztit', 'Lánctisztítás, olajozás', 2500, 20], ['lanccsere', 'Lánccsere', 3000, 15]] },
  valto: { name: 'Váltó', services: [['valtoall', 'Váltó beállítása', 3000, 20], ['valtobowden', 'Váltóbowden csere', 3500, 25]] },
  kormany: { name: 'Kormány', services: [['kormanycsap', 'Kormánycsapágy beállítása', 3500, 25], ['markolat', 'Markolatcsere', 2000, 10]] },
}

export const PACKAGES = [
  { id: 'atnezes', name: 'Tavaszi átvizsgálás', price: 9900, minutes: 60, note: 'fék, váltó, lánc, kerekek beállítva, minden csavar meghúzva' },
  { id: 'nagy', name: 'Nagyszerviz', price: 24900, minutes: 180, note: 'szétszedve, tisztítva, csapágyak zsírozva, minden beállítva' },
]

const SERVICE = Object.fromEntries(Object.entries(PARTS).flatMap(([part, p]) => p.services.map(([id, name, price, minutes]) => [id, { id, part, name, price, minutes }])))
export const service = (id) => SERVICE[id] ?? PACKAGES.find((p) => p.id === id)

/** A munkalap összege és ideje. Csomag mellett a beállítás és tisztítás benne van, csak a csere számít külön. */
export function workOrder(ids) {
  const items = [...new Set(ids)].map(service).filter(Boolean)
  const pkgs = items.filter((i) => PACKAGES.includes(i))
  const pkg = pkgs.sort((a, b) => b.price - a.price)[0] // két csomagból a nagyobb marad
  const extra = items.filter((i) => !PACKAGES.includes(i) && (!pkg || !/beállítása|tisztítás/.test(i.name)))
  const all = pkg ? [pkg, ...extra] : extra
  return { items: all, price: all.reduce((s, i) => s + i.price, 0), minutes: all.reduce((s, i) => s + i.minutes, 0) }
}

/** Ennyi percnyi munkát vállalunk egy napra. */
export const DAY_CAPACITY = 360
const fromIso = (s) => new Date(`${s}T12:00:00Z`)
const iso = (d) => d.toISOString().slice(0, 10)
function hash(s) {
  let h = 2166136261
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  return h >>> 0
}

/** A következő `n` nyitvanap (hétfő-szombat) szabad perceivel; a közeli napok teltebbek. */
export function dropDays(fromIsoDay, n = 6) {
  const out = []
  for (let i = 1; out.length < n && i < 30; i++) {
    const d = new Date(fromIso(fromIsoDay).getTime() + i * 86400000)
    if (d.getUTCDay() === 0) continue
    const busy = Math.min(DAY_CAPACITY, Math.round(DAY_CAPACITY * Math.max(0.15, 0.9 - out.length * 0.15)) + (hash(iso(d)) % 60))
    out.push({ date: iso(d), free: DAY_CAPACITY - busy, saturday: d.getUTCDay() === 6 })
  }
  return out
}

/** Belefér-e a munka a napba; szombaton csak délig dolgozunk, oda legfeljebb egyórás munka fér. */
export const fits = (day, minutes) => minutes > 0 && day.free >= minutes && (!day.saturday || minutes <= 60)
