import '@fontsource/familjen-grotesk/500.css'
import '@fontsource/familjen-grotesk/700.css'
import '@fontsource/onest/400.css'
import '@fontsource/onest/500.css'
import './style.css'
import { AREAS, bookingProblems, composeSession, freeSlots, huDate, MINUTES, priceFor, voucherExpiry } from './therapy.js'

const $ = (id) => document.getElementById(id)
const ft = (n) => `${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} Ft`
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
const DAYS = ['vasárnap', 'hétfő', 'kedd', 'szerda', 'csütörtök', 'péntek', 'szombat']
const MONTHS = ['jan.', 'febr.', 'márc.', 'ápr.', 'máj.', 'jún.', 'júl.', 'aug.', 'szept.', 'okt.', 'nov.', 'dec.']
const pad = (n) => String(n).padStart(2, '0')
const clock = (m) => `${Math.floor(m / 60)}:${pad(m % 60)}`

/** A row of radio buttons, one per session length. */
function minuteRadios(el, name, checked) {
  el.innerHTML = MINUTES.map(
    (m) => `<label class="minute"><input type="radio" name="${name}" value="${m}"${m === checked ? ' checked' : ''} /><span><b>${m}</b>perc</span></label>`,
  ).join('')
}

// The composer
let minutes = 60
let picked = []
minuteRadios($('minute-row'), 'minutes', minutes)
$('area-row').innerHTML = AREAS.map(
  (a) => `<button type="button" class="area" data-area="${a.id}" aria-pressed="false" style="--c:${a.color}"><i aria-hidden="true"></i>${a.name}</button>`,
).join('')

function paintPlan() {
  const plan = composeSession(minutes, picked)
  $('plan-min').textContent = `${minutes} perc`
  $('plan-price').textContent = ft(priceFor(minutes))
  const warn = $('plan-warn')
  if (!plan.fits) {
    warn.hidden = false
    warn.innerHTML = `Ennyi területre ${minutes} perc kevés. <button type="button" class="link" data-need="${plan.need}">Legyen ${plan.need} perc</button>, vagy vegyél ki egyet.`
    $('strip').innerHTML = ''
    $('plan-book').setAttribute('aria-disabled', 'true')
    return
  }
  warn.hidden = true
  $('plan-book').removeAttribute('aria-disabled')
  let at = 0
  $('strip').innerHTML = plan.parts
    .map((p) => {
      const from = at
      at += p.minutes
      return `<li style="--c:${p.color}; --m:${p.minutes}"><span class="seg-time">${clock(from)}</span><span class="seg-name">${p.name}</span><span class="seg-min">${p.minutes} perc</span></li>`
    })
    .join('')
  paintSlots()
}

$('minute-row').addEventListener('change', (e) => {
  minutes = Number(e.target.value)
  paintPlan()
})
$('area-row').addEventListener('click', (e) => {
  const b = e.target.closest('[data-area]')
  if (!b) return
  const id = b.dataset.area
  picked = picked.includes(id) ? picked.filter((x) => x !== id) : [...picked, id]
  b.setAttribute('aria-pressed', String(picked.includes(id)))
  paintPlan()
})
$('plan-warn').addEventListener('click', (e) => {
  const b = e.target.closest('[data-need]')
  if (!b) return
  minutes = Number(b.dataset.need)
  document.querySelector(`input[name="minutes"][value="${minutes}"]`).checked = true
  paintPlan()
})
$('plan-book').addEventListener('click', (e) => {
  e.preventDefault()
  if ($('plan-book').getAttribute('aria-disabled')) return
  $('foglalas').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
})

// Booking: the free slots follow the length chosen above.
function paintSlots() {
  const areas = picked.length ? AREAS.filter((a) => picked.includes(a.id)).map((a) => a.name.toLowerCase()).join(', ') : 'egész test'
  $('booking-for').textContent = `${minutes} perc (${areas}), ${ft(priceFor(minutes))}. Ezekbe az időpontokba belefér, zárás előtt végzünk.`
  let lastDay = ''
  $('slots').innerHTML = freeSlots(new Date(), minutes, 10)
    .map((s) => {
      const day = `${DAYS[s.getDay()]}, ${MONTHS[s.getMonth()]} ${s.getDate()}.`
      const head = day !== lastDay ? `<p class="slot-day">${day}</p>` : ''
      lastDay = day
      const iso = `${s.getFullYear()}-${pad(s.getMonth() + 1)}-${pad(s.getDate())}T${pad(s.getHours())}:${pad(s.getMinutes())}`
      const label = `${s.getHours()}:${pad(s.getMinutes())}`
      return `${head}<label class="slot"><input type="radio" name="slot" value="${iso}" data-label="${day} ${label}" /><span>${label}</span></label>`
    })
    .join('')
}

const form = $('booking-form')
const status = $('form-status')
function show(found) {
  let first = null
  for (const id of ['name', 'phone']) {
    const input = form.elements[id]
    const slot = $(`${id}-error`)
    input.setAttribute('aria-invalid', found[id] ? 'true' : 'false')
    if (found[id]) input.setAttribute('aria-describedby', `${id}-error`)
    else input.removeAttribute('aria-describedby')
    slot.hidden = !found[id]
    slot.textContent = found[id] || ''
    if (found[id] && !first) first = input
  }
  $('slot-error').hidden = !found.slot
  $('slot-error').textContent = found.slot || ''
  return found.slot ? form.querySelector('input[name="slot"]') : first
}
form.addEventListener('submit', (e) => {
  e.preventDefault()
  status.hidden = true
  const data = Object.fromEntries(new FormData(form))
  const first = show(bookingProblems(data))
  if (first) return first.focus()
  const chosen = form.querySelector('input[name="slot"]:checked')
  status.hidden = false
  status.textContent = `Lefoglalva: ${minutes} perc, ${chosen.dataset.label}, ${ft(priceFor(minutes))}. Ez a bemutató nem küld foglalást; élesben SMS-ben emlékeztetnénk előtte való nap.`
  chosen.closest('.slot').classList.add('taken')
  chosen.disabled = true
  chosen.checked = false
  form.elements.name.value = ''
  form.elements.phone.value = ''
})

// Voucher: minutes, not a treatment.
let vMinutes = 60
minuteRadios($('v-minutes'), 'v-minutes', vMinutes)
function paintVoucher() {
  $('v-min').textContent = vMinutes
  $('v-to-out').textContent = $('v-to').value.trim() || 'Neked'
  $('v-note-out').textContent = $('v-note').value.trim()
  $('v-price').textContent = ft(priceFor(vMinutes))
  $('v-expiry').textContent = `Érvényes: ${huDate(voucherExpiry())}`
  $('v-bar').style.setProperty('--fill', `${(vMinutes / 120) * 100}%`)
}
$('v-minutes').addEventListener('change', (e) => {
  vMinutes = Number(e.target.value)
  paintVoucher()
})
for (const id of ['v-to', 'v-note']) $(id).addEventListener('input', paintVoucher)

paintPlan()
paintVoucher()
