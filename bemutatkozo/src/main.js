import { problems } from './validate.js'

const form = document.getElementById('contact-form')
const status = document.getElementById('form-status')
const fields = ['name', 'phone', 'city', 'job']

function show(found) {
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

form?.addEventListener('submit', (event) => {
  event.preventDefault()
  status.hidden = true
  const found = problems(Object.fromEntries(new FormData(form)))
  const first = show(found)
  if (first) {
    first.focus()
    return
  }
  status.hidden = false
  status.textContent = 'Köszönöm — ez a bemutató nem küld üzenetet. Éles oldalon itt menne ki az e-mail.'
  form.reset()
  show({})
})
