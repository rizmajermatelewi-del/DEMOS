import '@fontsource/saira-condensed/700.css'
import '@fontsource/saira-condensed/800.css'
import '@fontsource/saira/400.css'
import '@fontsource/saira/600.css'
import './style.css'
import { PACKAGES, PARTS, dropDays, fits, workOrder } from './logic.js'

const $ = (id) => document.getElementById(id)
const ft = (n) => `${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} Ft`
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
const dur = (m) => (m >= 60 ? `${Math.floor(m / 60)} óra${m % 60 ? ` ${m % 60} perc` : ''}` : `${m} perc`)
const DAYS = ['vasárnap', 'hétfő', 'kedd', 'szerda', 'csütörtök', 'péntek', 'szombat']
const MONTHS = ['jan.', 'febr.', 'márc.', 'ápr.', 'máj.', 'jún.', 'júl.', 'aug.', 'szept.', 'okt.', 'nov.', 'dec.']
const huDay = (iso) => { const d = new Date(`${iso}T12:00:00Z`); return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}., ${DAYS[d.getUTCDay()]}` }

// Hol vannak a pontok a rajzon (a 600 × 360-as rajz százalékában)
const SPOTS = { kerek: [78, 69], fek: [76, 42], lanc: [37, 70], valto: [26, 82], kormany: [70, 22] }

const now = new Date()
const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
const days = dropDays(today, 6)
const state = { part: 'kerek', picked: new Set(['defekt']), day: null }

$('spots').innerHTML = Object.entries(SPOTS).map(([id, [x, y]], i) => `<button type="button" class="spot" data-part="${id}" style="left:${x}%;top:${y}%" aria-label="${PARTS[id].name}" aria-pressed="false"><span>${i + 1}</span><b>${PARTS[id].name}</b></button>`).join('')
$('spots').addEventListener('click', (e) => {
  const b = e.target.closest('.spot')
  if (!b) return
  state.part = b.dataset.part
  render()
  $('panel').querySelector('input')?.focus()
})

// Görgetésre forognak a kerekek, a lánckerék és fut a lánc (mozgáscsökkentésnél áll).
const svg = document.querySelector('.bike-svg')
if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
  let queued = false
  addEventListener('scroll', () => {
    if (queued) return
    queued = true
    requestAnimationFrame(() => {
      svg.style.setProperty('--spin', `${scrollY * 0.5}deg`)
      svg.style.setProperty('--roll', `${-scrollY * 0.35}px`)
      queued = false
    })
  }, { passive: true })
}

function renderPanel() {
  const p = PARTS[state.part]
  // A kiválasztott alkatrész felé nagyít a rajz.
  const [x, y] = SPOTS[state.part]
  const bike = document.querySelector('.bike')
  bike.style.setProperty('--ox', `${x}%`)
  bike.style.setProperty('--oy', `${y}%`)
  document.querySelectorAll('.spot').forEach((s) => {
    s.setAttribute('aria-pressed', String(s.dataset.part === state.part))
    s.classList.toggle('has', PARTS[s.dataset.part].services.some(([id]) => state.picked.has(id)))
  })
  $('panel').innerHTML = `<h3>${p.name}</h3><p class="hint">Jelölje be, ami kell:</p>
    <ul class="svc">${p.services.map(([id, name, price, minutes]) => `<li><label><input type="checkbox" value="${id}"${state.picked.has(id) ? ' checked' : ''} /><span>${name}<small>${dur(minutes)}</small></span><b>${ft(price)}</b></label></li>`).join('')}</ul>`
}
$('panel').addEventListener('change', (e) => {
  if (e.target.checked) state.picked.add(e.target.value); else state.picked.delete(e.target.value)
  render({ keepFocus: e.target.value })
})

$('packages').innerHTML = PACKAGES.map((p) => `<label class="pk"><input type="checkbox" value="${p.id}" /><span class="pk-name">${p.name}</span><span class="pk-note">${p.note}</span><span class="pk-price">${ft(p.price)} · ${dur(p.minutes)}</span></label>`).join('')
$('packages').addEventListener('change', (e) => {
  if (e.target.checked) state.picked.add(e.target.value); else state.picked.delete(e.target.value)
  render()
})

function renderSheet() {
  const w = workOrder([...state.picked])
  $('sheet').innerHTML = `<p class="sheet-head">Munkalap</p>
    ${w.items.length ? `<ul>${w.items.map((i) => `<li><span>${i.name}</span><b>${ft(i.price)}</b></li>`).join('')}</ul>
    <p class="sheet-sum"><span>Összesen</span><b>${ft(w.price)}</b></p><p class="sheet-time">Szerelőidő: ${dur(w.minutes)}</p>` : '<p class="empty">Még üres. Koppintson a rajzon egy alkatrészre, vagy válasszon csomagot.</p>'}`
  document.querySelectorAll('#packages input').forEach((i) => { i.checked = state.picked.has(i.value) })
  return w
}

function renderDays(w) {
  if (state.day && !fits(state.day, w.minutes)) state.day = null
  $('days').innerHTML = days.map((d, i) => {
    const ok = fits(d, w.minutes)
    const sel = state.day === d
    const pct = Math.round((1 - d.free / 360) * 100)
    return `<li><button type="button" class="day${sel ? ' is-picked' : ''}" data-i="${i}" aria-pressed="${sel}"${ok ? '' : ' disabled'}>
      <span class="d-name">${huDay(d.date)}</span><span class="d-bar"><i style="width:${pct}%"></i></span>
      <span class="d-free">${d.free >= 60 ? `${Math.floor(d.free / 60)} óra szabad` : `${d.free} perc szabad`}${d.saturday ? ' · szombat délig' : ''}</span></button></li>`
  }).join('')
}
$('days').addEventListener('click', (e) => {
  const b = e.target.closest('.day')
  if (!b || b.disabled) return
  state.day = days[Number(b.dataset.i)]
  render()
  document.querySelector(`.day[data-i="${b.dataset.i}"]`)?.focus()
})

function render({ keepFocus } = {}) {
  renderPanel()
  const w = renderSheet()
  renderDays(w)
  if (keepFocus) $('panel').querySelector(`input[value="${keepFocus}"]`)?.focus()
}

$('drop').addEventListener('submit', (e) => {
  e.preventDefault()
  const d = Object.fromEntries(new FormData(e.target))
  const w = workOrder([...state.picked])
  const issues = []
  if (!w.items.length) issues.push('Előbb válassza ki, mit csináljunk.')
  if (!state.day) issues.push('Válasszon egy napot, amikor behozza.')
  if (!d.name?.trim()) issues.push('Adja meg a nevét.')
  if ((d.phone ?? '').replace(/\D/g, '').length < 8) issues.push('Adjon meg egy telefonszámot.')
  const err = $('err')
  if (issues.length) { err.hidden = false; err.textContent = issues.join(' '); return }
  err.hidden = true
  $('done-body').innerHTML = `
    <h2 id="done-title" tabindex="-1">Várjuk: ${huDay(state.day.date)}</h2>
    <p>Hozza be reggel 9 és 11 között, és hívjuk, amint kész.</p>
    <article class="slip"><p class="slip-head">A műhely táblája</p>
      <p class="slip-main">${huDay(state.day.date)} · ${esc(d.name)}</p>
      <p>${w.items.map((i) => i.name).join(', ')}</p>
      <p>${ft(w.price)} · ${dur(w.minutes)} · <a href="tel:${esc(d.phone.replace(/[^\d+]/g, ''))}">${esc(d.phone)}</a></p></article>
    <form method="dialog"><button class="btn">Rendben</button></form>`
  $('done').showModal()
  $('done-title').focus()
})

render()
