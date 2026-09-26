import '@fontsource/archivo/400.css'
import '@fontsource/archivo/600.css'
import '@fontsource/archivo/800.css'
import '@fontsource/caveat/600.css'
import './style.css'
import { clampSize, cutList, doorsFor, MATERIALS, quote, quoteProblems } from './cabinet.js'

const $ = (id) => document.getElementById(id)
const ft = (n) => `${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} Ft`
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches

// Drawing scale: 1.05 px per cm, cabinet stands on the floor line at the left.
const S = 1.05
const X0 = 90
const Y0 = 310

const spec = $('spec')
const svg = $('drawing')
let shelves = 4

function read() {
  const data = new FormData(spec)
  const w = clampSize(data.get('w'))
  const h = clampSize(data.get('h'))
  const maxShelves = Math.floor(h / 20)
  shelves = Math.min(shelves, maxShelves)
  return {
    w,
    h,
    d: Number(data.get('d')),
    shelves,
    doors: data.get('doors') ? doorsFor(w) : 0,
    material: data.get('m'),
    maxShelves,
  }
}

function paint() {
  const s = read()
  const x1 = X0 + s.w * S
  const y1 = Y0 - s.h * S
  const m = MATERIALS[s.material]
  $('grain-base').setAttribute('fill', m.base)
  $('grain-line').setAttribute('stroke', m.grain)

  const parts = [`<rect class="ink" pathLength="1" x="${X0}" y="${y1}" width="${s.w * S}" height="${s.h * S}" fill="url(#grain)"/>`]
  const inner = s.h * S - 2 * 1.8 * S
  for (let i = 1; i <= s.shelves; i++) {
    const y = y1 + 1.8 * S + (inner * i) / (s.shelves + 1)
    parts.push(`<line class="${s.doors ? 'shelf hidden-line' : 'shelf ink'}" pathLength="1" x1="${X0 + 2}" x2="${x1 - 2}" y1="${y}" y2="${y}"/>`)
  }
  for (let i = 0; i < s.doors; i++) {
    const dw = (s.w * S) / s.doors
    const dx = X0 + i * dw
    parts.push(`<rect class="door ink" pathLength="1" x="${dx + 1.5}" y="${y1 + 1.5}" width="${dw - 3}" height="${s.h * S - 3}"/>`)
    // Pairs of doors meet in the middle; an odd last door opens from the right edge.
    const knobX = i % 2 === 1 ? dx + 7 : dx + dw - 7
    parts.push(`<rect class="knob" x="${knobX - 1.5}" y="${y1 + (s.h * S) / 2 - 9}" width="3" height="18" rx="1.5"/>`)
  }
  if (s.shelves) {
    const gap = Math.round((s.h - 3.6) / (s.shelves + 1))
    parts.push(`<text class="pencil" x="${x1 + 14}" y="${y1 + 26}">polcköz ~${gap} cm</text>`)
  }
  parts.push(`<text class="pencil" x="${x1 + 14}" y="${y1 + (s.shelves ? 48 : 26)}">mélység ${s.d} cm</text>`)
  $('cabinet').innerHTML = parts.join('')

  // Dimension lines: width under the floor, height on the left
  $('dims').innerHTML = `
    <line x1="${X0}" x2="${x1}" y1="332" y2="332"/><line x1="${X0}" x2="${X0}" y1="324" y2="340"/><line x1="${x1}" x2="${x1}" y1="324" y2="340"/>
    <text x="${(X0 + x1) / 2}" y="352" text-anchor="middle">${s.w} cm</text>
    <line x1="${X0 - 26}" x2="${X0 - 26}" y1="${y1}" y2="${Y0}"/><line x1="${X0 - 34}" x2="${X0 - 18}" y1="${y1}" y2="${y1}"/><line x1="${X0 - 34}" x2="${X0 - 18}" y1="${Y0}" y2="${Y0}"/>
    <text x="${X0 - 34}" y="${(y1 + Y0) / 2}" text-anchor="middle" transform="rotate(-90 ${X0 - 34} ${(y1 + Y0) / 2})" dy="-4">${s.h} cm</text>`

  $('handle-w').setAttribute('cx', x1)
  $('handle-w').setAttribute('cy', Y0 - (s.h * S) / 2)
  $('handle-h').setAttribute('cx', (X0 + x1) / 2)
  $('handle-h').setAttribute('cy', y1)

  $('shelves-out').textContent = s.shelves
  spec.querySelector('[data-step="1"]').disabled = s.shelves >= s.maxShelves
  spec.querySelector('[data-step="-1"]').disabled = s.shelves === 0

  const q = quote(s, s.material)
  $('price').textContent = ft(q.total)
  $('cuts').innerHTML = cutList(s)
    .map((p) => `<tr><td>${p.name}</td><td>${p.qty}</td><td>${p.a} × ${p.b}</td></tr>`)
    .join('')
  return { ...s, total: q.total }
}

// Typed sizes are clamped when the field is left, so typing "1" then "20" is not fought.
for (const id of ['w', 'h']) {
  $(id).addEventListener('change', () => {
    $(id).value = clampSize($(id).value)
    paint()
  })
}
spec.addEventListener('input', (e) => {
  if (e.target.type !== 'number') paint()
})
spec.addEventListener('click', (e) => {
  const b = e.target.closest('[data-step]')
  if (!b) return
  shelves = Math.max(0, shelves + Number(b.dataset.step))
  paint()
})

// Drag handles: pointer position in drawing units, snapped to whole centimetres.
function toSvg(e) {
  const pt = svg.createSVGPoint()
  pt.x = e.clientX
  pt.y = e.clientY
  return pt.matrixTransform(svg.getScreenCTM().inverse())
}
for (const [id, axis] of [['handle-w', 'w'], ['handle-h', 'h']]) {
  const handle = $(id)
  handle.addEventListener('pointerdown', (e) => {
    handle.setPointerCapture(e.pointerId)
    svg.classList.add('dragging')
  })
  handle.addEventListener('pointermove', (e) => {
    if (!handle.hasPointerCapture(e.pointerId)) return
    const p = toSvg(e)
    const cm = axis === 'w' ? (p.x - X0) / S : (Y0 - p.y) / S
    const next = clampSize(cm)
    if (String(next) !== $(axis).value) {
      $(axis).value = next
      paint()
    }
  })
  handle.addEventListener('pointerup', () => svg.classList.remove('dragging'))
}

paint()

// The pencil draws the cabinet once the board scrolls into view.
if (!reduce) {
  svg.classList.add('undrawn')
  new IntersectionObserver(
    (entries, io) => {
      if (!entries[0].isIntersecting) return
      io.disconnect()
      svg.classList.replace('undrawn', 'drawing-in')
      // Repaints replace the elements, so drop the class before a drag would redraw them.
      setTimeout(() => svg.classList.remove('drawing-in'), 1800)
    },
    { threshold: 0.3 },
  ).observe(svg)
}

// Attach the drawing to the quote form
const attached = $('attached')
$('to-quote').addEventListener('click', () => {
  const s = paint()
  const parts = [`${s.w} × ${s.h} × ${s.d} cm`, MATERIALS[s.material].name.toLowerCase(), `${s.shelves} polc`, s.doors ? `${s.doors} ajtó` : 'nyitott']
  attached.textContent = `Csatolt rajz: ${parts.join(', ')}, kb. ${ft(s.total)}`
  attached.hidden = false
})

const form = $('quote-form')
const status = $('form-status')
form.addEventListener('submit', (e) => {
  e.preventDefault()
  status.hidden = true
  const found = quoteProblems(Object.fromEntries(new FormData(form)))
  let first = null
  for (const id of ['name', 'phone', 'city']) {
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
  status.hidden = false
  status.textContent = `Megkaptuk${attached.hidden ? '' : ', a rajzzal együtt'}. Ez a bemutató nem küld üzenetet; élesben egy munkanapon belül visszahívnánk, és egyeztetnénk a felmérést.`
  for (const id of ['name', 'phone', 'city', 'note']) form.elements[id].value = ''
})
