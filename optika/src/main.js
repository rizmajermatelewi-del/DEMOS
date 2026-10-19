import '@fontsource/epilogue/400.css'
import '@fontsource/epilogue/600.css'
import '@fontsource/epilogue/800.css'
import './style.css'
import { FACES, FRAMES, describe, examSlots, lensFor, recipeProblems } from './logic.js'

const $ = (id) => document.getElementById(id)
const ft = (n) => `${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} Ft`
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
const num = (n) => (n > 0 ? '+' : n < 0 ? '−' : '') + Math.abs(n).toFixed(2).replace('.', ',')
const DAYS = ['vasárnap', 'hétfő', 'kedd', 'szerda', 'csütörtök', 'péntek', 'szombat']
const MONTHS = ['jan.', 'febr.', 'márc.', 'ápr.', 'máj.', 'jún.', 'júl.', 'aug.', 'szept.', 'okt.', 'nov.', 'dec.']
const clock = (m) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`

// 1,5-ös, 1,6-os, 1,67-es, 1,74-es: tizedesvessző és a kiejtéshez illő rag
const INDEX = { '1.5': ['1,5', 'ös'], '1.6': ['1,6', 'os'], '1.67': ['1,67', 'es'], '1.74': ['1,74', 'es'] }

// Recept: lenyíló listák negyed lépésekben
const range = (from, to) => Array.from({ length: Math.round((to - from) * 4) + 1 }, (_, i) => from + i * 0.25)
const fill = (sel, values, val) => { sel.innerHTML = values.map((v) => `<option value="${v}"${v === val ? ' selected' : ''}>${num(v)}</option>`).join('') }
const form = $('rx')
for (const eye of ['od', 'os']) {
  fill(form[`${eye}-sph`], range(-10, 6).reverse(), eye === 'od' ? -2.25 : -1.75)
  fill(form[`${eye}-cyl`], range(-4, 0).reverse(), eye === 'od' ? -0.5 : 0)
  fill(form[`${eye}-add`], range(0, 3.5), 0)
}
const eye = (e) => ({ sph: Number(form[`${e}-sph`].value), cyl: Number(form[`${e}-cyl`].value), ax: Number(form[`${e}-ax`].value), add: Number(form[`${e}-add`].value) })

function renderRecipe() {
  const od = eye('od'), os = eye('os')
  const issues = [...recipeProblems(od), ...recipeProblems(os)]
  if (issues.length) { $('explain').innerHTML = `<p class="issues">${[...new Set(issues)].join(' ')}</p>`; return }
  const lens = lensFor(od, os)
  $('explain').innerHTML = `
    <div class="eye"><h3>Jobb szem</h3><ul>${describe(od).map((t) => `<li>${t}</li>`).join('')}</ul></div>
    <div class="eye"><h3>Bal szem</h3><ul>${describe(os).map((t) => `<li>${t}</li>`).join('')}</ul></div>
    <div class="lens">
      <p class="lens-head">Ezt a lencsét ajánljuk</p>
      <p class="lens-index">${INDEX[lens.index][0]}<small>-${INDEX[lens.index][1]} index</small></p>
      <p>${lens.note}${lens.progressive ? ', multifokális kivitelben (távolra és közelre egyben)' : ''}.</p>
      <p class="lens-price">${ft(lens.pair)}<small> egy pár lencse, a keret ára ehhez jön</small></p>
    </div>`
}
form.addEventListener('change', renderRecipe)
form.addEventListener('input', renderRecipe)

// Keret az arcformához
const FACE_PATH = {
  kerek: '<circle cx="150" cy="170" r="122" />',
  ovalis: '<ellipse cx="150" cy="170" rx="108" ry="146" />',
  szogletes: '<rect x="36" y="34" width="228" height="272" rx="46" />',
  sziv: '<path d="M150 318 C 82 290 34 206 34 128 Q 34 34 150 34 Q 266 34 266 128 C 266 206 218 290 150 318 Z" />',
}
const lensShape = (kind, cx) => {
  if (kind === 'kerek') return `<circle cx="${cx}" cy="160" r="36" />`
  if (kind === 'szogletes') return `<rect x="${cx - 40}" y="132" width="80" height="58" rx="9" />`
  const s = cx < 150 ? -1 : 1
  if (kind === 'macskaszem') return `<path d="M${cx - 38 * s} 160 Q${cx - 34 * s} 132 ${cx} 134 Q${cx + 34 * s} 130 ${cx + 46 * s} 124 Q${cx + 40 * s} 186 ${cx} 186 Q${cx - 36 * s} 186 ${cx - 38 * s} 160 Z" />`
  return `<path d="M${cx - 40 * s} 136 Q${cx} 128 ${cx + 40 * s} 136 Q${cx + 40 * s} 196 ${cx + 6 * s} 196 Q${cx - 38 * s} 194 ${cx - 40 * s} 136 Z" />`
}
const state = { face: 'kerek', frame: 'szogletes' }
const chips = (el, name, items, val, ok) => {
  el.innerHTML = Object.entries(items).map(([id, x]) => `<label class="chip${ok && !ok.includes(id) ? ' meh' : ''}"><input type="radio" name="${name}" value="${id}"${id === val ? ' checked' : ''} /><span>${typeof x === 'string' ? x : x.name}${ok && ok.includes(id) ? ' ✓' : ''}</span></label>`).join('')
}
function renderMirror() {
  const f = FACES[state.face]
  chips($('faces'), 'face', FACES, state.face)
  chips($('frame-pick'), 'frame', FRAMES, state.frame, f.frames)
  const good = f.frames.includes(state.frame)
  $('mirror').innerHTML = `<g class="face">${FACE_PATH[state.face]}</g>
    <g class="features"><circle cx="105" cy="160" r="7" /><circle cx="195" cy="160" r="7" /><path d="M150 176 l-8 34 h16" /><path d="M118 246 q32 22 64 0" /></g>
    <g class="frame${good ? '' : ' meh'}">${lensShape(state.frame, 105)}${lensShape(state.frame, 195)}<path d="M141 154 q9 -8 18 0" /><path d="M${state.frame === 'kerek' ? 69 : 65} 152 L34 146" /><path d="M${state.frame === 'kerek' ? 231 : 235} 152 L266 146" /></g>`
  $('mirror-cap').textContent = `${f.name} arc, ${FRAMES[state.frame].toLowerCase()} kerettel`
  $('why').innerHTML = good
    ? `<b>Jó választás.</b> ${f.name} archoz ${f.why}.`
    : `Ez is mehet, de ${f.name.toLowerCase()} archoz inkább ${f.frames.map((k) => FRAMES[k].toLowerCase()).join(' vagy ')} keretet ajánlunk: ${f.why}.`
}
document.querySelector('.frames-text').addEventListener('change', (e) => {
  state[e.target.name] = e.target.value
  renderMirror()
  document.querySelector(`input[name="${e.target.name}"][value="${e.target.value}"]`)?.focus()
})

// Szemvizsgálat
const days = examSlots(new Date(), 4)
let dayIdx = Math.max(0, days.findIndex((d) => d.times.length))
let time = null
function renderExam() {
  $('day-tabs').innerHTML = days.map((d, i) => `<button type="button" role="tab" class="tab" data-i="${i}" aria-selected="${i === dayIdx}"${d.times.length ? '' : ' disabled'}>${DAYS[d.date.getDay()]}<small>${MONTHS[d.date.getMonth()]} ${d.date.getDate()}.</small></button>`).join('')
  const d = days[dayIdx]
  $('times').innerHTML = d?.times.length
    ? d.times.map((m) => `<button type="button" class="time" data-m="${m}" aria-pressed="${time === m}">${clock(m)}</button>`).join('')
    : '<p>Erre a napra már nincs szabad időpont.</p>'
}
$('day-tabs').addEventListener('click', (e) => { const b = e.target.closest('.tab'); if (!b || b.disabled) return; dayIdx = Number(b.dataset.i); time = null; renderExam(); document.querySelector(`.tab[data-i="${dayIdx}"]`).focus() })
$('times').addEventListener('click', (e) => { const b = e.target.closest('.time'); if (!b) return; time = Number(b.dataset.m); renderExam(); document.querySelector(`.time[data-m="${time}"]`).focus() })
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
  $('done-body').innerHTML = `<h2 id="done-title" tabindex="-1">Várjuk: ${MONTHS[d.getMonth()]} ${d.getDate()}., ${DAYS[d.getDay()]}, ${clock(time)}</h2>
    <p>Ha van régi szemüvege vagy receptje, hozza magával. Előtte nap SMS-ben emlékeztetjük.</p>
    <article class="slip"><p class="slip-head">Az optika naptárában</p><p class="slip-main">${DAYS[d.getDay()]} ${clock(time)} · szemvizsgálat, 20 perc</p><p>${esc(f.name)} · <a href="tel:${esc(f.phone.replace(/[^\d+]/g, ''))}">${esc(f.phone)}</a></p></article>
    <form method="dialog"><button class="btn">Rendben</button></form>`
  $('done').showModal()
  $('done-title').focus()
})

// Hero: a tábla homályos, a lencse alatt éles. A lencsét húzni lehet (egér, ujj), vagy nyilakkal mozgatni.
const stage = $('stage')
$('chart-sharp').innerHTML = $('chart').innerHTML
const setLens = (x, y) => {
  stage.style.setProperty('--lx', `${Math.min(92, Math.max(8, x)).toFixed(1)}%`)
  stage.style.setProperty('--ly', `${Math.min(90, Math.max(10, y)).toFixed(1)}%`)
}
const lens = $('lens')
let drag = null
lens.addEventListener('pointerdown', (e) => {
  drag = stage.getBoundingClientRect()
  lens.setPointerCapture(e.pointerId)
  stage.classList.add('dragging')
})
lens.addEventListener('pointermove', (e) => {
  if (!drag) return
  setLens(((e.clientX - drag.left) / drag.width) * 100, ((e.clientY - drag.top) / drag.height) * 100)
})
const stop = () => { drag = null; stage.classList.remove('dragging') }
lens.addEventListener('pointerup', stop)
lens.addEventListener('pointercancel', stop)
lens.addEventListener('keydown', (e) => {
  const step = { ArrowLeft: [-4, 0], ArrowRight: [4, 0], ArrowUp: [0, -5], ArrowDown: [0, 5] }[e.key]
  if (!step) return
  e.preventDefault()
  const cs = getComputedStyle(stage)
  setLens(parseFloat(cs.getPropertyValue('--lx')) + step[0], parseFloat(cs.getPropertyValue('--ly')) + step[1])
})
// Betöltéskor a lencse jobbról beúszik a tábla közepére (a CSS @property-vel átmenetes).
requestAnimationFrame(() => requestAnimationFrame(() => setLens(innerWidth >= 900 ? 72 : 50, innerWidth >= 900 ? 46 : 40)))

renderRecipe()
renderMirror()
renderExam()
