import '@fontsource/barlow-condensed/600.css'
import '@fontsource/barlow-condensed/800.css'
import '@fontsource/barlow/400.css'
import '@fontsource/barlow/500.css'
import './style.css'
import { compare, crowd, freeByZone, level, openHours, quietest, trialProblems } from './crowd.js'

const $ = (id) => document.getElementById(id)
const ft = (n) => `${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} Ft`
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
const DAY_NAMES = ['vasárnap', 'hétfő', 'kedd', 'szerda', 'csütörtök', 'péntek', 'szombat']
const SHORT = ['V', 'H', 'K', 'Sze', 'Cs', 'P', 'Szo']
const WEEK = [1, 2, 3, 4, 5, 6, 0] // Monday first
const FIRST_HOUR = 6
const LAST_HOUR = 21
const cap = (s) => s[0].toUpperCase() + s.slice(1)

// Right now
const now = new Date()
const today = now.getDay()
const pctNow = crowd(today, now.getHours())
$('now-text').textContent = pctNow == null ? 'Most zárva' : `Most: ${level(pctNow).toLowerCase()}, ${pctNow}%`
$('now').classList.toggle('closed', pctNow == null)

/** The selected cell starts at the current hour, or the next open hour. */
function startCell() {
  for (let i = 0; i < 48; i++) {
    const t = new Date(now.getTime() + i * 3600e3)
    if (crowd(t.getDay(), t.getHours()) != null) return { day: t.getDay(), hour: t.getHours() }
  }
  return { day: 1, hour: 10 }
}
let sel = startCell()

// The heatmap: day rows, hour columns (CSS swaps them on phones).
const heat = $('heat')
let html = ''
for (let h = FIRST_HOUR; h <= LAST_HOUR; h++) html += `<span class="hlabel" style="--h:${h - FIRST_HOUR + 2}">${h}</span>`
WEEK.forEach((d, row) => {
  html += `<span class="dlabel" style="--d:${row + 2}">${SHORT[d]}</span>`
  for (let h = FIRST_HOUR; h <= LAST_HOUR; h++) {
    const pct = crowd(d, h)
    const pos = `--d:${row + 2};--h:${h - FIRST_HOUR + 2}`
    html +=
      pct == null
        ? `<span class="cell off" style="${pos}" aria-hidden="true"></span>`
        : `<button type="button" class="cell" style="${pos};--p:${pct}" data-day="${d}" data-hour="${h}" aria-label="${cap(DAY_NAMES[d])} ${h}:00, ${level(pct).toLowerCase()}, ${pct}%"${d === today ? ' data-today=""' : ''}></button>`
  }
})
heat.innerHTML = html

function paintPanel() {
  const { day, hour } = sel
  const pct = crowd(day, hour)
  for (const c of heat.querySelectorAll('button.cell')) {
    c.setAttribute('aria-pressed', String(Number(c.dataset.day) === day && Number(c.dataset.hour) === hour))
  }
  $('sp-when').textContent = `${cap(DAY_NAMES[day])} ${hour}:00-${hour + 1}:00`
  $('sp-pct').textContent = `${pct}%`
  $('sp-level').textContent = level(pct)
  $('sp-level').dataset.level = pct < 35 ? 'low' : pct < 65 ? 'mid' : 'high'
  $('zones').innerHTML = freeByZone(day, hour)
    .map(
      (z) => `<li><span class="z-name">${z.name}<small>${z.detail}</small></span><span class="z-bar" style="--f:${z.free / z.cap}"><i></i></span><b>${z.free} szabad</b></li>`,
    )
    .join('')
  const q = quietest(day)
  const [, close] = openHours(day)
  $('sp-quiet').textContent = `${cap(DAY_NAMES[day])} a legcsendesebb: ${q}:00-${Math.min(q + 2, close)}:00.`
}
heat.addEventListener('click', (e) => {
  const c = e.target.closest('button.cell')
  if (!c) return
  sel = { day: Number(c.dataset.day), hour: Number(c.dataset.hour) }
  paintPanel()
})
$('sp-pick').addEventListener('click', () => {
  $('when').value = `${cap(DAY_NAMES[sel.day])} ${sel.hour}:00`
  $('proba').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
  $('name').focus({ preventScroll: true })
})
paintPanel()

// Pass calculator
function paintPasses() {
  const perWeek = Number($('per-week').value)
  const { visits, rows } = compare(perWeek)
  $('pw-out').textContent = perWeek
  $('pw-visits').textContent = `Ez havonta kb. ${visits} alkalom.`
  $('passes').innerHTML = rows
    .map(
      (r) => `<li class="pass${r.best ? ' best' : ''}">
        ${r.best ? '<span class="flag">Ez éri meg</span>' : ''}
        <h3>${r.name}</h3>
        <p class="p-note">${ft(r.price)} · ${r.note}</p>
        <p class="p-month"><b>${ft(r.monthly)}</b> / hónap</p>
        <p class="p-visit">${ft(r.perVisit)} alkalmanként</p>
      </li>`,
    )
    .join('')
}
$('per-week').addEventListener('input', paintPasses)
paintPasses()

// Trial
const form = $('trial-form')
form.addEventListener('submit', (e) => {
  e.preventDefault()
  const data = Object.fromEntries(new FormData(form))
  const found = trialProblems(data)
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
  const status = $('form-status')
  status.hidden = false
  status.textContent = `Megvan${data.when ? `, ${data.when.trim()}` : ''}. Ez a bemutató nem küld jelentkezést; élesben egy edző visszahívna, hogy egyeztessen.`
  form.reset()
})
