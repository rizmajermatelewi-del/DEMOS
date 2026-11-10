import '@fontsource-variable/overpass'
import './style.css'
import { BASE, PRICES, roadKm, etaMinutes, priceRange, shareText, smsLink, waLink, fromKmPost, kmRange, forint } from './logic.js'

const $ = (id) => document.getElementById(id)
const status = $('status')
const result = $('result')
let spot = null // { lat, lng, accuracy?, label }

$('p-callout').textContent = forint(PRICES.callout)
$('p-km').textContent = forint(PRICES.perKm)

function render() {
  if (!spot) return
  const toCarKm = roadKm(BASE, spot)
  const tow = document.querySelector('input[name=tow]:checked').value === 'tow'
  const p = priceRange({ toCarKm, towKm: tow ? toCarKm : 0 })
  $('r-where').textContent = spot.label
  $('r-eta').textContent = `kb. ${etaMinutes(toCarKm)} perc (${toCarKm} km Ceglédtől)`
  $('r-price').textContent = `${forint(p.low)} – ${forint(p.high)}${p.night ? ' (éjszakai díj)' : ''}`
  const text = shareText({ ...spot, note: $('note').value })
  $('sms').href = smsLink(text)
  $('wa').href = waLink(text)
  $('copy').dataset.text = text
}

function show(next) {
  spot = next
  result.hidden = false
  render()
  result.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' })
  $('result-title').focus({ preventScroll: true })
}

$('locate').addEventListener('click', () => {
  if (!('geolocation' in navigator)) {
    status.textContent = 'Ez a böngésző nem tudja megadni a helyet. Írja be lent a kilométerkövet, vagy hívjon.'
    return
  }
  status.textContent = 'Helyet kérünk a telefontól… (engedélyezze a felugró ablakban)'
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      status.textContent = ''
      show({
        lat: coords.latitude,
        lng: coords.longitude,
        accuracy: coords.accuracy,
        label: `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)} (±${Math.round(coords.accuracy)} m)`,
      })
    },
    (err) => {
      status.textContent =
        err.code === err.PERMISSION_DENIED
          ? 'Nem engedélyezte a helymegosztást. Semmi gond: írja be lent a kilométerkövet, vagy hívjon.'
          : 'Most nem sikerült a helyet lekérni. Írja be lent a kilométerkövet, vagy hívjon.'
      $('km').focus()
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
  )
})

for (const el of document.querySelectorAll('input[name=tow]')) el.addEventListener('change', render)
$('note').addEventListener('input', render)

$('copy').addEventListener('click', async (e) => {
  const btn = e.currentTarget
  try {
    await navigator.clipboard.writeText(btn.dataset.text ?? '')
    btn.textContent = 'Kimásolva ✓'
  } catch {
    btn.textContent = 'Nem sikerült, hívjon'
  }
  setTimeout(() => (btn.textContent = 'Másolom'), 2500)
})

// Kilométerkő: a tábla élőben mutatja, amit beír.
const road = $('road')
const km = $('km')
const syncPost = () => {
  $('post-road').textContent = road.value
  $('post-km').textContent = km.value || '–'
}
road.addEventListener('change', syncPost)
km.addEventListener('input', syncPost)

$('km-form').addEventListener('submit', (e) => {
  e.preventDefault()
  const n = Number(km.value.replace(',', '.'))
  const pos = fromKmPost(road.value, n)
  const [lo, hi] = kmRange(road.value)
  if (!pos) {
    $('km-error').textContent = `Az ${road.value} ${lo} és ${hi} km közötti szakaszán dolgozunk. Ha máshol áll, hívjon, megoldjuk.`
    return
  }
  $('km-error').textContent = ''
  show({ ...pos, label: `${road.value}, ${n} km-nél (a kőből becsülve)` })
})

// Nem sürgős szállítás: kiszállás + km, nappali díj.
const planKm = $('plan-km')
const plan = () => {
  const n = Math.max(1, Math.min(500, Math.round(Number(planKm.value) || 0)))
  const p = priceRange({ toCarKm: 0, towKm: n, at: new Date(2026, 0, 5, 12) })
  $('plan-out').textContent = `${n} km: kb. ${forint(p.low)} – ${forint(p.high)}, nappal.`
}
planKm.addEventListener('input', plan)
$('plan').addEventListener('submit', (e) => e.preventDefault())
plan()
