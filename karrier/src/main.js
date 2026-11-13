import '@fontsource-variable/bricolage-grotesque'
import '@fontsource-variable/figtree'
import './style.css'
import { DAYS, SHIFTS, JOBS, slot, match, verdict, weeklyGross, validPhone, forint } from './logic.js'

const $ = (id) => document.getElementById(id)
const avail = new Set()
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
const scrollTo = (el) => el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })

// A tálca: 7 nap × 3 műszak gomb, aria-pressed állapottal.
const tray = $('tray')
tray.innerHTML =
  '<span class="corner" aria-hidden="true"></span>' +
  Object.values(SHIFTS).map((s) => `<span class="col-head" aria-hidden="true">${s.label}<small>${s.start}–${s.end}</small></span>`).join('') +
  DAYS.map(
    (d, di) =>
      `<span class="row-head" aria-hidden="true">${d}</span>` +
      Object.entries(SHIFTS)
        .map(([k, s]) => `<button type="button" class="cell" data-slot="${slot(di, k)}" aria-pressed="false" aria-label="${d}, ${s.label.toLowerCase()} ${s.start}–${s.end}"></button>`)
        .join(''),
  ).join('')

tray.addEventListener('click', (e) => {
  const b = e.target.closest('.cell')
  if (!b) return
  const on = b.getAttribute('aria-pressed') !== 'true'
  b.setAttribute('aria-pressed', String(on))
  if (on) avail.add(b.dataset.slot)
  else avail.delete(b.dataset.slot)
  update()
})

// Állások listája.
const list = $('job-list')
list.innerHTML = JOBS.map((j) => {
  const s = SHIFTS[j.shift]
  const alt = j.alt ? ` vagy ${SHIFTS[j.alt].label.toLowerCase()} ${SHIFTS[j.alt].start}–${SHIFTS[j.alt].end}` : ''
  return `<li class="job" id="job-${j.id}">
    <div class="job-main">
      <h3>${j.title}</h3>
      <p class="job-when">${s.label} ${s.start}–${s.end}${alt}, heti ${j.needDays} nap</p>
      <ul class="job-needs">${j.needs.map((n) => `<li>${n}</li>`).join('')}</ul>
    </div>
    <div class="job-fit">
      <p class="fit-label">Jelöljön be műszakokat</p>
      <div class="meter" aria-hidden="true"><span></span></div>
      <p class="fit-days"></p>
      <p class="fit-pay"><span>${forint(j.hourly)}/óra</span></p>
      <a class="pick" href="#jelentkezes" data-job="${j.id}">Erre jelentkezem</a>
    </div>
  </li>`
}).join('')

$('job').innerHTML = JOBS.map((j) => `<option value="${j.id}">${j.title}</option>`).join('')

list.addEventListener('click', (e) => {
  const a = e.target.closest('.pick')
  if (!a) return
  e.preventDefault()
  $('job').value = a.dataset.job
  scrollTo($('jelentkezes'))
  $('name').focus({ preventScroll: true })
})

function availText() {
  if (!avail.size) return 'még nem jelölt be műszakot'
  return DAYS.map((d, di) => {
    const s = Object.keys(SHIFTS).filter((k) => avail.has(slot(di, k))).map((k) => SHIFTS[k].label.toLowerCase())
    return s.length ? `${d}: ${s.join(', ')}` : null
  })
    .filter(Boolean)
    .join(' · ')
}

function update() {
  $('tray-sum').textContent = avail.size ? `${avail.size} műszakot jelölt be. Lent látja, melyik állás illik Önhöz.` : ''
  let best = null
  for (const j of JOBS) {
    const m = match(avail, j)
    const v = verdict(m.pct)
    const li = $(`job-${j.id}`)
    li.dataset.fit = avail.size ? v.key : ''
    li.querySelector('.fit-label').textContent = avail.size ? v.text : 'Jelöljön be műszakokat'
    li.querySelector('.meter span').style.transform = `scaleX(${m.pct.toFixed(3)})`
    const days = m.covered >= m.need ? `Mind a ${m.need} kért nap passzol` : `${m.covered} nap passzol a kért ${m.need}-ből`
    li.querySelector('.fit-days').textContent = avail.size ? days : ''
    const pay = weeklyGross(j, m.covered)
    li.querySelector('.fit-pay').innerHTML = `<span>${forint(j.hourly)}/óra</span>${pay ? ` · kb. <strong>${forint(pay)}</strong> hetente` : ''}`
    if (avail.size && (!best || m.pct > best.pct)) best = { id: j.id, pct: m.pct }
  }
  if (best && best.pct > 0) $('job').value = best.id
  $('avail').textContent = `Amikor ráér: ${availText()}.`
}
update()

function fail(msg, id) {
  $('error').textContent = msg
  $(id).focus()
}

// Jelentkezés: magyar hibaüzenet, semmi nem megy el.
$('form').addEventListener('submit', (e) => {
  e.preventDefault()
  const name = $('name').value.trim()
  const phone = $('phone').value.trim()
  if (!name) return fail('Kérjük, írja be a nevét.', 'name')
  if (!validPhone(phone)) return fail('Ez nem tűnik magyar mobilszámnak. Így írja: 06 30 123 4567.', 'phone')
  if (!$('consent').checked) return fail('Pipálja be a hozzájárulást, különben nem tudjuk felhívni.', 'consent')
  $('error').textContent = ''

  const j = JOBS.find((x) => x.id === $('job').value)
  const m = match(avail, j)
  const kk = document.querySelector('input[name=kiskonyv]:checked').value === 'igen'
  const note = $('note').value.trim()
  const ticket = $('ticket')
  ticket.innerHTML = `
    <header><span class="t-role">${j.title}</span><span class="t-fit" data-fit="${verdict(m.pct).key}">${Math.round(m.pct * 100)}% egyezés</span></header>
    <p class="t-name"></p>
    <p class="t-phone"></p>
    <dl>
      <div><dt>Ráér</dt><dd>${availText()}</dd></div>
      <div><dt>Kiskönyv</dt><dd>${kk ? 'van' : 'nincs még, intézné'}</dd></div>
      ${note ? '<div><dt>Megjegyzés</dt><dd class="t-note"></dd></div>' : ''}
    </dl>`
  // A látogató szövege textContenttel kerül be, nem HTML-ként.
  ticket.querySelector('.t-name').textContent = name
  ticket.querySelector('.t-phone').textContent = phone
  if (note) ticket.querySelector('.t-note').textContent = note
  $('owner').hidden = false
  scrollTo($('owner'))
  $('owner-title').focus({ preventScroll: true })
})
