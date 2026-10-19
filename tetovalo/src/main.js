import '@fontsource/pirata-one/400.css'
import '@fontsource/space-grotesk/400.css'
import '@fontsource/space-grotesk/600.css'
import './style.css'
import { FLASH, PAIN, PLACEMENTS, STYLES, claimProblems, estimate } from './logic.js'

const $ = (id) => document.getElementById(id)
const ft = (n) => `${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} Ft`
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
const hours = (h) => (h % 1 ? `${Math.floor(h)},5 óra` : `${h} óra`)

// Flash lap
let picked = FLASH.find((f) => !f.taken)
function renderSheet() {
  $('sheet').innerHTML = FLASH.map((f) => `<li><button type="button" class="flash-card${picked === f ? ' is-picked' : ''}${f.taken ? ' is-taken' : ''}" data-id="${f.id}" aria-pressed="${picked === f}"${f.taken ? ' disabled' : ''}>
    <span class="no">№ ${String(f.id).padStart(2, '0')}</span><span class="fname">${f.name}</span>
    <span class="fmeta">${f.size} cm · ${ft(f.price)}</span>${f.taken ? '<span class="stamp">foglalt</span>' : ''}</button></li>`).join('')
  $('claim-pick').textContent = picked ? `Kiválasztva: ${picked.name}, ${picked.size} cm, ${ft(picked.price)}` : 'Válasszon egy mintát.'
}
$('sheet').addEventListener('click', (e) => {
  const b = e.target.closest('.flash-card')
  if (!b || b.disabled) return
  picked = FLASH.find((f) => f.id === Number(b.dataset.id))
  renderSheet()
  document.querySelector(`.flash-card[data-id="${b.dataset.id}"]`)?.focus()
})
$('claim').addEventListener('submit', (e) => {
  e.preventDefault()
  const d = Object.fromEntries(new FormData(e.target))
  const issues = claimProblems(picked, d.name, d.phone, d.adult === 'on')
  const err = $('claim-err')
  if (issues.length) { err.hidden = false; err.classList.remove('ok-msg'); err.textContent = issues.join(' '); return }
  picked.taken = true
  err.hidden = false
  err.classList.add('ok-msg')
  err.innerHTML = `Lefoglaltuk: <b>${picked.name}</b>, ${esc(d.name)} nevére. Hívjuk a(z) ${esc(d.phone)} számon időpontért. <small>Bemutató: nem megy el sehova.</small>`
  picked = FLASH.find((f) => !f.taken) ?? null
  renderSheet()
})

// Becslés
const state = { place: 'alkar', style: 'vonal' }
const chips = (el, name, items, val) => {
  el.innerHTML = Object.entries(items).map(([id, x]) => `<label class="chip"><input type="radio" name="${name}" value="${id}"${id === val ? ' checked' : ''} /><span>${x.name}</span></label>`).join('')
}
chips($('places'), 'place', PLACEMENTS, state.place)
chips($('styles'), 'style', STYLES, state.style)
function renderQuote() {
  const cm = Number($('cm').value)
  $('cm-out').textContent = `${cm} × ${cm} cm`
  const q = estimate(state.place, cm, state.style)
  if (!q) { $('quote').innerHTML = '<p>Ehhez személyesen kell megnéznünk.</p>'; return }
  $('quote').innerHTML = `
    <p class="q-head">${PLACEMENTS[state.place].name} · ${cm} cm · ${STYLES[state.style].name.toLowerCase()}</p>
    <p class="q-price">${ft(q.low)} – ${ft(q.high)}</p>
    <dl>
      <div><dt>Idő</dt><dd>kb. ${hours(q.hours)}</dd></div>
      <div><dt>Alkalom</dt><dd>${q.sessions} × legfeljebb 4 óra</dd></div>
      <div><dt>Fájdalom</dt><dd><span class="pain" role="img" aria-label="${q.pain} az 5-ből">${'<i class="on"></i>'.repeat(q.pain)}${'<i></i>'.repeat(5 - q.pain)}</span> ${PAIN[q.pain]}</dd></div>
      <div><dt>Gyógyulás</dt><dd>${q.heal}</dd></div>
    </dl>
    <p class="small">A végleges árat a vázlat után mondjuk. 25 000 Ft a legkisebb munka.</p>`
}
$('est').addEventListener('input', (e) => {
  if (e.target.name === 'place' || e.target.name === 'style') state[e.target.name] = e.target.value
  renderQuote()
})

// Konzultáció referenciaképpel (csak helyi előnézet)
let previewUrl = null
$('ref').addEventListener('change', (e) => {
  const file = e.target.files?.[0]
  const img = $('ref-preview')
  if (previewUrl) URL.revokeObjectURL(previewUrl)
  if (!file || !file.type.startsWith('image/')) { img.hidden = true; previewUrl = null; return }
  previewUrl = URL.createObjectURL(file)
  img.src = previewUrl
  img.hidden = false
})
$('idea').addEventListener('submit', (e) => {
  e.preventDefault()
  const d = Object.fromEntries(new FormData(e.target))
  const issues = []
  if (!d.idea?.trim()) issues.push('Írja le röviden az ötletet.')
  if (!/^\S+@\S+\.\S+$/.test(d.email ?? '')) issues.push('Adjon meg egy érvényes e-mail-címet.')
  const err = $('idea-err'), ok = $('idea-ok')
  if (issues.length) { err.hidden = false; ok.hidden = true; err.textContent = issues.join(' '); return }
  err.hidden = true
  ok.hidden = false
  ok.innerHTML = `Megkaptuk. Egy héten belül írunk a(z) ${esc(d.email)} címre egy vázlat-időponttal${previewUrl ? ', a képet is látjuk' : ''}. <small>Bemutató: semmi nem ment el.</small>`
})

renderSheet()
renderQuote()
