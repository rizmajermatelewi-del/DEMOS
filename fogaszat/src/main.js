import '@fontsource/onest/400.css'
import '@fontsource/onest/700.css'
import '@fontsource/atkinson-hyperlegible/400.css'
import '@fontsource/atkinson-hyperlegible/700.css'
import './style.css'
import { bookingProblems, emergencySlot, SHADES, whiteningQuote } from './shade.js'

const $ = (id) => document.getElementById(id)
const ft = (n) => `${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} Ft`
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
const DAYS = ['vasárnap', 'hétfő', 'kedd', 'szerda', 'csütörtök', 'péntek', 'szombat']
const MONTHS = ['jan.', 'febr.', 'márc.', 'ápr.', 'máj.', 'jún.', 'júl.', 'aug.', 'szept.', 'okt.', 'nov.', 'dec.']

// Next emergency slot
const e = emergencySlot()
const hhmm = `${Math.floor(e.minutes / 60)}:${String(e.minutes % 60).padStart(2, '0')}`
$('emergency').textContent = e.today ? `ma ${hhmm}` : `${DAYS[e.date.getDay()]}, ${MONTHS[e.date.getMonth()]} ${e.date.getDate()}., ${hhmm}`

// Shade guide
const from = $('from')
const to = $('to')
const guide = $('guide')
guide.innerHTML = SHADES.map(
  (s, i) => `<li><button type="button" data-i="${i}" style="--shade:${s.color}" aria-label="${s.code}"><span class="tab"></span><b>${s.code}</b></button></li>`,
).join('')

let showing = 'to'
function paintShade(pulse) {
  // The target can only be lighter than, or the same as, today's shade.
  if (Number(to.value) > Number(from.value)) to.value = from.value
  const f = Number(from.value)
  const t = Number(to.value)
  $('from-out').textContent = SHADES[f].code
  $('to-out').textContent = SHADES[t].code
  $('teeth').style.fill = SHADES[showing === 'from' ? f : t].color
  for (const b of guide.querySelectorAll('button')) {
    const i = Number(b.dataset.i)
    b.classList.toggle('is-from', i === f)
    b.classList.toggle('is-to', i === t)
    b.classList.toggle('between', i > t && i < f)
    b.setAttribute('aria-pressed', i === t)
  }
  const q = whiteningQuote(f, t)
  $('plan-main').innerHTML = q.sessions
    ? `${SHADES[f].code} → ${SHADES[t].code}: <b>${q.sessions} alkalom</b>, kb. <b>${ft(q.total)}</b>`
    : 'Ez a mostani színe, ehhez nem kell fehérítés.'
  if (pulse && !reduce) {
    const smile = $('smile')
    smile.classList.remove('polish')
    void smile.getBoundingClientRect() // restart the glare
    smile.classList.add('polish')
  }
}
from.addEventListener('input', () => {
  showing = 'from'
  paintShade(false)
})
to.addEventListener('input', () => {
  showing = 'to'
  paintShade(true)
})
guide.addEventListener('click', (ev) => {
  const b = ev.target.closest('[data-i]')
  if (!b) return
  const i = Number(b.dataset.i)
  // A tab lighter than today sets the goal; a darker one moves today's shade.
  if (i <= Number(from.value)) {
    to.value = i
    showing = 'to'
  } else {
    from.value = i
    showing = 'from'
  }
  paintShade(showing === 'to')
})
paintShade(false)

// Booking, with the whitening plan attached when it came from there
const form = $('booking-form')
const status = $('form-status')
const attached = $('attached')
$('plan-book').addEventListener('click', () => {
  const f = Number(from.value)
  const t = Number(to.value)
  const q = whiteningQuote(f, t)
  if (!q.sessions) return
  attached.textContent = `Fehérítési terv: ${SHADES[f].code} → ${SHADES[t].code}, ${q.sessions} alkalom, kb. ${ft(q.total)}`
  attached.hidden = false
  form.querySelector('input[value="feherites"]').checked = true
})

form.addEventListener('submit', (ev) => {
  ev.preventDefault()
  status.hidden = true
  const data = Object.fromEntries(new FormData(form))
  const found = bookingProblems(data)
  let first = null
  for (const id of ['name', 'phone']) {
    const input = form.elements[id]
    const slot = $(`${id}-error`)
    input.setAttribute('aria-invalid', found[id] ? 'true' : 'false')
    if (found[id]) input.setAttribute('aria-describedby', `${id}-error`)
    else input.removeAttribute('aria-describedby')
    slot.hidden = !found[id]
    slot.textContent = found[id] || ''
  }
  $('reason-error').hidden = !found.reason
  $('reason-error').textContent = found.reason || ''
  if (found.reason) first = form.querySelector('input[name="reason"]')
  else if (found.name) first = form.elements.name
  else if (found.phone) first = form.elements.phone
  if (first) return first.focus()
  const calm = data.nervous ? ' Az első alkalommal csak beszélgetünk és megnézzük, kezelés nélkül.' : ''
  status.hidden = false
  status.textContent = `Köszönjük, visszahívjuk.${calm} Ez a bemutató nem küld üzenetet; élesben egy munkanapon belül telefonálnánk.`
  form.elements.name.value = ''
  form.elements.phone.value = ''
})
