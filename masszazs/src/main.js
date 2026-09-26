import '@fontsource/sora/300.css'
import '@fontsource/sora/600.css'
import '@fontsource/manrope/400.css'
import '@fontsource/manrope/600.css'
import './style.css'
import { bookingProblems, freeSlots, recommend, TREATMENTS, ZONES } from './therapy.js'

const $ = (id) => document.getElementById(id)
const ft = (n) => `${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} Ft`
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
const DAYS = ['vasárnap', 'hétfő', 'kedd', 'szerda', 'csütörtök', 'péntek', 'szombat']
const MONTHS = ['jan.', 'febr.', 'márc.', 'ápr.', 'máj.', 'jún.', 'júl.', 'aug.', 'szept.', 'okt.', 'nov.', 'dec.']

// Breathing cue: 4 seconds in, 6 out, in step with the ring animation.
const cue = $('cue')
if (reduce) cue.textContent = 'Lélegezzen lassan'
else {
  let inhale = true
  const tick = () => {
    cue.textContent = inhale ? 'Belégzés' : 'Kilégzés'
    setTimeout(tick, inhale ? 4000 : 6000)
    inhale = !inhale
  }
  tick()
}

// Body map: SVG zones and the chip checkboxes mirror each other.
const chips = $('chips')
chips.insertAdjacentHTML(
  'beforeend',
  Object.entries(ZONES)
    .map(([k, label]) => `<label class="chip"><input type="checkbox" name="zone" value="${k}" /><span>${label}</span></label>`)
    .join(''),
)
const boxes = [...chips.querySelectorAll('input')]
const body = $('body')

body.addEventListener('click', (e) => {
  const zone = e.target.closest('.zone')
  if (!zone) return
  const box = boxes.find((b) => b.value === zone.dataset.zone)
  box.checked = !box.checked
  paintMap()
})
chips.addEventListener('change', paintMap)
document.querySelectorAll('input[name="level"]').forEach((r) => r.addEventListener('change', paintMap))

let recKey = 'svedRelax'
function paintMap() {
  const zones = boxes.filter((b) => b.checked).map((b) => b.value)
  for (const g of body.querySelectorAll('.zone')) g.classList.toggle('hot', zones.includes(g.dataset.zone))
  const level = Number(document.querySelector('input[name="level"]:checked').value)
  body.style.setProperty('--heat', level)
  const { key, why } = recommend(zones, level)
  const t = TREATMENTS[key]
  const rec = $('rec')
  if (key !== recKey && !reduce) {
    rec.classList.remove('swap')
    void rec.offsetWidth // restart the settle animation
    rec.classList.add('swap')
  }
  recKey = key
  $('rec-name').textContent = t.name
  $('rec-why').textContent = why
  $('rec-min').textContent = `${t.minutes} perc`
  $('rec-price').textContent = ft(t.price)
}
paintMap()

// Price list: each treatment's pebble grows with its length.
$('menu').innerHTML = Object.entries(TREATMENTS)
  .map(
    ([k, t]) => `<li style="--m:${t.minutes}">
      <span class="dot" aria-hidden="true"><b>${t.minutes}</b>perc</span>
      <span class="menu-name">${t.name}</span>
      <span class="menu-price">${ft(t.price)}</span>
      <button class="pebble pebble-small" type="button" data-pick="${k}">Foglalás</button>
    </li>`,
  )
  .join('')

// Booking
const select = $('treatment')
select.innerHTML = Object.entries(TREATMENTS)
  .map(([k, t]) => `<option value="${k}">${t.name}, ${t.minutes} perc, ${ft(t.price)}</option>`)
  .join('')

function pick(key) {
  select.value = key
  paintSlots()
  $('foglalas').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' })
}
$('rec-book').addEventListener('click', (e) => {
  e.preventDefault()
  pick(recKey)
})
$('menu').addEventListener('click', (e) => {
  const b = e.target.closest('[data-pick]')
  if (b) pick(b.dataset.pick)
})

const pad = (n) => String(n).padStart(2, '0')
function paintSlots() {
  const slots = freeSlots(new Date(), TREATMENTS[select.value].minutes, 8)
  let lastDay = ''
  $('slots').innerHTML = slots
    .map((s, i) => {
      const day = `${DAYS[s.getDay()]}, ${MONTHS[s.getMonth()]} ${s.getDate()}.`
      const head = day !== lastDay ? `<p class="slot-day">${day}</p>` : ''
      lastDay = day
      const iso = `${s.getFullYear()}-${pad(s.getMonth() + 1)}-${pad(s.getDate())}T${pad(s.getHours())}:${pad(s.getMinutes())}`
      return `${head}<label class="slot" style="--i:${i}"><input type="radio" name="slot" value="${iso}" data-label="${day} ${s.getHours()}:${pad(s.getMinutes())}" /><span>${s.getHours()}:${pad(s.getMinutes())}</span></label>`
    })
    .join('')
}
select.addEventListener('change', paintSlots)
paintSlots()

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
  status.textContent = `Lefoglalva: ${TREATMENTS[data.treatment].name}, ${chosen.dataset.label}. Ez a bemutató nem küld foglalást; élesben SMS-ben emlékeztetnénk előtte való nap.`
  chosen.closest('.slot').classList.add('taken')
  chosen.disabled = true
  chosen.checked = false
  form.elements.name.value = ''
  form.elements.phone.value = ''
})
