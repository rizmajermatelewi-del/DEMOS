/** Monthly fee lines for the calculator. Prices are the demo's own list, net of VAT. */
export const FORMS = {
  atalany: { label: 'Egyéni vállalkozó, átalányadó', base: 16000 },
  ev: { label: 'Egyéni vállalkozó, vállalkozói szja', base: 24000 },
  kft: { label: 'Kft. vagy Bt., kettős könyvvitel', base: 42000 },
}
export const INCLUDED_DOCS = 20
export const PER_DOC = 250
export const PER_EMPLOYEE = 6000
export const VAT_RETURN = 8000

/** The tape: one line per cost, then the total. */
export function feeLines({ form = 'atalany', docs = 0, employees = 0, vat = false } = {}) {
  const f = FORMS[form] ?? FORMS.atalany
  const lines = [{ key: 'base', label: f.label, amount: f.base }]
  const extra = Math.max(0, docs - INCLUDED_DOCS)
  if (extra) lines.push({ key: 'docs', label: `${extra} bizonylat ${INCLUDED_DOCS} fölött`, amount: extra * PER_DOC })
  if (employees > 0) lines.push({ key: 'emp', label: `Bérszámfejtés, ${employees} fő`, amount: employees * PER_EMPLOYEE })
  if (vat) lines.push({ key: 'vat', label: 'Havi ÁFA-bevallás', amount: VAT_RETURN })
  return { lines, total: lines.reduce((sum, l) => sum + l.amount, 0) }
}

/** 12 400 -> "12 400" with a thin space, the way a printing calculator groups digits. */
export function ft(n) {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

// Recurring filing dates. month: null = every month.
const DUE = [
  { day: 12, month: null, label: 'Járulékbevallás és befizetés' },
  { day: 20, month: null, label: 'Havi ÁFA-bevallás' },
  { day: 20, month: 5, label: 'Egyéni vállalkozók szja-bevallása' },
  { day: 31, month: 5, label: 'Beszámoló és társasági adó' },
]

// ponytail: weekends only; a public holiday on a due date needs a holiday list.
function workday(d) {
  const out = new Date(d)
  while (out.getDay() === 0 || out.getDay() === 6) out.setDate(out.getDate() + 1)
  return out
}

/** The next `count` due dates from `now` (inclusive of today), soonest first. */
export function nextDeadlines(now = new Date(), count = 4) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const found = []
  for (let m = 0; m < 14; m++) {
    const year = today.getFullYear() + Math.floor((today.getMonth() + m) / 12)
    const month = (today.getMonth() + m) % 12
    for (const d of DUE) {
      if (d.month !== null && d.month !== month + 1) continue
      const date = workday(new Date(year, month, d.day))
      if (date < today) continue
      found.push({ date, label: d.label, days: Math.round((date - today) / 86400000) })
    }
  }
  return found.sort((a, b) => a.date - b.date).slice(0, count)
}

/** Field errors for the contact form. */
export function contactProblems(data) {
  const next = {}
  if (String(data.name ?? '').trim().length < 2) next.name = 'Kérjük, írja be a nevét.'
  const contact = String(data.contact ?? '').trim()
  const isMail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)
  const isPhone = contact.replace(/\D/g, '').length >= 8
  if (!isMail && !isPhone) next.contact = 'Egy e-mail-cím vagy telefonszám kell.'
  return next
}
