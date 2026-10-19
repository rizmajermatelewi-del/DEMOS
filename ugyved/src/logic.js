// Dr. Halmi Ügyvédi Iroda: ügytípusok, díjbecslés, „hozza magával” lista, konzultáció. Minden adat kitalált mintaadat.

export const CASES = {
  ingatlan: {
    name: 'Ingatlan adásvétel', time: '2–4 hét a földhivatali bejegyzésig',
    what: 'Szerződést írunk, ellenjegyezzük, és intézzük a földhivatali bejegyzést.',
    fee: { kind: 'percent', rate: 0.008, min: 80000, label: 'a vételár 0,8%-a, legalább 80 000 Ft' },
    docs: ['Személyi igazolvány és lakcímkártya', 'Adóazonosító jel', 'Tulajdoni lap (mi is lekérjük)', 'Hitel esetén a bank elvi igazolása', 'Előszerződés vagy foglalónál az átvételi elismervény'],
  },
  orokles: {
    name: 'Öröklés, hagyaték', time: '2–6 hónap, a közjegyzőtől függ',
    what: 'Képviseljük a hagyatéki eljárásban, végrendeletet írunk vagy vizsgálunk.',
    fee: { kind: 'fixed', amount: 120000, label: 'átalánydíj, 120 000 Ft-tól' },
    docs: ['Személyi igazolvány és lakcímkártya', 'Halotti anyakönyvi kivonat', 'Végrendelet, ha van', 'Az ingatlanok tulajdoni lapja vagy helyrajzi száma', 'Bankszámlák, értékpapírok listája'],
  },
  valas: {
    name: 'Válás, gyermekelhelyezés', time: '3–12 hónap',
    what: 'Közös megegyezéses válásnál megállapodást készítünk, vitás ügyben képviseljük a bíróságon.',
    fee: { kind: 'fixed', amount: 150000, label: 'közös megegyezéssel 150 000 Ft-tól' },
    docs: ['Házassági anyakönyvi kivonat', 'Gyermekek születési anyakönyvi kivonata', 'Jövedelemigazolás', 'Közös vagyon listája (ingatlan, autó, számlák)'],
  },
  munka: {
    name: 'Munkajogi vita', time: '1–6 hónap',
    what: 'Felmondás, elmaradt bér, végkielégítés: megnézzük, mi jár, és tárgyalunk vagy perelünk.',
    fee: { kind: 'fixed', amount: 60000, label: 'első lépésként felszólító levél: 60 000 Ft' },
    docs: ['Munkaszerződés és módosításai', 'Felmondás vagy a vitatott irat', 'Bérjegyzékek az utolsó 6 hónapból', 'E-mailek, üzenetek, ami az ügyről szól'],
  },
  ceg: {
    name: 'Cégalapítás', time: '1–3 munkanap',
    what: 'Társasági szerződés, elektronikus cégbejegyzés, székhely és tényleges tulajdonos bejelentése.',
    fee: { kind: 'fixed', amount: 70000, label: 'Kft. alapítás 70 000 Ft + 50 000 Ft illeték' },
    docs: ['A tagok személyi igazolványa és lakcímkártyája', 'Adóazonosító jelek', 'A székhely használatára jogosító irat', 'A tevékenységi körök listája'],
  },
  szerzodes: {
    name: 'Szerződés átnézése', time: '2–5 munkanap',
    what: 'Átnézzük, mielőtt aláírja: megmondjuk, mi a kockázat, és mit érdemes visszaírni.',
    fee: { kind: 'fixed', amount: 35000, label: 'oldalszámtól függően 35 000 Ft-tól' },
    docs: ['A szerződés tervezete', 'A korábbi levelezés a másik féllel', 'Ha van, a kapcsolódó korábbi szerződés'],
  },
}

const round1000 = (n) => Math.round(n / 1000) * 1000

/** A becsült munkadíj; az ingatlannál a vételárból. Érvénytelen vételár: null. */
export function feeFor(caseId, price) {
  const f = CASES[caseId]?.fee
  if (!f) return null
  if (f.kind === 'fixed') return f.amount
  const p = Number(price)
  if (!Number.isFinite(p) || p <= 0) return null
  return Math.max(f.min, round1000(p * f.rate))
}

/** Hány irat van meg a listából. */
export const docsProgress = (caseId, have) => {
  const docs = CASES[caseId]?.docs ?? []
  const n = docs.filter((d) => have.has(d)).length
  return { have: n, total: docs.length, ready: docs.length > 0 && n === docs.length }
}

export const CONSULT = { minutes: 30, price: 15000 }

function hash(s) {
  let h = 2166136261
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  return h >>> 0
}
/** Konzultációs időpontok a következő `n` munkanapra; kedden és csütörtökön 18 óráig. */
export function consultSlots(from, n = 4) {
  const out = []
  for (let i = 1; out.length < n && i < 21; i++) {
    const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + i)
    if (d.getDay() === 0 || d.getDay() === 6) continue
    const late = d.getDay() === 2 || d.getDay() === 4
    const times = []
    for (let m = 9 * 60; m + 30 <= (late ? 18 : 16) * 60; m += 30) if (hash(`${d.toDateString()}|${m}`) % 3 === 0) times.push(m)
    out.push({ date: d, times: times.slice(0, 6) })
  }
  return out
}
