import '@fontsource/saira/400.css'
import '@fontsource/saira/600.css'
import '@fontsource/saira/800.css'
import '@fontsource/martian-mono/400.css'
import '@fontsource/martian-mono/500.css'
import './style.css'
import { phoneStatus } from './status.js'
import { problems } from './validate.js'

// Header LED: green while the phone is answered, red with the next opening otherwise.
const statusLink = document.getElementById('status')
function paintStatus() {
  const { open, label } = phoneStatus()
  statusLink.classList.toggle('is-open', open)
  statusLink.querySelector('.status-text').textContent = label
  statusLink.setAttribute('aria-label', `${label}. Hívás: +36 30 555 0187`)
}
paintStatus()
setInterval(paintStatus, 60_000)

// The breaker panel
const form = document.getElementById('contact-form')
const count = document.getElementById('count')
const breakers = [...form.querySelectorAll('input[name="services"]')]

function picked() {
  return breakers.filter((b) => b.checked).map((b) => b.value)
}

function paintPanel() {
  const on = picked()
  count.textContent = `${on.length} kör bekapcsolva`
  for (const li of form.querySelectorAll('.legend li')) li.classList.toggle('on', on.includes(li.dataset.for))
}

for (const input of breakers) {
  input.addEventListener('change', () => {
    const body = input.closest('.breaker')
    body.classList.remove('clack')
    void body.offsetWidth // restart the snap animation
    body.classList.add('clack')
    paintPanel()
    if (input.checked) show({ ...currentErrors, job: undefined })
  })
}

// The form
const status = document.getElementById('form-status')
const fields = ['name', 'phone', 'city', 'job']
let currentErrors = {}

function show(found) {
  currentErrors = found
  let first = null
  for (const id of fields) {
    const input = form.elements[id]
    const slot = document.getElementById(`${id}-error`)
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

form.addEventListener('submit', (event) => {
  event.preventDefault()
  status.hidden = true
  const found = problems(Object.fromEntries(new FormData(form)), picked())
  const first = show(found)
  if (first) {
    first.focus()
    return
  }
  const n = picked().length
  status.hidden = false
  status.textContent = `Megvan${n ? `, ${n} munka a táblán` : ''}. Ez a bemutató nem küld üzenetet; élesben itt menne ki, és visszahívnálak.`
  // The breakers drop back one after the other, like switching a board off.
  breakers.forEach((b, i) => setTimeout(() => {
    if (!b.checked) return
    b.checked = false
    b.dispatchEvent(new Event('change'))
  }, i * 120))
  for (const id of fields) form.elements[id].value = ''
  show({})
})
