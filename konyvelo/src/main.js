import '@fontsource/schibsted-grotesk/400.css'
import '@fontsource/schibsted-grotesk/500.css'
import '@fontsource/schibsted-grotesk/800.css'
import '@fontsource/dm-mono/400.css'
import '@fontsource/dm-mono/500.css'
import './style.css'
import { contactProblems, feeLines, ft, nextDeadlines } from './fee.js'

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
const $ = (id) => document.getElementById(id)
const MONTHS = ['JAN', 'FEBR', 'MÁRC', 'ÁPR', 'MÁJ', 'JÚN', 'JÚL', 'AUG', 'SZEPT', 'OKT', 'NOV', 'DEC']
const DAYS = ['vasárnap', 'hétfő', 'kedd', 'szerda', 'csütörtök', 'péntek', 'szombat']

// Tear-off deadline pad: one sheet per upcoming due date, the top one tears off.
const sheets = $('sheets')
const deadlines = nextDeadlines(new Date(), 4)
let top = 0

function sheet(d, i) {
  const li = document.createElement('li')
  li.className = 'sheet'
  li.style.setProperty('--i', i)
  const left = d.days === 0 ? 'ma van' : d.days === 1 ? 'holnap' : `még ${d.days} nap`
  li.innerHTML = `
    <span class="sheet-month">${MONTHS[d.date.getMonth()]}</span>
    <span class="sheet-day">${d.date.getDate()}</span>
    <span class="sheet-weekday">${DAYS[d.date.getDay()]}</span>
    <span class="sheet-label">${d.label}</span>
    <span class="sheet-left${d.days <= 5 ? ' soon' : ''}">${left}</span>`
  return li
}

function paintPad() {
  sheets.replaceChildren(...deadlines.slice(top).map(sheet).reverse())
}
paintPad()

$('pad-next').addEventListener('click', () => {
  const current = sheets.lastElementChild
  const advance = () => {
    top = (top + 1) % deadlines.length
    paintPad()
  }
  if (reduce || !current) return advance()
  current.classList.add('torn')
  current.addEventListener('animationend', advance, { once: true })
})

// The adding machine: every change reprints the tape; changed lines print fresh.
const calc = $('calc')
const tape = $('tape')
let employees = 0
let printed = new Map()
let last = null

function state() {
  const data = new FormData(calc)
  return { form: data.get('form'), docs: Number(data.get('docs')), employees, vat: data.get('vat') === 'on' }
}

function printTape() {
  const s = state()
  last = feeLines(s)
  $('docs-out').textContent = s.docs
  $('emp-out').textContent = `${employees} fő`
  const now = new Map(last.lines.map((l) => [l.key, l.amount]))
  const rows = last.lines.map((l) => {
    const fresh = printed.get(l.key) !== l.amount ? ' fresh' : ''
    return `<p class="row${fresh}"><span>${l.label}</span><span>${ft(l.amount)} +</span></p>`
  })
  tape.innerHTML = `
    <p class="tape-head">PÁLFI KÖNYVELŐIRODA<br />HAVIDÍJ, MINTAÁR</p>
    ${rows.join('')}
    <p class="row total fresh"><span>Havonta, ÁFA nélkül</span><span>${ft(last.total)} ∗</span></p>`
  printed = now
  if (!reduce) {
    tape.classList.remove('feed')
    void tape.offsetWidth // restart the feed
    tape.classList.add('feed')
  }
}

calc.addEventListener('input', printTape)
calc.addEventListener('click', (e) => {
  const step = e.target.closest('[data-step]')
  if (!step) return
  employees = Math.min(50, Math.max(0, employees + Number(step.dataset.step)))
  printTape()
})
printTape()

// Tear the tape off and pin it to the contact form.
const stub = $('stub')
$('tear').addEventListener('click', () => {
  $('stub-total').textContent = `${ft(last.total)} Ft / hó`
  stub.hidden = false
  const go = () => {
    tape.classList.remove('ripped')
    $('kapcsolat').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' })
    $('name').focus({ preventScroll: true })
  }
  if (reduce) return go()
  tape.classList.add('ripped')
  setTimeout(go, 420)
})
$('stub-remove').addEventListener('click', () => (stub.hidden = true))

// Contact form
const form = $('contact-form')
const status = $('form-status')
const fields = ['name', 'contact']

function show(found) {
  let first = null
  for (const id of fields) {
    const input = form.elements[id]
    const slot = $(`${id}-error`)
    const message = found[id]
    input.setAttribute('aria-invalid', message ? 'true' : 'false')
    if (message) input.setAttribute('aria-describedby', `${id}-error`)
    else input.removeAttribute('aria-describedby')
    slot.hidden = !message
    slot.textContent = message || ''
    if (message && !first) first = input
  }
  return first
}

form.addEventListener('submit', (e) => {
  e.preventDefault()
  status.hidden = true
  const first = show(contactProblems(Object.fromEntries(new FormData(form))))
  if (first) return first.focus()
  const withCalc = stub.hidden ? '' : ' A kiszámolt havidíjat is látnánk.'
  status.hidden = false
  status.textContent = `Köszönjük, megkaptuk.${withCalc} Ez a bemutató nem küld üzenetet; élesben egy munkanapon belül visszahívnánk.`
  form.reset()
  stub.hidden = true
})
