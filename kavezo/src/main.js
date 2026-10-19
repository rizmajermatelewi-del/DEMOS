import '@fontsource/bodoni-moda/400.css'
import '@fontsource/bodoni-moda/700.css'
import '@fontsource/bodoni-moda/400-italic.css'
import '@fontsource/hanken-grotesk/400.css'
import '@fontsource/hanken-grotesk/600.css'
import './style.css'
import { HOURS, MENU, bookingProblems, clock, modeAt, nightness, openState, upcoming } from './logic.js'

const $ = (id) => document.getElementById(id)
const ft = (n) => `${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} Ft`
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
const DAYS = ['vasárnap', 'hétfő', 'kedd', 'szerda', 'csütörtök', 'péntek', 'szombat']
const MONTHS = ['jan.', 'febr.', 'márc.', 'ápr.', 'máj.', 'jún.', 'júl.', 'aug.', 'szept.', 'okt.', 'nov.', 'dec.']
const huDay = (iso) => { const d = new Date(`${iso}T12:00:00Z`); return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}., ${DAYS[d.getUTCDay()]}` }

const now = new Date()
const nowMin = now.getHours() * 60 + now.getMinutes()
const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

// Nyitva / zárva a fejlécben, valódi idő szerint
// 24:00 zárás = éjfélig
const until = (m) => (m >= 24 * 60 ? 'éjfélig' : `${clock(m)}-ig`)
const st = openState(now)
$('status').innerHTML = st.open
  ? `<i class="dot on"></i>Nyitva ${until(st.until)}`
  : `<i class="dot"></i>Zárva · ${st.inDays ? 'holnap' : 'ma'} ${clock(st.opens)}-kor nyitunk`

// A napszak-csúszka: az egész oldal színe és a kínálat követi
const range = $('time')
function paint() {
  const min = Number(range.value)
  const m = modeAt(min)
  document.documentElement.style.setProperty('--n', nightness(min).toFixed(3))
  $('time-out').textContent = clock(min)
  range.setAttribute('aria-valuetext', `${clock(min)}, ${m.name.toLowerCase()}`)
  $('mode-name').textContent = m.name
  $('mode-line').textContent = m.line
  $('menu-list').innerHTML = MENU[m.id].map(([name, price, note]) => `<li><span class="dish">${name}<small>${note}</small></span><b>${ft(price)}</b></li>`).join('')
}
range.addEventListener('input', paint)
const snapNow = () => String(Math.min(1439, Math.max(420, Math.round(nowMin / 15) * 15)))
$('now').addEventListener('click', () => { range.value = snapNow(); paint() })
range.value = snapNow()
paint()

// Esti programok és asztalkérés
const events = upcoming(today, 6)
let picked = events.find((e) => e.left > 0) ?? null
let people = 2
function renderTickets() {
  $('tickets').innerHTML = events.map((e, i) => {
    const pct = Math.round(((e.seats - e.left) / e.seats) * 100)
    const sel = picked === e
    return `<li><button type="button" class="ticket${sel ? ' is-picked' : ''}${e.left ? '' : ' is-full'}" data-i="${i}" aria-pressed="${sel}"${e.left ? '' : ' disabled'}>
      <span class="t-date">${huDay(e.date)} · ${e.time}</span>
      <span class="t-name">${e.name}</span>
      <span class="t-note">${e.note}${e.price ? ` · ${ft(e.price)} / fő` : ''}</span>
      <span class="t-seats"><i style="--p:${pct}%"></i>${e.left ? `még ${e.left} hely` : 'betelt'}</span>
    </button></li>`
  }).join('')
  $('book-pick').textContent = picked ? `${picked.name}, ${huDay(picked.date)}, ${picked.time}` : 'Válasszon egy estét a listából.'
  $('people').textContent = people
}
$('tickets').addEventListener('click', (e) => {
  const b = e.target.closest('.ticket')
  if (!b) return
  picked = events[Number(b.dataset.i)]
  renderTickets()
  document.querySelector(`.ticket[data-i="${b.dataset.i}"]`)?.focus()
})
document.querySelector('.stepper').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-step]')
  if (!b) return
  people = Math.min(12, Math.max(1, people + Number(b.dataset.step)))
  renderTickets()
})
renderTickets()

$('book').addEventListener('submit', (e) => {
  e.preventDefault()
  const d = Object.fromEntries(new FormData(e.target))
  const issues = bookingProblems(picked, people)
  if (!d.name?.trim()) issues.push('Adja meg a nevét.')
  if ((d.phone ?? '').replace(/\D/g, '').length < 8) issues.push('Adjon meg egy telefonszámot.')
  const err = $('book-err')
  if (issues.length) { err.hidden = false; err.textContent = issues.join(' '); return }
  err.hidden = true
  $('sent-body').innerHTML = `
    <h2 id="sent-title" tabindex="-1">Megkaptuk, ${esc(d.name.trim().split(' ').pop())}!</h2>
    <p>Így látja a pult a kérést, és pár percen belül SMS-ben visszaigazolja:</p>
    <article class="slip">
      <p class="slip-head">Új asztalkérés</p>
      <p class="slip-main">${picked.name} · ${huDay(picked.date)} · ${picked.time}</p>
      <p>${people} fő, ${esc(d.seat)} · ${esc(d.name)} · <a href="tel:${esc(d.phone.replace(/[^\d+]/g, ''))}">${esc(d.phone)}</a></p>
      <p class="slip-left">Utána még ${Math.max(0, picked.left - people)} szabad hely marad erre az estére.</p>
    </article>
    <form method="dialog"><button class="btn">Rendben</button></form>`
  $('sent').showModal()
  $('sent-title').focus()
})

// Nyitvatartás, a mai nap kiemelve
const order = [1, 2, 3, 4, 5, 6, 0]
$('hours-table').insertAdjacentHTML('beforeend', `<tbody>${order.map((d) => {
  const [o, c] = HOURS[d]
  return `<tr${d === now.getDay() ? ' class="today" aria-current="date"' : ''}><th scope="row">${DAYS[d]}</th><td>${clock(o)} – ${c >= 24 * 60 ? '24:00' : clock(c)}</td></tr>`
}).join('')}</tbody>`)
