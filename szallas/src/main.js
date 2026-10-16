import '@fontsource/sofia-sans/400.css'
import '@fontsource/sofia-sans/600.css'
import '@fontsource/sofia-sans-condensed/700.css'
import '@fontsource/sofia-sans-condensed/800.css'
import '@fontsource/caveat/500.css'
import './style.css'
import phone from '@phosphor-icons/core/assets/regular/phone.svg?raw'
import envelope from '@phosphor-icons/core/assets/regular/envelope-simple.svg?raw'
import minus from '@phosphor-icons/core/assets/regular/minus.svg?raw'
import plus from '@phosphor-icons/core/assets/regular/plus.svg?raw'
import dog from '@phosphor-icons/core/assets/regular/dog.svg?raw'
import check from '@phosphor-icons/core/assets/regular/check.svg?raw'
import x from '@phosphor-icons/core/assets/regular/x.svg?raw'
import bed from '@phosphor-icons/core/assets/regular/bed.svg?raw'
import users from '@phosphor-icons/core/assets/regular/users.svg?raw'
import ruler from '@phosphor-icons/core/assets/regular/ruler.svg?raw'
import bicycle from '@phosphor-icons/core/assets/regular/bicycle.svg?raw'
import car from '@phosphor-icons/core/assets/regular/car.svg?raw'
import footprints from '@phosphor-icons/core/assets/regular/footprints.svg?raw'
import padlas from './assets/szoba-padlas.webp'
import kandallo from './assets/szoba-kandallo.webp'
import kert from './assets/szoba-kert.webp'
import este from './assets/szoba-este.webp'
import { ROOMS, addDays, firstOpen, problems, quote, roomFree, MIN_NIGHTS, BREAKFAST } from './stay.js'

const ICONS = { phone, 'envelope-simple': envelope, minus, plus, dog, check, x, bed, users, ruler, bicycle, car, footprints }
const PHOTOS = { 'szoba-padlas': padlas, 'szoba-kandallo': kandallo, 'szoba-kert': kert, 'szoba-este': este }
const icon = (name) => ICONS[name].replace('<svg', '<svg aria-hidden="true" focusable="false"')
const paintIcons = (root = document) => root.querySelectorAll('i[data-icon]').forEach((el) => { el.outerHTML = icon(el.dataset.icon) })

const $ = (id) => document.getElementById(id)
const ft = (n) => `${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} Ft`
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
const DAYS = ['vasárnap', 'hétfő', 'kedd', 'szerda', 'csütörtök', 'péntek', 'szombat']
const MONTHS = ['jan.', 'febr.', 'márc.', 'ápr.', 'máj.', 'jún.', 'júl.', 'aug.', 'szept.', 'okt.', 'nov.', 'dec.']
const huDay = (iso) => { const d = new Date(`${iso}T12:00:00Z`); return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}., ${DAYS[d.getUTCDay()]}` }
// okt. 21-től, okt. 23-tól: a rag a szám kiejtett végéhez igazodik (három, hat, nyolc, húsz, harminc: -tól).
const tol = (n) => ([20, 30].includes(n) || [3, 6, 8].includes(n % 10) ? 'tól' : 'től')
const huFrom = (iso) => { const d = new Date(`${iso}T12:00:00Z`); const n = d.getUTCDate(); return `${MONTHS[d.getUTCMonth()]} ${n}-${tol(n)}` }
// 1-es, 2-es, 3-as, 4-es kulcs
const nth = (n) => `${n}-${({ 3: 'as', 5: 'ös', 6: 'os', 8: 'as' })[n] ?? 'es'}`
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])

const local = new Date()
const today = `${local.getFullYear()}-${String(local.getMonth() + 1).padStart(2, '0')}-${String(local.getDate()).padStart(2, '0')}`
const LIMITS = { nights: [1, 14], adults: [1, 3], kids: [0, 2] }

const state = { arrival: firstOpen(addDays(today, 3), MIN_NIGHTS, 2), nights: MIN_NIGHTS, adults: 2, kids: 0, dog: false, breakfast: false, room: null }
const stay = () => ({ arrival: state.arrival, nights: state.nights, adults: state.adults, kids: state.kids, dog: state.dog, breakfast: state.breakfast })

// A recepciós pult
const arrival = $('arrival')
arrival.min = today
arrival.value = state.arrival
arrival.addEventListener('change', () => { if (arrival.value) { state.arrival = arrival.value; render() } })
document.querySelectorAll('.stepper').forEach((box) => {
  const name = box.dataset.for
  box.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-step]')
    if (!b) return
    const [lo, hi] = LIMITS[name]
    state[name] = Math.min(hi, Math.max(lo, state[name] + Number(b.dataset.step)))
    render()
  })
})
$('dog').addEventListener('change', (e) => { state.dog = e.target.checked; render() })

// Ha a kiválasztott szoba nem jó (foglalt, kicsi, kutya), az első jó szoba lesz kijelölve.
function pickRoom() {
  const ok = (r) => problems(r, stay(), today).length === 0
  if (state.room && ok(state.room)) return
  state.room = ROOMS.find(ok) ?? state.room ?? ROOMS[0]
}

function nextFree(room) {
  for (let i = 1; i < 90; i++) {
    const d = addDays(state.arrival, i)
    if (roomFree(room.id, d, state.nights)) return d
  }
  return null
}

const KEY_METAL = `<svg class="metal" viewBox="0 0 24 70" aria-hidden="true"><circle cx="12" cy="10" r="7.5" /><circle cx="12" cy="10" r="3.2" class="hole" /><path d="M10.4 17h3.2v41h-3.2z M13.6 46h5v3.4h-5z M13.6 52h3.6v3.4h-3.6z" /></svg>`

function renderBoard() {
  const s = stay()
  $('board').innerHTML = ROOMS.map((r) => {
    const free = roomFree(r.id, s.arrival, s.nights)
    if (!free) {
      const next = nextFree(r)
      return `<div class="hook is-empty" role="listitem"><span class="nail" aria-hidden="true"></span>
        <p class="chalk" aria-hidden="true"><b>${r.id}</b> foglalt${next ? `<br />szabad: <span>${huFrom(next)}</span>` : ''}</p>
        <span class="sr-only">${nth(r.id)} szoba, ${r.name}: a kiválasztott napokra foglalt.</span></div>`
    }
    const issue = problems(r, s, today).filter((p) => !/foglalt|múltban|éjszakára/.test(p))
    const short = issue.length ? (/kutya/i.test(issue[0]) ? 'kutyával nem' : `csak ${r.sleeps} fő`) : ''
    const sel = state.room?.id === r.id
    return `<div class="hook" role="listitem"><span class="nail" aria-hidden="true"></span>
      <button type="button" class="key${sel ? ' is-picked' : ''}${short ? ' is-nofit' : ''}" data-room="${r.id}" aria-pressed="${sel}"
        aria-label="${nth(r.id)} kulcs, ${r.name}, szabad${short ? `, de ${short}` : ''}">
        <span class="ring" aria-hidden="true"></span>${KEY_METAL}
        <span class="fob" aria-hidden="true"><b>${r.id}</b><small>${r.name}</small></span>
        ${short ? `<span class="nofit" aria-hidden="true">${short}</span>` : ''}
      </button></div>`
  }).join('')
}
$('board').addEventListener('click', (e) => {
  const b = e.target.closest('.key')
  if (!b) return
  state.room = ROOMS.find((r) => r.id === Number(b.dataset.room))
  render({ keepRoom: true })
  document.querySelector(`.key[data-room="${state.room.id}"]`)?.focus()
  if (matchMedia('(max-width: 899px)').matches) $('room').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
})

function renderRoom() {
  const r = state.room
  const s = stay()
  const q = quote(r, s)
  const issues = problems(r, s, today)
  $('room').innerHTML = `
    <img src="${PHOTOS[r.photo]}" alt="A ${esc(r.name)} belülről" width="1200" height="800" />
    <div class="room-body">
      <p class="room-no">${nth(r.id)} kulcs</p>
      <h3>${r.name}</h3>
      <ul class="facts">
        <li>${icon('users')}${r.sleeps} fő</li>
        <li>${icon('ruler')}${r.size} m²</li>
        <li>${icon('bed')}${r.beds}</li>
      </ul>
      <ul class="perks">${r.perks.map((p) => `<li>${p}</li>`).join('')}</ul>
      <div class="ticket">
        <p class="ticket-dates">${huDay(s.arrival)} → ${huDay(addDays(s.arrival, s.nights))}</p>
        <label class="check small-check"><input type="checkbox" id="breakfast"${s.breakfast ? ' checked' : ''} /><span>Reggelit kérünk (${ft(BREAKFAST)} / fő / reggel)</span></label>
        <dl>
          ${q.lines.map((l) => `<div><dt>${l.label}</dt><dd>${ft(l.amount)}</dd></div>`).join('')}
          <div><dt>IFA (${s.adults} felnőtt × ${s.nights} éj)</dt><dd>${ft(q.ifa)}</dd></div>
          <div class="sum"><dt>Összesen, közvetlenül</dt><dd>${ft(q.total)}</dd></div>
        </dl>
        ${issues.length
          ? `<p class="issues" role="alert">${issues.join(' ')}</p>`
          : `<button type="button" class="btn" id="ask">Foglalási kérés: ${r.name}</button><p class="small">Most nem kell fizetni. 24 órán belül visszaírunk, a 30% előleggel lesz végleges.</p>`}
      </div>
    </div>`
  $('breakfast').addEventListener('change', (e) => { state.breakfast = e.target.checked; render({ keepRoom: true }); $('breakfast').focus() })
  $('ask')?.addEventListener('click', openRequest)
}

function renderCompare() {
  const q = quote(state.room, stay())
  const pct = Math.round((q.total / q.portal) * 100)
  $('compare').innerHTML = `
    <figcaption>${state.room.name}, ${state.nights} éj, ${state.adults + state.kids} fő</figcaption>
    <div class="bar portal"><span>Foglalási portálon</span><b>${ft(q.portal)}</b><i style="--w:100%"></i></div>
    <div class="bar here"><span>Közvetlenül nálunk</span><b>${ft(q.total)}</b><i style="--w:${pct}%"></i></div>
    <p class="saving">Önnél marad: <b>${ft(q.saving)}</b></p>
    <p class="small">Mintaszámítás: a portálár a szállásdíj plusz a jutalék, az IFA mindkettőben ugyanannyi.</p>`
}

function renderDesk() {
  for (const k of ['nights', 'adults', 'kids']) {
    $(k).textContent = state[k]
    const [lo, hi] = LIMITS[k]
    const [dec, inc] = document.querySelectorAll(`.stepper[data-for="${k}"] button`)
    dec.disabled = state[k] <= lo
    inc.disabled = state[k] >= hi
  }
  const free = ROOMS.filter((r) => roomFree(r.id, state.arrival, state.nights)).length
  const fits = ROOMS.some((r) => problems(r, stay(), today).length === 0)
  const out = $('desk-out')
  out.textContent = `${huDay(state.arrival)} → ${huDay(addDays(state.arrival, state.nights))} · ${free ? `${free} kulcs lóg a táblán` : 'erre az időre minden szoba foglalt'}`
  // Ha így egy szoba sem jó (foglalt, kicsi, kutya), megmutatjuk az első érkezést, amikor igen.
  const next = !fits && state.nights >= MIN_NIGHTS && nextFit()
  if (next) {
    out.append(document.createElement('br'), `Így legközelebb ${huDay(next)} érkezéssel van hely. `)
    const jump = Object.assign(document.createElement('button'), { type: 'button', className: 'jump', textContent: 'Erre a napra nézem' })
    jump.addEventListener('click', () => { state.arrival = next; arrival.value = next; render(); $('desk-out').focus() })
    out.append(jump)
  }
}

function nextFit() {
  for (let i = 1; i <= 120; i++) {
    const d = addDays(state.arrival, i)
    if (ROOMS.some((r) => problems(r, { ...stay(), arrival: d }, today).length === 0)) return d
  }
  return null
}

function render({ keepRoom = false } = {}) {
  if (!keepRoom) pickRoom()
  renderDesk()
  renderBoard()
  renderRoom()
  renderCompare()
}

// Foglalási kérés: semmi nem megy ki, a végén megmutatja, mit kapna a vendég és mit a gazda.
const dialog = $('request')
function openRequest() {
  const r = state.room
  const q = quote(r, stay())
  $('request-body').innerHTML = `
    <h2 id="request-title">Foglalási kérés</h2>
    <p class="request-sum">${r.name} · ${huDay(state.arrival)} → ${huDay(addDays(state.arrival, state.nights))} · <b>${ft(q.total)}</b></p>
    <form id="req-form" class="req-form" novalidate>
      <label class="field"><span>Név</span><input name="name" autocomplete="name" required /></label>
      <label class="field"><span>E-mail</span><input name="email" type="email" autocomplete="email" required /></label>
      <label class="field"><span>Telefon</span><input name="phone" type="tel" autocomplete="tel" required /></label>
      <label class="field"><span>Mikorra érnek ide?</span>
        <select name="eta"><option>15 és 17 óra között</option><option>17 és 20 óra között</option><option>20 óra után (kulcsdobozzal)</option></select></label>
      <fieldset class="field pay wide"><legend>Az előleget így fizetném</legend>
        <label class="check"><input type="radio" name="pay" value="átutalással" checked /><span>átutalással</span></label>
        <label class="check"><input type="radio" name="pay" value="SZÉP-kártyával" /><span>SZÉP-kártyával</span></label>
      </fieldset>
      <label class="field wide"><span>Megjegyzés (nem kötelező)</span><textarea name="note" rows="2" placeholder="pl. kiságyat kérnénk"></textarea></label>
      <label class="check wide consent"><input type="checkbox" name="consent" required /><span>Hozzájárulok, hogy az adataimat a foglalás intézéséhez kezeljék.</span></label>
      <p class="issues wide" id="req-err" role="alert" hidden></p>
      <button class="btn wide">Kérés elküldése</button>
      <p class="small wide">Bemutató: a kérés nem megy el sehova.</p>
    </form>`
  $('req-form').addEventListener('submit', submitRequest)
  dialog.showModal()
  dialog.querySelector('input[name="name"]').focus()
}

function submitRequest(e) {
  e.preventDefault()
  const d = Object.fromEntries(new FormData(e.target))
  const missing = []
  if (!d.name?.trim()) missing.push('a nevét')
  if (!/^\S+@\S+\.\S+$/.test(d.email ?? '')) missing.push('egy érvényes e-mail-címet')
  if ((d.phone ?? '').replace(/\D/g, '').length < 8) missing.push('a telefonszámát')
  if (!d.consent) missing.push('a hozzájárulást')
  if (missing.length) {
    const err = $('req-err')
    err.hidden = false
    err.textContent = `Kérjük, adja meg ${missing.join(', ')}.`
    return
  }
  const r = state.room
  const s = stay()
  const q = quote(r, s)
  const deposit = Math.round(q.total * 0.3 / 100) * 100
  const when = `${huDay(s.arrival)} → ${huDay(addDays(s.arrival, s.nights))}`
  const who = `${s.adults} felnőtt${s.kids ? `, ${s.kids} gyerek` : ''}${s.dog ? ', kutya' : ''}`
  $('request-body').innerHTML = `
    <h2 id="request-title" tabindex="-1">Megkaptuk a kérést</h2>
    <p class="request-sum">Így néz ki a két oldalról: amit Ön kap, és amit a gazda lát a telefonján.</p>
    <div class="mails">
      <article class="mail">
        <p class="mail-head">Az Ön e-mailje · ${esc(d.email)}</p>
        <h3>Foglalási kérését megkaptuk</h3>
        <p>${r.name}, ${when}, ${who}${s.breakfast ? ', reggelivel' : ''}.</p>
        <p>Végösszeg: <b>${ft(q.total)}</b> (ebből IFA ${ft(q.ifa)}). 24 órán belül visszaigazoljuk, a foglalás a <b>${ft(deposit)}</b> előleg ${esc(d.pay)} történő befizetésével lesz végleges.</p>
      </article>
      <article class="mail owner">
        <p class="mail-head">A gazda telefonján · új kérés</p>
        <h3>${nth(r.id)} kulcs: ${r.name}</h3>
        <ul>
          <li><b>${when}</b> · ${s.nights} éj</li>
          <li>${esc(d.name)} · ${who}</li>
          <li><a href="tel:${esc(d.phone.replace(/[^\d+]/g, ''))}">${esc(d.phone)}</a> · ${esc(d.email)}</li>
          <li>Érkezés: ${esc(d.eta)} · előleg ${esc(d.pay)}</li>
          ${d.note?.trim() ? `<li>„${esc(d.note.trim())}”</li>` : ''}
          <li>Összesen ${ft(q.total)} · <b>jutalék: 0 Ft</b> (portálon kb. ${ft(Math.round(q.stay * 0.15 / 100) * 100)} lenne)</li>
        </ul>
        <div class="owner-actions"><span class="pill ok">Elfogad, kéri az előleget</span><span class="pill">Másik szobát ajánl</span></div>
      </article>
    </div>
    <form method="dialog"><button class="btn">Rendben</button></form>`
  $('request-title').focus()
}

$('trips').innerHTML = [
  ['footprints', 'Várrom a dombon', 'gyalog 40 perc a kertkaputól'],
  ['bicycle', 'Fürdőtó pavilonnal', 'biciklivel 15 perc, a kerékpárt mi adjuk'],
  ['car', 'Pincesor kóstolóval', 'autóval 10 perc, előre szólunk nekik'],
  ['footprints', 'Termelői piac szombaton', 'gyalog 10 perc, nyolctól délig'],
].map(([i, t, d]) => `<li>${icon(i)}<div><b>${t}</b><span>${d}</span></div></li>`).join('')

paintIcons()
render()
