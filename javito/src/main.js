import '@fontsource/jetbrains-mono/500.css'
import '@fontsource/jetbrains-mono/800.css'
import '@fontsource/ibm-plex-sans/400.css'
import '@fontsource/ibm-plex-sans/600.css'
import './style.css'
import mobile from '@phosphor-icons/core/assets/bold/device-mobile-bold.svg?raw'
import laptop from '@phosphor-icons/core/assets/bold/laptop-bold.svg?raw'
import tablet from '@phosphor-icons/core/assets/bold/device-tablet-bold.svg?raw'
import battery from '@phosphor-icons/core/assets/bold/battery-charging-bold.svg?raw'
import plug from '@phosphor-icons/core/assets/bold/plug-bold.svg?raw'
import drop from '@phosphor-icons/core/assets/bold/drop-bold.svg?raw'
import power from '@phosphor-icons/core/assets/bold/power-bold.svg?raw'
import slow from '@phosphor-icons/core/assets/bold/monitor-play-bold.svg?raw'
import { DEVICES, FAULTS, STAGES, estimate, printPrice, track } from './logic.js'

const ICONS = { 'device-mobile': mobile, laptop, 'device-tablet': tablet, 'battery-charging': battery, plug, drop, power, 'monitor-play': slow }
const icon = (n) => ICONS[n].replace('<svg', '<svg aria-hidden="true" focusable="false"')
const $ = (id) => document.getElementById(id)
const ft = (n) => `${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} Ft`
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
const DAYS = ['vasárnap', 'hétfő', 'kedd', 'szerda', 'csütörtök', 'péntek', 'szombat']
const MONTHS = ['jan.', 'febr.', 'márc.', 'ápr.', 'máj.', 'jún.', 'júl.', 'aug.', 'szept.', 'okt.', 'nov.', 'dec.']
const day = (d) => `${MONTHS[d.getMonth()]} ${d.getDate()}., ${DAYS[d.getDay()]}`

const state = { device: 'telefon', brand: 'Samsung', fault: 'kijelzo' }

function radios(el, name, items, val, tile) {
  el.innerHTML = items.map(([id, label, ic]) => `<label class="${tile ? 'tile' : 'chip'}"><input type="radio" name="${name}" value="${esc(id)}"${id === val ? ' checked' : ''} /><span>${ic ? icon(ic) : ''}${label}</span></label>`).join('')
}
function renderPick() {
  radios($('devices'), 'device', Object.entries(DEVICES).map(([id, d]) => [id, d.name, d.icon]), state.device, true)
  const brands = DEVICES[state.device].brands
  if (!brands.includes(state.brand)) state.brand = brands[0]
  radios($('brands'), 'brand', brands.map((b) => [b, b]), state.brand)
  radios($('faults'), 'fault', Object.entries(FAULTS).map(([id, f]) => [id, f.name, f.icon]), state.fault, true)
  renderReceipt()
}
$('pick').addEventListener('change', (e) => {
  state[e.target.name] = e.target.value
  if (e.target.name === 'device') { renderPick(); document.querySelector(`input[name="device"][value="${state.device}"]`).focus() } else renderReceipt()
})

function renderReceipt() {
  const now = new Date()
  const e = estimate(state.device, state.brand, state.fault, now)
  const when = e.ready.kind === 'ma' ? 'ma 17:00-ra kész' : e.ready.kind === 'kovetkezo' ? `${day(e.ready.date)} délutánra kész` : `alkatrész rendelve, ${day(e.ready.date)}`
  $('receipt').innerHTML = `
    <p class="r-head">CSAVAR SZERVIZ<br />ÁRBECSLÉS</p>
    <p class="r-line"><span>Eszköz</span><span>${DEVICES[state.device].name}, ${esc(state.brand)}</span></p>
    <p class="r-line"><span>Hiba</span><span>${FAULTS[state.fault].name}</span></p>
    <p class="r-line"><span>Alkatrész</span><span class="${e.stock ? 'ok' : 'warn'}">${e.stock ? 'raktáron' : 'rendelni kell'}</span></p>
    <p class="r-line"><span>Bevizsgálás</span><span>0 Ft*</span></p>
    <p class="r-total"><span>Várható ár</span><b>${ft(e.low)} – ${ft(e.high)}</b></p>
    <p class="r-when">${when}</p>
    <p class="r-note">* Ha nálunk javíttatja. A pontos árat bevizsgálás után mondjuk, és csak az Ön jóváhagyásával kezdünk neki.</p>
    <a class="btn" href="tel:+36305550164">Hozom, hívom előtte</a>`
}

// Munkalap-követés
function showTrack(code) {
  const t = track(code)
  const out = $('stages')
  if (!t) { out.innerHTML = `<li class="bad">A munkalapszám így néz ki: CS-1234. A papíron, a vonalkód fölött találja.</li>`; return }
  out.innerHTML = STAGES.map((s, i) => `<li class="${i < t.stage ? 'past' : i === t.stage ? 'now' : ''}"${i === t.stage ? ' aria-current="step"' : ''}><span class="stamp">${i <= t.stage ? 'OK' : ''}</span>${s}${i === t.stage && t.done ? ' · hívtuk SMS-ben' : ''}</li>`).join('')
  out.insertAdjacentHTML('afterbegin', `<li class="code-line">${t.code}</li>`)
}
$('track-form').addEventListener('submit', (e) => { e.preventDefault(); showTrack($('code').value) })
document.querySelectorAll('.demo-code').forEach((b) => b.addEventListener('click', () => { $('code').value = b.textContent; showTrack(b.textContent) }))

// Nyomtatás
function renderCalc() {
  const p = printPrice(Number($('pages').value), $('color').checked, $('duplex').checked)
  $('calc-out').innerHTML = p.total ? `<b>${ft(p.total)}</b> · ${p.sheets} lap${p.discount ? ' · 100 oldaltól 20% kedvezmény' : ''}` : 'Adja meg az oldalak számát.'
}
$('calc').addEventListener('input', renderCalc)
$('calc').addEventListener('submit', (e) => e.preventDefault())

renderPick()
renderCalc()
