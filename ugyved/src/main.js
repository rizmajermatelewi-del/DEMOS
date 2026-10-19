import '@fontsource/newsreader/500.css'
import '@fontsource/newsreader/500-italic.css'
import '@fontsource/public-sans/400.css'
import '@fontsource/public-sans/600.css'
import './style.css'
import { CASES, consultSlots, docsProgress, feeFor } from './logic.js'

const $ = (id) => document.getElementById(id)
const ft = (n) => `${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} Ft`
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
const DAYS = ['vasárnap', 'hétfő', 'kedd', 'szerda', 'csütörtök', 'péntek', 'szombat']
const MONTHS = ['jan.', 'febr.', 'márc.', 'ápr.', 'máj.', 'jún.', 'júl.', 'aug.', 'szept.', 'okt.', 'nov.', 'dec.']
const clock = (m) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`

const state = { case: 'ingatlan', price: 45000000, have: new Set() }

$('case-list').innerHTML = Object.entries(CASES).map(([id, c], i) => `<label class="case"><input type="radio" name="case" value="${id}"${id === state.case ? ' checked' : ''} /><span><b>${String(i + 1).padStart(2, '0')}</b>${c.name}</span></label>`).join('')
$('case-list').addEventListener('change', (e) => {
  state.case = e.target.value
  state.have.clear()
  render()
})

function renderCard() {
  const c = CASES[state.case]
  const fee = feeFor(state.case, state.price)
  $('case-card').innerHTML = `
    <h3>${c.name}</h3>
    <p>${c.what}</p>
    <dl>
      <div><dt>Mennyi ideig tart?</dt><dd>${c.time}</dd></div>
      <div><dt>Várható munkadíj</dt><dd>${c.fee.kind === 'percent' ? `<label class="price">Vételár: <input id="price" type="number" min="0" step="100000" value="${state.price}" inputmode="numeric" /> Ft</label>` : ''}<b class="fee">${fee ? ft(fee) : 'Adja meg a vételárat.'}</b><small>${c.fee.label}</small></dd></div>
    </dl>
    <a class="btn" href="#konzultacio">Erről beszélnék</a>`
  $('price')?.addEventListener('input', (e) => {
    state.price = Number(e.target.value)
    const f = feeFor(state.case, state.price)
    $('case-card').querySelector('.fee').textContent = f ? ft(f) : 'Adja meg a vételárat.'
  })
}

const progressText = () => { const p = docsProgress(state.case, state.have); return p.ready ? 'Minden megvan, jöhet.' : `${p.have} / ${p.total} megvan` }
function renderDocs() {
  const c = CASES[state.case]
  $('folder-sub').textContent = c.name
  $('docs').innerHTML = c.docs.map((d) => `<li><label><input type="checkbox" value="${esc(d)}"${state.have.has(d) ? ' checked' : ''} /><span>${d}</span></label></li>`).join('')
  $('progress').textContent = progressText()
}
$('docs').addEventListener('change', (e) => {
  if (e.target.checked) state.have.add(e.target.value); else state.have.delete(e.target.value)
  $('progress').textContent = progressText()
})
$('print').addEventListener('click', () => window.print())

// Konzultáció
const days = consultSlots(new Date(), 4)
let dayIdx = Math.max(0, days.findIndex((d) => d.times.length))
let time = null
function renderSlots() {
  $('day-tabs').innerHTML = days.map((d, i) => `<button type="button" role="tab" class="tab" data-i="${i}" aria-selected="${i === dayIdx}"${d.times.length ? '' : ' disabled'}>${DAYS[d.date.getDay()]}<small>${MONTHS[d.date.getMonth()]} ${d.date.getDate()}.</small></button>`).join('')
  const d = days[dayIdx]
  $('times').innerHTML = d?.times.length ? d.times.map((m) => `<button type="button" class="time" data-m="${m}" aria-pressed="${time === m}">${clock(m)}</button>`).join('') : '<p>Erre a napra nincs szabad időpont.</p>'
}
$('day-tabs').addEventListener('click', (e) => { const b = e.target.closest('.tab'); if (!b || b.disabled) return; dayIdx = Number(b.dataset.i); time = null; renderSlots(); document.querySelector(`.tab[data-i="${dayIdx}"]`).focus() })
$('times').addEventListener('click', (e) => { const b = e.target.closest('.time'); if (!b) return; time = Number(b.dataset.m); renderSlots(); document.querySelector(`.time[data-m="${time}"]`).focus() })
$('book').addEventListener('submit', (e) => {
  e.preventDefault()
  const f = Object.fromEntries(new FormData(e.target))
  const issues = []
  if (time === null) issues.push('Válasszon egy időpontot.')
  if (!f.name?.trim()) issues.push('Adja meg a nevét.')
  if ((f.phone ?? '').replace(/\D/g, '').length < 8) issues.push('Adjon meg egy telefonszámot.')
  const err = $('err')
  if (issues.length) { err.hidden = false; err.textContent = issues.join(' '); return }
  err.hidden = true
  const d = days[dayIdx].date
  const p = docsProgress(state.case, state.have)
  const missing = p.total - p.have
  $('done-body').innerHTML = `<h2 id="done-title" tabindex="-1">Várjuk: ${MONTHS[d.getMonth()]} ${d.getDate()}., ${DAYS[d.getDay()]}, ${clock(time)}</h2>
    <p>A konzultáció 30 perc, 15 000 Ft, ami beszámít a díjba. ${missing ? `A listáról még ${missing} irat hiányzik, azokat is hozza, ha tudja.` : 'Az iratlista teljes, köszönjük.'}</p>
    <article class="slip"><p class="slip-head">Az iroda naptárában</p><p class="slip-main">${CASES[state.case].name} · ${clock(time)}</p><p>${esc(f.name)} · <a href="tel:${esc(f.phone.replace(/[^\d+]/g, ''))}">${esc(f.phone)}</a></p>${f.note?.trim() ? `<p>„${esc(f.note.trim())}”</p>` : ''}</article>
    <form method="dialog"><button class="btn">Rendben</button></form>`
  $('done').showModal()
  $('done-title').focus()
})

// Hero: ügyirat-dosszié füllel ügytípusonként. A fül előre hozza az aktát, a pecsét rácsapódik.
const SHORT = { ingatlan: 'Ingatlan', orokles: 'Öröklés', valas: 'Válás', munka: 'Munkajog', ceg: 'Cégalapítás', szerzodes: 'Szerződés' }
const ids = Object.keys(CASES)
$('file-tabs').innerHTML = ids.map((id, i) => `<button type="button" role="tab" class="ftab" id="ftab-${id}" data-id="${id}" style="--i:${i}" aria-controls="file-body">${SHORT[id]}</button>`).join('')
function renderFile() {
  const c = CASES[state.case]
  const i = ids.indexOf(state.case)
  document.querySelectorAll('.ftab').forEach((b) => {
    const on = b.dataset.id === state.case
    b.setAttribute('aria-selected', String(on))
    b.tabIndex = on ? 0 : -1
  })
  const body = $('file-body')
  body.setAttribute('aria-labelledby', `ftab-${state.case}`)
  body.style.setProperty('--tab', i)
  body.innerHTML = `<p class="f-ref">Ügyirat · ${String(i + 1).padStart(2, '0')}/2026</p>
    <h2 class="f-title">${c.name}</h2>
    <p class="f-what">${c.what}</p>
    <dl class="f-facts"><div><dt>Meddig?</dt><dd>${c.time}</dd></div><div><dt>Mennyi?</dt><dd>${ft(feeFor(state.case, state.price))}<small>${c.fee.label}</small></dd></div></dl>
    <span class="stamp" aria-hidden="true">Becslés</span>
    <a class="f-more" href="#ugy">Részletek és iratlista ↓</a>`
  // Újraindítjuk a beúszást minden váltásnál.
  body.classList.remove('swap'); void body.offsetWidth; body.classList.add('swap')
}
function pickCase(id) {
  state.case = id
  state.have.clear()
  document.querySelector(`input[name="case"][value="${id}"]`).checked = true
  render()
}
$('file-tabs').addEventListener('click', (e) => { const b = e.target.closest('.ftab'); if (b) pickCase(b.dataset.id) })
$('file-tabs').addEventListener('keydown', (e) => {
  const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key]
  if (!step) return
  const next = ids[(ids.indexOf(state.case) + step + ids.length) % ids.length]
  pickCase(next)
  $(`ftab-${next}`).focus()
})

function render() { renderCard(); renderDocs(); renderFile() }
render()
renderSlots()
