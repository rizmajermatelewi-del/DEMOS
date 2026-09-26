import '@fontsource/cormorant-garamond/600.css'
import '@fontsource/cormorant-garamond/600-italic.css'
import '@fontsource/karla/400.css'
import '@fontsource/karla/600.css'
import './style.css'
import { arrange, FLOWERS, orderProblems, pickupDays, price, setCount, stemCount, WRAPS } from './bouquet.js'

const $ = (id) => document.getElementById(id)
const NS = 'http://www.w3.org/2000/svg'
const ft = (n) => `${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} Ft`
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches

// Flower heads, drawn around 0,0. Simple shapes so the bouquet reads at a glance.
function head(id, color) {
  switch (id) {
    case 'rozsa':
      return `<circle r="10" fill="${color}"/><path d="M-5 1a5 5 0 1 1 6 4.5M-2 0a2.6 2.6 0 1 1 3 2" fill="none" stroke="#6e0f18" stroke-width="1.5" stroke-linecap="round"/>`
    case 'tulipan':
      return `<path d="M-7-1Q-8-12-3-13L0-7 3-13Q8-12 7-1Q6 8 0 8Q-6 8-7-1Z" fill="${color}"/><path d="M0-7V6" stroke="#c4552a" stroke-width="1.2"/>`
    case 'gerbera': {
      const petals = Array.from({ length: 14 }, (_, i) => `<ellipse rx="3" ry="8.5" transform="rotate(${i * 25.7}) translate(0 -8)" fill="${color}"/>`).join('')
      return `${petals}<circle r="4.6" fill="#5b3a12"/>`
    }
    case 'liziantusz':
      return `<circle cx="-4" cy="1" r="7" fill="${color}"/><circle cx="4" cy="1" r="7" fill="#b9a3dd"/><circle cy="-4" r="7" fill="#c7b6e6"/><circle r="2.4" fill="#e9f0c9"/>`
    case 'eukaliptusz':
      return `<g fill="${color}"><circle cx="-6" cy="4" r="4.6"/><circle cx="5" cy="-1" r="4.6"/><circle cx="-3" cy="-7" r="4"/><circle cx="3" cy="-12" r="3.4"/></g>`
    default:
      return `<g fill="${color}" stroke="#b9b7ab" stroke-width="0.6"><circle cx="-5" cy="-3" r="2.3"/><circle cx="1" cy="-7" r="2.3"/><circle cx="6" cy="-2" r="2.3"/><circle cx="-1" cy="1" r="2.3"/><circle cx="-7" cy="4" r="2.1"/><circle cx="4" cy="5" r="2.1"/><circle cx="0" cy="-12" r="2"/></g>`
  }
}

// The buckets
let counts = {}
const stock = $('stock')
stock.innerHTML = FLOWERS.map(
  (f) => `
  <li class="bucket" data-id="${f.id}">
    <svg class="bud" viewBox="-15 -15 30 30" aria-hidden="true"><g>${head(f.id, f.color)}</g></svg>
    <p class="bucket-name">${f.name} <i>${f.latin}</i></p>
    <p class="bucket-meta">${ft(f.price)} / szál<br /><span class="left" id="left-${f.id}"></span></p>
    <div class="step">
      <button type="button" data-id="${f.id}" data-step="-1" aria-label="Egy szál ${f.name.toLowerCase()} ki">−</button>
      <output id="n-${f.id}" aria-live="polite">0</output>
      <button type="button" data-id="${f.id}" data-step="1" aria-label="Egy szál ${f.name.toLowerCase()} be">+</button>
    </div>
  </li>`,
).join('')

stock.addEventListener('click', (e) => {
  const b = e.target.closest('[data-step]')
  if (!b) return
  const { id } = b.dataset
  counts = setCount(counts, id, (counts[id] ?? 0) + Number(b.dataset.step))
  $('stems-error').hidden = true
  paint()
})

// The bouquet: keyed stems glide to their new place, new ones grow in.
const stemsG = $('stems')
const drawn = new Map()
const colorOf = Object.fromEntries(FLOWERS.map((f) => [f.id, f.color]))
const BASE = { x: 150, y: 296 }

function paintBouquet() {
  const seen = new Map()
  const keep = new Set()
  for (const s of arrange(counts)) {
    const k = (seen.get(s.id) ?? 0) + 1
    seen.set(s.id, k)
    const key = `${s.id}-${k}`
    keep.add(key)
    let g = drawn.get(key)
    if (!g) {
      g = document.createElementNS(NS, 'g')
      g.setAttribute('class', reduce ? 'stem' : 'stem grow')
      g.innerHTML = `<line x1="${BASE.x}" y1="${BASE.y}" x2="${BASE.x}" stroke="#5e7a4f" stroke-width="2" stroke-linecap="round"/><g class="head">${head(s.id, colorOf[s.id])}</g>`
      stemsG.append(g)
      drawn.set(key, g)
      g.addEventListener('animationend', () => g.classList.remove('grow'), { once: true })
    }
    const top = BASE.y - s.length
    g.querySelector('line').setAttribute('y2', top)
    g.querySelector('.head').setAttribute('transform', `translate(${BASE.x} ${top}) rotate(${-s.angle}) scale(1.45)`)
    g.style.setProperty('--a', `${s.angle}deg`)
  }
  for (const [key, g] of drawn) {
    if (keep.has(key)) continue
    drawn.delete(key)
    if (reduce) g.remove()
    else {
      g.classList.add('pluck')
      g.addEventListener('animationend', () => g.remove(), { once: true })
    }
  }
  $('empty').hidden = stemCount(counts) > 0
}

const WRAP_SVG = {
  kraft: `<path d="M74 232 150 214 226 232 162 360H138Z" fill="#c9a27a"/><path d="M74 232 138 360M226 232 162 360" stroke="#a9825a" stroke-width="1.2" fill="none"/><path d="M150 214 150 360" stroke="#b58f67" stroke-width="0.8"/>`,
  selyem: `<path d="M70 228Q110 206 150 218Q190 206 230 228L164 360H136Z" fill="#f2cfc3" opacity="0.94"/><path d="M92 236 140 356M208 236 160 356" stroke="#e3afa1" stroke-width="1.2" fill="none"/>`,
  doboz: `<path d="M84 262V350Q150 372 216 350V262" fill="#1f2b1f"/><ellipse cx="150" cy="262" rx="66" ry="14" fill="#2d3d2d"/><path d="M84 300Q150 320 216 300" stroke="#d9432b" stroke-width="5" fill="none"/>`,
}
const BOW = `<g fill="#d9432b"><ellipse cx="138" cy="296" rx="13" ry="6" transform="rotate(-18 138 296)"/><ellipse cx="162" cy="296" rx="13" ry="6" transform="rotate(18 162 296)"/><path d="M146 300 136 322 142 320 148 302ZM154 300 164 322 158 320 152 302Z"/><circle cx="150" cy="298" r="4.5" fill="#b8321d"/></g>`

function currentWrap() {
  return document.querySelector('input[name="wrap"]:checked').value
}

function paintWrap() {
  const wrap = currentWrap()
  $('wrap').innerHTML = stemCount(counts) ? WRAP_SVG[wrap] + (wrap === 'doboz' ? '' : BOW) : ''
}

// The card tag hangs from the bow and shows what you type.
function paintTag() {
  const raw = $('card').value
  $('card-count').textContent = `${raw.length} / 80`
  const tag = $('tag')
  const text = raw.trim().replace(/[<>&"]/g, '')
  if (!text || !stemCount(counts)) return tag.replaceChildren()
  const lines = ['']
  for (const w of text.split(/\s+/)) {
    const joined = `${lines.at(-1)} ${w}`.trim()
    if (joined.length > 16 && lines.at(-1) && lines.length < 4) lines.push(w)
    else lines[lines.length - 1] = joined
  }
  const h = 14 + lines.length * 12
  tag.innerHTML = `<path d="M152 300Q180 312 196 318" stroke="#1f2b1f" stroke-width="0.8" fill="none"/>
    <g transform="rotate(8 196 318)"><rect x="190" y="314" width="100" height="${h}" rx="3" fill="#f6f7f0" stroke="#c9ccbd"/>
    <circle cx="196" cy="320" r="2" fill="#c9ccbd"/>
    ${lines.map((l, i) => `<text x="240" y="${331 + i * 12}" text-anchor="middle">${l.slice(0, 20)}</text>`).join('')}</g>`
}

function paintSum() {
  const p = price(counts, currentWrap())
  const n = stemCount(counts)
  $('sum').innerHTML = `
    <div><dt>${n} szál</dt><dd>${ft(p.stems)}</dd></div>
    <div><dt>${WRAPS[currentWrap()].name}</dt><dd>${ft(p.wrap)}</dd></div>
    <div><dt>Kötés</dt><dd>${ft(p.binding)}</dd></div>
    <div class="total"><dt>Összesen</dt><dd>${ft(p.total)}</dd></div>`
}

function paint() {
  for (const f of FLOWERS) {
    const n = counts[f.id] ?? 0
    $(`n-${f.id}`).textContent = n
    const left = f.stock - n
    const el = $(`left-${f.id}`)
    el.textContent = left ? `ma még ${left} szál` : 'elfogyott'
    el.classList.toggle('low', left <= 3)
    stock.querySelector(`[data-id="${f.id}"][data-step="1"]`).disabled = setCount(counts, f.id, n + 1)[f.id] === n
    stock.querySelector(`[data-id="${f.id}"][data-step="-1"]`).disabled = n === 0
  }
  paintBouquet()
  paintWrap()
  paintTag()
  paintSum()
}

document.querySelectorAll('input[name="wrap"]').forEach((r) => r.addEventListener('change', paint))
$('card').addEventListener('input', paintTag)

// Start with the week's bouquet, grown in when the stage scrolls into view.
const WEEKLY = { rozsa: 3, tulipan: 4, eukaliptusz: 3, fatyolvirag: 3 }
paint()
new IntersectionObserver(
  (entries, io) => {
    if (!entries[0].isIntersecting) return
    io.disconnect()
    if (!stemCount(counts)) counts = { ...WEEKLY }
    paint()
  },
  { threshold: 0.25 },
).observe($('bouquet'))

// Pickup days
const days = pickupDays()
$('days').innerHTML = days
  .map(
    (d, i) => `<label class="day"><input type="radio" name="day" value="${d.iso}" data-sat="${d.saturday}" ${i === 0 ? 'checked' : ''} />
      <span><b>${d.day}</b>${d.weekday}${d.saturday ? '<small>13-ig</small>' : ''}</span></label>`,
  )
  .join('')

const pm = document.querySelector('input[name="slot"][value="du"]')
function saturdayRule() {
  const sat = document.querySelector('input[name="day"]:checked')?.dataset.sat === 'true'
  pm.disabled = sat
  if (sat && pm.checked) document.querySelector('input[name="slot"][value="de"]').checked = true
}
$('days').addEventListener('change', saturdayRule)
saturdayRule()

// Order
const form = $('order-form')
const status = $('form-status')
const fields = ['name', 'phone', 'card']

function show(found) {
  let first = null
  for (const id of fields) {
    const input = form.elements[id]
    const slot = $(`${id}-error`)
    const message = found[id]
    input.setAttribute('aria-invalid', message ? 'true' : 'false')
    slot.hidden = !message
    slot.textContent = message || ''
    if (message) input.setAttribute('aria-describedby', `${id}-error`)
    else input.removeAttribute('aria-describedby')
    if (message && !first) first = input
  }
  $('day-error').hidden = !found.day
  $('day-error').textContent = found.day || ''
  $('stems-error').hidden = !found.stems
  $('stems-error').textContent = found.stems || ''
  return found.stems ? stock.querySelector('button:not(:disabled)') : first
}

form.addEventListener('submit', (e) => {
  e.preventDefault()
  status.hidden = true
  const data = Object.fromEntries(new FormData(form))
  const first = show(orderProblems(data, counts))
  if (first) return first.focus()
  const d = days.find((x) => x.iso === data.day)
  const total = ft(price(counts, currentWrap()).total)
  status.hidden = false
  status.textContent = `Megvan: ${stemCount(counts)} szál, ${WRAPS[currentWrap()].name.toLowerCase()}, átvétel ${d.day}. (${d.weekday}) ${data.slot === 'de' ? 'délelőtt' : 'délután'}, ${total}. Ez a bemutató nem küld rendelést; élesben SMS-ben visszaigazolnánk.`
  form.elements.name.value = ''
  form.elements.phone.value = ''
})
