import '@fontsource/anton/400.css'
import '@fontsource/rubik/400.css'
import '@fontsource/rubik/600.css'
import './style.css'
import { ADDONS, barWeight, classesFor, loadOrder, monthly, TERMS, trialProblems } from './plates.js'

const $ = (id) => document.getElementById(id)
const NS = 'http://www.w3.org/2000/svg'
const ft = (n) => `${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} Ft`
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches

// Plate pickers: one disc per add-on, in its bumper colour. Two common extras start loaded.
const DEFAULTS = ['csoport', 'szauna']
$('plate-picks').innerHTML = ADDONS.map(
  (a) => `<label class="pick" style="--plate:${a.color}">
    <input type="checkbox" name="addon" value="${a.id}" ${DEFAULTS.includes(a.id) ? "checked" : ""} />
    <span class="disc" aria-hidden="true"><b>${a.kg}</b></span>
    <span class="pick-name">${a.name}</span>
    <span class="pick-price">+${ft(a.price)}</span>
  </label>`,
).join('')

// Plate geometry: thickness grows with weight, 5 kg is a smaller disc.
const THICK = { 25: 30, 20: 26, 15: 21, 10: 16, 5: 12 }
const drawn = new Map()

function paintBar(ids) {
  const keep = new Set()
  for (const side of ['left', 'right']) {
    let edge = side === 'left' ? 236 : 564
    for (const a of loadOrder(ids)) {
      const key = `${side}-${a.id}`
      keep.add(key)
      const w = THICK[a.kg]
      const h = a.kg === 5 ? 110 : 190
      const x = side === 'left' ? edge - w : edge
      edge = side === 'left' ? edge - w - 2 : edge + w + 2
      let g = drawn.get(key)
      if (!g) {
        g = document.createElementNS(NS, 'g')
        g.setAttribute('class', `plate ${side}${reduce ? '' : ' load'}`)
        g.innerHTML = `<rect width="${w}" height="${h}" y="${110 - h / 2}" rx="4" fill="${a.color}"/><rect x="${w / 2 - 1}" y="${110 - h / 2 + 10}" width="2" height="${h - 20}" fill="rgb(0 0 0 / 0.18)"/>`
        $(`plates-${side}`).append(g)
        drawn.set(key, g)
        g.addEventListener('animationend', () => g.classList.remove('load'), { once: true })
      }
      g.style.setProperty('--x', `${x}px`)
    }
  }
  for (const [key, g] of drawn) {
    if (keep.has(key)) continue
    drawn.delete(key)
    if (reduce) g.remove()
    else {
      g.classList.add('unload')
      g.addEventListener('animationend', () => g.remove(), { once: true })
    }
  }
}

const builder = $('builder')
function selected() {
  return [...builder.querySelectorAll('input[name="addon"]:checked')].map((b) => b.value)
}
function term() {
  return builder.querySelector('input[name="term"]:checked').value
}

let lastCount = 0
function paint() {
  const ids = selected()
  paintBar(ids)
  $('kg').textContent = `${barWeight(ids)} kg`
  $('price').textContent = ft(monthly(ids, term()))
  if (!reduce && ids.length > lastCount) {
    const rack = document.querySelector('.rack')
    rack.classList.remove('thud')
    void rack.offsetWidth // restart the thud
    rack.classList.add('thud')
  }
  lastCount = ids.length
}
builder.addEventListener('change', paint)
paint()

// Today's classes: past ones are shut, the rest can be joined while spots last.
const DAYS = ['Vasárnap', 'Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat']
const MONTHS = ['január', 'február', 'március', 'április', 'május', 'június', 'július', 'augusztus', 'szeptember', 'október', 'november', 'december']
const minutes = (t) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3))
const now = new Date()
let nowMin = now.getHours() * 60 + now.getMinutes()
let day = now
// Once today's last class has started, show tomorrow instead of a list of closed rows.
if (classesFor(now).every((c) => minutes(c.time) <= nowMin)) {
  day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  nowMin = -1
  $('classes-title').textContent = 'Holnap az órákon'
}
$('classes-day').textContent = `${DAYS[day.getDay()]}, ${MONTHS[day.getMonth()]} ${day.getDate()}. A helyek száma élő.`
const classes = classesFor(day)
const joined = new Set()

function paintClasses() {
  $('timetable').innerHTML = classes
    .map((c) => {
      const past = minutes(c.time) <= nowMin
      const inIt = joined.has(c.id)
      const free = c.free - (inIt ? 1 : 0)
      const state = past ? 'Elmúlt' : inIt ? 'Benne vagy' : free === 0 ? 'Tele' : 'Beírom magam'
      const dots = Array.from({ length: c.cap }, (_, i) => `<i class="${i < c.cap - free ? 'full' : ''}"></i>`).join('')
      return `<li class="${past ? 'past' : ''}${inIt ? ' in' : ''}">
        <time>${c.time}</time>
        <span class="class-name">${c.name}</span>
        <span class="spots" aria-hidden="true">${dots}</span>
        <span class="free">${past ? '' : `${free} szabad hely`}</span>
        <button class="slam slam-small" type="button" data-class="${c.id}" ${past || (free === 0 && !inIt) ? 'disabled' : ''} aria-pressed="${inIt}">${state}</button>
      </li>`
    })
    .join('')
}
$('timetable').addEventListener('click', (e) => {
  const b = e.target.closest('[data-class]')
  if (!b) return
  const id = b.dataset.class
  if (joined.has(id)) joined.delete(id)
  else joined.add(id)
  paintClasses()
  $('timetable').querySelector(`[data-class="${id}"]`).focus()
})
paintClasses()

// Free trial: carries the membership the visitor built, if any.
const form = $('trial-form')
const status = $('form-status')
const attached = $('attached')
document.querySelectorAll('a[href="#proba"]').forEach((a) =>
  a.addEventListener('click', () => {
    const ids = selected()
    attached.hidden = ids.length === 0
    attached.textContent = `Ezt a bérletet raktad össze: ${ids.length} extra, ${TERMS[term()].name.toLowerCase()}, ${ft(monthly(ids, term()))} / hó`
  }),
)

form.addEventListener('submit', (e) => {
  e.preventDefault()
  status.hidden = true
  const found = trialProblems(Object.fromEntries(new FormData(form)))
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
  if (first) return first.focus()
  status.hidden = false
  status.textContent = `Megvan, ${form.elements.when.value.toLowerCase()} várunk. Ez a bemutató nem küld jelentkezést; élesben egy edző hívna vissza, hogy egyeztessetek.`
  form.elements.name.value = ''
  form.elements.phone.value = ''
})
