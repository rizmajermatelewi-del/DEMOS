import '@fontsource/syne/700.css'
import '@fontsource/syne/800.css'
import '@fontsource/work-sans/400.css'
import '@fontsource/work-sans/600.css'
import './style.css'
import coffee from '@phosphor-icons/core/assets/duotone/coffee-duotone.svg?raw'
import flame from '@phosphor-icons/core/assets/duotone/flame-duotone.svg?raw'
import pot from '@phosphor-icons/core/assets/duotone/cooking-pot-duotone.svg?raw'
import tea from '@phosphor-icons/core/assets/duotone/tea-bag-duotone.svg?raw'
import note from '@phosphor-icons/core/assets/duotone/note-pencil-duotone.svg?raw'
import puzzle from '@phosphor-icons/core/assets/duotone/puzzle-piece-duotone.svg?raw'
import brush from '@phosphor-icons/core/assets/duotone/paint-brush-duotone.svg?raw'
import cookie from '@phosphor-icons/core/assets/duotone/cookie-duotone.svg?raw'
import plant from '@phosphor-icons/core/assets/duotone/plant-duotone.svg?raw'
import key from '@phosphor-icons/core/assets/duotone/key-duotone.svg?raw'
import sneaker from '@phosphor-icons/core/assets/duotone/sneaker-move-duotone.svg?raw'
import wine from '@phosphor-icons/core/assets/duotone/wine-duotone.svg?raw'
import { CARD_MAX, HOURS, OCCASIONS, WHO, WRAPS, holdCode, holdUntil, reserveProblems, suggest, total, wrapOf } from './logic.js'

const ICONS = { coffee, flame, 'cooking-pot': pot, 'tea-bag': tea, 'note-pencil': note, 'puzzle-piece': puzzle, 'paint-brush': brush, cookie, plant, key, 'sneaker-move': sneaker, wine }
const TINTS = ['#f6d7cf', '#d6e9dc', '#f3e3b8', '#dcdcf2', '#f1d9e7', '#d9e7ef']
const $ = (id) => document.getElementById(id)
const ft = (n) => `${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} Ft`
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
const DAYS = ['vasárnap', 'hétfő', 'kedd', 'szerda', 'csütörtök', 'péntek', 'szombat']
const MONTHS = ['január', 'február', 'március', 'április', 'május', 'június', 'július', 'augusztus', 'szeptember', 'október', 'november', 'december']
const clock = (m) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`

const state = { who: 'anya', occ: 'nevnap', budget: 6000, item: null, wrap: 'masni' }

const chips = (el, name, list, val) => {
  el.innerHTML = list.map(([id, label]) => `<label class="chip"><input type="radio" name="${name}" value="${id}"${id === val ? ' checked' : ''} /><span>${label}</span></label>`).join('')
}
chips($('who'), 'who', WHO, state.who)
chips($('occ'), 'occ', OCCASIONS, state.occ)
$('ask').addEventListener('change', (e) => {
  if (e.target.name === 'who' || e.target.name === 'occ') { state[e.target.name] = e.target.value; renderShelf() }
})
$('budget').addEventListener('input', (e) => { state.budget = Number(e.target.value); renderShelf() })

function renderShelf() {
  $('budget-out').textContent = ft(state.budget)
  const list = suggest(state)
  const inStock = list.filter((p) => p.stock > 0).length
  $('count').textContent = inStock
    ? `${inStock} ajándék van most a polcon ehhez${list.length > inStock ? `, ${list.length - inStock} elfogyott` : ''}.`
    : list.length
      ? 'Ehhez most csak elfogyott termékünk van. Emeljen egy kicsit a kereten, vagy hívjon, és kitalálunk valamit.'
      : 'Ennyiből erre most nincs ötletünk. Emeljen egy kicsit a kereten, vagy hívjon, és kitalálunk valamit.'
  if (state.item && !list.includes(state.item)) state.item = null
  if (!state.item) state.item = list.find((p) => p.stock > 0) ?? null
  $('shelf').innerHTML = list.map((p) => {
    const sel = state.item === p
    return `<li><button type="button" class="item${sel ? ' is-picked' : ''}${p.stock ? '' : ' is-out'}" data-id="${p.id}" aria-pressed="${sel}"${p.stock ? '' : ' disabled'} style="--tint:${TINTS[p.id % TINTS.length]}">
      <span class="item-icon">${ICONS[p.icon].replace('<svg', '<svg aria-hidden="true" focusable="false"')}</span>
      <span class="item-name">${p.name}</span>
      <span class="item-meta"><b>${ft(p.price)}</b><small>${p.stock ? (p.stock <= 3 ? `csak ${p.stock} db` : 'van bőven') : 'elfogyott'}</small></span>
    </button></li>`
  }).join('')
  renderPack()
}
$('shelf').addEventListener('click', (e) => {
  const b = e.target.closest('.item')
  if (!b || b.disabled) return
  state.item = suggest(state).find((p) => p.id === Number(b.dataset.id))
  renderShelf()
  document.querySelector(`.item[data-id="${b.dataset.id}"]`)?.focus()
})

$('wraps').innerHTML = WRAPS.map((w) => `<label class="wrap-opt"><input type="radio" name="wrap" value="${w.id}"${w.id === state.wrap ? ' checked' : ''} />
  <span class="swatch" style="--paper:${w.paper};--ribbon:${w.ribbon}"></span><span>${w.name}<small>${w.price ? `+${ft(w.price)}` : 'ingyen'}</small></span></label>`).join('')
$('wraps').addEventListener('change', (e) => { state.wrap = e.target.value; renderPack() })
$('card').addEventListener('input', renderPack)

function renderPack() {
  const w = wrapOf(state.wrap)
  const card = $('card').value
  const present = $('present')
  present.style.setProperty('--paper', w.paper)
  present.style.setProperty('--ribbon', w.ribbon)
  present.dataset.wrap = w.id
  $('tag-text').textContent = card.trim() || 'Ide jön a kártya szövege'
  $('card-count').textContent = `${card.length}/${CARD_MAX}`
  $('card-count').classList.toggle('over', card.length > CARD_MAX)
  $('picked').textContent = state.item ? `${state.item.name} · ${ft(state.item.price)}` : 'Előbb válasszon egy ajándékot a polcról.'
  $('sum').innerHTML = state.item ? `Összesen <b>${ft(total(state.item, state.wrap))}</b>` : ''
}

$('pack').addEventListener('submit', (e) => {
  e.preventDefault()
  const d = Object.fromEntries(new FormData(e.target))
  const issues = reserveProblems(state.item, d.card, d.name, d.phone)
  const err = $('err')
  if (issues.length) { err.hidden = false; err.textContent = issues.join(' '); return }
  err.hidden = true
  const now = new Date()
  const until = holdUntil(now)
  const code = holdCode(state.item, d.name, now)
  const w = wrapOf(state.wrap)
  $('held-body').innerHTML = `
    <h2 id="held-title" tabindex="-1">Félretettük</h2>
    <p class="code">${code}</p>
    <p>Ezzel a kóddal kérje a pultnál. ${MONTHS[until.date.getMonth()]} ${until.date.getDate()}., ${DAYS[until.date.getDay()]} ${clock(until.close)}-ig várjuk, becsomagolva.</p>
    <article class="slip">
      <p class="slip-head">A bolt telefonján · új félretétel</p>
      <p class="slip-main">${code} · ${state.item.name}</p>
      <p>${w.name}${d.card.trim() ? ` · kártya: „${esc(d.card.trim())}”` : ''}</p>
      <p>${esc(d.name)} · <a href="tel:${esc(d.phone.replace(/[^\d+]/g, ''))}">${esc(d.phone)}</a> · ${ft(total(state.item, state.wrap))}</p>
      <p class="slip-note">Készletből levonva, a polcon „félretéve” cédula.</p>
    </article>
    <form method="dialog"><button class="btn">Rendben</button></form>`
  $('held').showModal()
  $('held-title').focus()
})

// A hero ajándéka: kattintásra leugrik a fedél, kiugrik a mostani szűrőkre ajánlott első három termék, aztán a keresőhöz görgetünk.
const calm = matchMedia('(prefers-reduced-motion: reduce)')
$('gift').addEventListener('click', () => {
  const gift = $('gift')
  if (calm.matches) { $('kereso').scrollIntoView(); return }
  if (gift.classList.contains('open')) return
  const picks = suggest(state).filter((p) => p.stock > 0).slice(0, 3)
  $('burst').innerHTML = picks.map((p, i) => `<span class="pop" style="--i:${i};--tint:${TINTS[p.id % TINTS.length]}">${ICONS[p.icon].replace('<svg', '<svg aria-hidden="true" focusable="false"')}<b>${p.name}</b></span>`).join('')
  gift.classList.add('open')
  setTimeout(() => $('kereso').scrollIntoView({ behavior: 'smooth' }), 1300)
  setTimeout(() => gift.classList.remove('open'), 2600)
})

// Görgetésre beúszó szakaszok
const reveal = new IntersectionObserver((entries) => entries.forEach((e) => {
  if (e.isIntersecting) { e.target.classList.add('in'); reveal.unobserve(e.target) }
}), { rootMargin: '0px 0px -12% 0px' })
document.querySelectorAll('main > section:not(.hero)').forEach((s) => { s.classList.add('reveal'); reveal.observe(s) })

const order = [1, 2, 3, 4, 5, 6, 0]
const today = new Date().getDay()
$('hours-table').insertAdjacentHTML('beforeend', `<tbody>${order.map((d) => {
  const h = HOURS[d]
  return `<tr${d === today ? ' class="today" aria-current="date"' : ''}><th scope="row">${DAYS[d]}</th><td>${h ? `${clock(h[0])} – ${clock(h[1])}` : 'zárva'}</td></tr>`
}).join('')}</tbody>`)

renderShelf()
