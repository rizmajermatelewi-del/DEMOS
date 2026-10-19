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
// A flash minták vonalrajza (stencil). pathLength=1, hogy a CSS egyetlen dashoffsettel rajzolja ki őket.
const ART = {
  1: 'M10 45 Q30 30 50 42 Q62 30 90 18 Q72 38 62 48 Q70 60 88 78 Q66 70 54 58 Q46 66 30 64 Q38 56 40 50 Q24 52 10 45 Z M50 42 Q52 36 58 36',
  2: 'M50 8 L50 70 M38 70 L62 70 M50 70 L50 80 M46 80 L54 80 L50 92 Z M30 50 a10 10 0 1 0 20 0 a10 10 0 1 0 -20 0 M36 50 a4 4 0 1 1 8 0 M28 58 Q20 66 24 74 M44 58 Q52 64 48 72',
  3: 'M62 20 A30 30 0 1 0 62 80 A22 22 0 1 1 62 20 Z M78 30 l3 7 7 0 -6 4 2 7 -6 -4 -6 4 2 -7 -6 -4 7 0 Z M84 62 l2 4 4 0 -3 2 1 4 -4 -2 -4 2 1 -4 -3 -2 4 0 Z',
  4: 'M20 85 C10 60 40 60 40 45 C40 30 15 30 20 18 C25 8 45 10 46 20 C52 18 60 22 58 28 C56 34 48 32 46 28 M58 25 l8 -2 M58 25 l7 3',
  5: 'M50 82 C20 62 14 44 24 32 C34 22 46 28 50 38 C54 28 66 22 76 32 C86 44 80 62 50 82 Z M12 54 L88 46 L86 58 L14 66 Z',
  6: 'M30 30 L36 18 L44 28 Q50 26 56 28 L64 18 L70 30 Q78 44 70 60 Q60 76 50 78 Q40 76 30 60 Q22 44 30 30 Z M38 44 l8 4 M62 44 l-8 4 M45 64 Q50 69 55 64 M50 56 l0 7',
}
const art = (id) => `<svg class="art" viewBox="0 0 100 100" aria-hidden="true" style="--d:${id}"><path pathLength="1" d="${ART[id]}" /></svg>`

let picked = FLASH.find((f) => !f.taken)
function renderSheet() {
  $('sheet').innerHTML = FLASH.map((f) => `<li><button type="button" class="flash-card${picked === f ? ' is-picked' : ''}${f.taken ? ' is-taken' : ''}" data-id="${f.id}" aria-pressed="${picked === f}"${f.taken ? ' disabled' : ''}>
    ${art(f.id)}<span class="no">№ ${String(f.id).padStart(2, '0')}</span><span class="fname">${f.name}</span>
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

// A flash lap mintái akkor rajzolódnak ki, amikor a lap a képernyőre ér.
new IntersectionObserver((entries, obs) => entries.forEach((e) => {
  if (e.isIntersecting) { e.target.classList.add('in'); obs.unobserve(e.target) }
}), { rootMargin: '0px 0px -15% 0px' }).observe($('sheet'))
