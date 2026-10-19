import '@fontsource/rubik/500.css'
import '@fontsource/rubik/700.css'
import '@fontsource/nunito/400.css'
import '@fontsource/nunito/700.css'
import './style.css'
import dog from '@phosphor-icons/core/assets/duotone/dog-duotone.svg?raw'
import cat from '@phosphor-icons/core/assets/duotone/cat-duotone.svg?raw'
import { HOURS, PLAN, addDays, ageText, clinicState, schedule } from './logic.js'
import pupUrl from './assets/kolyok.webp'
import catUrl from './assets/macska.webp'

const $ = (id) => document.getElementById(id)
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
const DAYS = ['vasárnap', 'hétfő', 'kedd', 'szerda', 'csütörtök', 'péntek', 'szombat']
const MONTHS = ['jan.', 'febr.', 'márc.', 'ápr.', 'máj.', 'jún.', 'júl.', 'aug.', 'szept.', 'okt.', 'nov.', 'dec.']
const clock = (m) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`
const huDay = (iso) => { const d = new Date(`${iso}T12:00:00Z`); return `${d.getUTCFullYear()}. ${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}.` }
const STATUS = { kesz: 'megvolt', kesik: 'elmaradt', esedekes: 'hamarosan', kesobb: 'később' }

const now = new Date()
const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

// Rendelés vagy ügyelet, valódi idő szerint
const st = clinicState(now)
$('status').innerHTML = st.open
  ? `<i class="dot on"></i>Most rendelünk, ${clock(st.until)}-ig`
  : `<i class="dot"></i>Most ügyelet · rendelés ${st.inDays === 0 ? 'ma' : st.inDays === 1 ? 'holnap' : DAYS[(now.getDay() + st.inDays) % 7]} ${clock(st.opens)}-tól`

const state = { species: 'kutya', birth: addDays(today, -60), done: new Set() }
$('species').innerHTML = [['kutya', 'Kutya', dog], ['macska', 'Macska', cat]].map(([id, label, svg]) => `<label class="sp"><input type="radio" name="species" value="${id}"${id === state.species ? ' checked' : ''} /><span>${svg.replace('<svg', '<svg aria-hidden="true" focusable="false"')}${label}</span></label>`).join('')
const birth = $('birth')
birth.max = today
birth.value = state.birth

function render() {
  const name = $('petname').value.trim() || (state.species === 'kutya' ? 'A kutya' : 'A cica')
  if (!state.birth || state.birth > today) {
    $('age').textContent = 'Adjon meg egy múltbeli születési dátumot.'
    $('timeline').innerHTML = ''
    return
  }
  $('age').innerHTML = `<b>${esc(name)}</b> most ${ageText(state.birth, today)}.`
  const plan = schedule(state.species, state.birth, today, [...state.done])
  $('timeline').innerHTML = plan.map((v) => `<li class="${v.status}">
    <span class="when">${huDay(v.date)}<small>${v.inDays < 0 ? `${-v.inDays} napja` : v.inDays === 0 ? 'ma' : `${v.inDays} nap múlva`}</small></span>
    <span class="what">${v.name}${v.mandatory ? ' <em>kötelező</em>' : ''}${v.note ? `<small>${v.note}</small>` : ''}</span>
    <span class="badge">${STATUS[v.status]}</span>
    <label class="done-box"><input type="checkbox" value="${v.id}"${state.done.has(v.id) ? ' checked' : ''} /> megvolt</label>
  </li>`).join('')
}
$('pet').addEventListener('change', (e) => {
  if (e.target.name === 'species') { state.species = e.target.value; state.done.clear() }
  if (e.target.id === 'birth') state.birth = e.target.value
  render()
})
$('petname').addEventListener('input', render)
$('timeline').addEventListener('change', (e) => {
  if (e.target.type !== 'checkbox') return
  if (e.target.checked) state.done.add(e.target.value); else state.done.delete(e.target.value)
  render()
  $('timeline').querySelector(`input[value="${e.target.value}"]`)?.focus()
})

// Az SMS 5 nappal előtte megy, de ha az már elmúlt, még aznap.
const sendOn = (v) => { const d = addDays(v.date, -5); return d < today ? today : d }
$('remind').addEventListener('submit', (e) => {
  e.preventDefault()
  const phone = new FormData(e.target).get('phone') ?? ''
  const err = $('err'), ok = $('ok')
  if (phone.replace(/\D/g, '').length < 8) { err.hidden = false; ok.hidden = true; err.textContent = 'Adjon meg egy telefonszámot.'; return }
  const next = schedule(state.species, state.birth, today, [...state.done]).find((v) => v.inDays >= 0 && v.status !== 'kesz')
  err.hidden = true
  ok.hidden = false
  ok.innerHTML = next
    ? `Rendben. Az első SMS ${sendOn(next) === today ? 'még ma' : huDay(sendOn(next))} megy a(z) ${esc(phone)} számra: „${esc($('petname').value.trim() || 'Kedvence')} oltása (${next.name.toLowerCase()}) ${next.inDays <= 5 ? (next.inDays === 0 ? 'ma' : `${next.inDays} nap múlva`) : '5 nap múlva'} esedékes. Mancs Rendelő.” <small>Bemutató: nem megy ki SMS.</small>`
    : 'Minden esedékes oltás megvolt, a következő évesnél szólunk.'
})

// Hero: növekedési vonalzó. Az életkort húzva a kölyök a vonalzón halad és nő; az oltások mancsnyomként telnek be.
// Négyzetgyökös lépték, hogy az első hónapok sűrű oltásai ne csússzanak egymásra.
const X = (d) => Math.sqrt(d / 400) * 100
let hsp = 'kutya'
let prevGot = 0 // csak az újonnan elért oltás kap pecsét-animációt
// A csúszka 0-1000 közt a négyzetgyökös skálán mozog, így a hüvelykujj és a kép ugyanott van.
const ageOf = () => Math.max(7, Math.round(400 * (Number($('age').value) / 1000) ** 2))
function renderGrow() {
  const age = ageOf()
  $('age').style.setProperty('--p', `${X(age).toFixed(2)}%`)
  const plan = PLAN[hsp]
  $('marks').innerHTML = plan.map((v, i) => `<li class="${age >= v.age ? `got${i >= prevGot ? ' new' : ''}` : ''}${v.mandatory ? ' must' : ''}" style="--x:${X(v.age).toFixed(2)}%;--lift:${i % 3}" title="${v.name}"><span>${i + 1}</span></li>`).join('')
  const buddy = $('buddy')
  buddy.style.setProperty('--x', `${X(age).toFixed(2)}%`)
  buddy.style.setProperty('--s', (0.5 + (age / 400) * 0.7).toFixed(3))
  const next = plan.find((v) => v.age > age)
  const got = plan.filter((v) => v.age <= age).length
  prevGot = got
  const who = hsp === 'kutya' ? 'A kölyök' : 'A cica'
  $('grow-out').innerHTML = `<b>${who} ${ageText(addDays(today, -age), today)}.</b> ${next
    ? `Következik: ${next.name.toLowerCase()}${next.mandatory ? ' (kötelező)' : ''}, <b>${next.age - age} nap múlva</b>.`
    : 'Az alapoltások megvannak, innen évente egy emlékeztető jön.'} <small>${got}/${plan.length} oltás eddig</small>`
  $('age').setAttribute('aria-valuetext', `${ageText(addDays(today, -age), today)}`)
}
$('age').addEventListener('input', renderGrow)
document.querySelectorAll('input[name="hsp"]').forEach((r) => r.addEventListener('change', () => {
  hsp = r.value
  $('buddy').src = hsp === 'kutya' ? pupUrl : catUrl
  renderGrow()
}))
// A vonalzó állapota átkerül a teljes naptárba.
$('grow-go').addEventListener('click', () => {
  state.species = hsp
  state.done.clear()
  state.birth = addDays(today, -ageOf())
  birth.value = state.birth
  document.querySelector(`input[name="species"][value="${hsp}"]`).checked = true
  render()
})
renderGrow()

const order = [1, 2, 3, 4, 5, 6, 0]
$('hours').insertAdjacentHTML('beforeend', `<tbody>${order.map((d) => `<tr${d === now.getDay() ? ' class="today" aria-current="date"' : ''}><th scope="row">${DAYS[d]}</th><td>${HOURS[d].length ? HOURS[d].map(([a, b]) => `${clock(a)}–${clock(b)}`).join(', ') : 'ügyelet'}</td></tr>`).join('')}</tbody>`)

render()
