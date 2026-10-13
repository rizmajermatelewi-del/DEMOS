import { useEffect, useMemo, useState } from 'react'
import { ALLERGENS, BUSINESS, DAY_COPY, boardPrice, dayMenu, formatDay, formatHuf, isoLocal, weekdayName } from './data.js'
import { clampQty, fitsDiet, menuItems, orderLines, orderTotal, pickupSlots, shopStatus, validateOrder } from './order.js'
import { CARD_SIZE, addOrder, addStamp, isLoggedIn, loadOrders, loadStamps, loadWeek, login, logout, saveDay, setOrderStatus } from './storage.js'
import soupPhoto from './assets/leves.webp'
import rantottPhoto from './assets/rantott.webp'
import toltottPhoto from './assets/toltott.webp'
import palacsintaPhoto from './assets/palacsinta.webp'

const SITE_URL = 'https://demo-napi-menu.vercel.app/'

function mondayOf(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(12, 0, 0, 0)
  return d
}

function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

/** Same letter, same place, same slight tilt on every render: pressed-in plastic letters are never straight. */
function tilt(seed, i) {
  const x = Math.sin(seed * 97 + i * 13.37) * 10000
  return x - Math.floor(x) - 0.5
}

/** A line of plastic letters. Screen readers get the plain text. */
function Letters({ text, seed = 1, start = 0 }) {
  let i = 0
  // Words stay whole, so a line only breaks where a real board would leave a gap.
  const words = String(text).toUpperCase().split(/\s+/).filter(Boolean)
  return (
    <span className="letters">
      <span className="sr">{text}</span>
      <span className="set" aria-hidden="true">
        {words.map((word, w) => (
          <span key={w} className="w">
            {[...word].map((ch) => {
              const n = i++
              return (
                <span key={n} className="l" style={{ '--r': `${(tilt(seed, n) * 5).toFixed(2)}deg`, '--y': `${(tilt(seed + 7, n) * 3).toFixed(1)}px`, '--i': start + n }}>
                  {ch}
                </span>
              )
            })}
          </span>
        ))}
      </span>
    </span>
  )
}

function allergenNames(codes) {
  return codes.map((c) => ALLERGENS[c]).join(', ')
}

/** The small yellow codes after a dish, like stickers on the board. */
function AllergenTags({ codes }) {
  if (!codes?.length) return null
  return (
    <span className="alg">
      <span className="sr">Allergének: {allergenNames(codes)}</span>
      <span aria-hidden="true">{codes.join(' ')}</span>
    </span>
  )
}

function Row({ name, price, allergens, seed, start, out = false }) {
  return (
    <li className={out ? 'row out' : 'row'}>
      {out ? <span className="sr">Nem fér bele a szűrésbe:</span> : null}
      <span className="dish">
        <Letters text={name} seed={seed} start={start} />
        <AllergenTags codes={allergens} />
      </span>
      <Letters text={boardPrice(price)} seed={seed + 3} start={start + 4} />
    </li>
  )
}

/** The felt letterboard in its oak frame. */
function Letterboard({ menu, heading, seed = 1, compact = false, avoid = [] }) {
  if (menu.closed) {
    return (
      <figure className={compact ? 'board compact' : 'board'}>
        <div className="felt">
          <p className="board-head">
            <Letters text={heading} seed={seed} />
          </p>
          <p className="board-closed">
            <Letters text={menu.weekend ? 'Hétvégén zárva' : 'Ma zárva'} seed={seed + 1} start={6} />
          </p>
        </div>
      </figure>
    )
  }
  const used = new Set([...(menu.soupAllergens ?? []), ...menu.mains.flatMap((m) => m.allergens ?? []), ...(menu.dessertAllergens ?? [])])
  const legend = Object.keys(ALLERGENS).filter((c) => used.has(c))
  return (
    <figure className={compact ? 'board compact' : 'board'}>
      <div className="felt">
        <p className="board-head">
          <Letters text={heading} seed={seed} />
        </p>
        <p className="board-label">Leves</p>
        <ul>
          <Row name={menu.soup} price={menu.soupPrice} allergens={menu.soupAllergens} seed={seed + 11} start={4} out={!fitsDiet(menu.soupAllergens, avoid)} />
        </ul>
        <p className="board-label">Főétel</p>
        <ul>
          {menu.mains.map((item, index) => (
            <Row key={index} name={item.name} price={item.price} allergens={item.allergens} seed={seed + 20 + index} start={10 + index * 6} out={!fitsDiet(item.allergens, avoid)} />
          ))}
        </ul>
        <p className="board-label">Desszert</p>
        <ul>
          <Row name={menu.dessert} price={menu.dessertPrice} allergens={menu.dessertAllergens} seed={seed + 40} start={24} out={!fitsDiet(menu.dessertAllergens, avoid)} />
        </ul>
        {menu.note ? <p className="board-note">{menu.note}</p> : null}
        {legend.length ? (
          <p className="board-legend">
            {legend.map((c) => (
              <span key={c}>
                <b>{c}</b> {ALLERGENS[c]}
              </span>
            ))}
          </p>
        ) : null}
      </div>
    </figure>
  )
}

/** "G T L" in a text field, codes out. Unknown letters are dropped on save. */
function codesFromInput(value) {
  return String(value)
    .toUpperCase()
    .split(/[\s,;]+/)
    .filter(Boolean)
}

function AllergenField({ value, onChange }) {
  return (
    <label className="alg-field">
      Allergének
      <input value={(value ?? []).join(' ')} placeholder="pl. G T L" onChange={(e) => onChange(codesFromInput(e.target.value))} />
    </label>
  )
}

function Editor({ day, menu, onSave }) {
  const [draft, setDraft] = useState(menu)
  const [saved, setSaved] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [formError, setFormError] = useState('')

  function touch(next) {
    setDraft(next)
    setSaved(false)
    setDirty(true)
    setFormError('')
  }

  function setMain(index, key, value) {
    const mains = draft.mains.map((item, i) => (i === index ? { ...item, [key]: value } : item))
    touch({ ...draft, mains })
  }

  function commit(event) {
    event.preventDefault()
    const result = onSave(day, draft)
    if (!result.ok) {
      setFormError('Az ár egy forintösszeg legyen, és minden ételnek legyen neve.')
      setSaved(false)
      return
    }
    setDraft(result.week[day])
    setSaved(true)
    setDirty(false)
  }

  const copy = DAY_COPY[day]

  return (
    <div className="edit-grid">
      <form className="editor" onSubmit={commit}>
        <h2>A {copy.title} menü</h2>
        <p className="hint">Minden {copy.every} ez kerül ki a táblára. Gépelés közben a táblán látod, hogyan fest.</p>
        <label className="check">
          <input type="checkbox" checked={draft.closed} onChange={(e) => touch({ ...draft, closed: e.target.checked })} />
          Ezen a napon zárva
        </label>
        <div className="pair">
          <label>
            Leves
            <input value={draft.soup} onChange={(e) => touch({ ...draft, soup: e.target.value })} />
          </label>
          <label>
            Ár (Ft)
            <input inputMode="numeric" value={draft.soupPrice} onChange={(e) => touch({ ...draft, soupPrice: e.target.value })} />
          </label>
        </div>
        <AllergenField value={draft.soupAllergens} onChange={(codes) => touch({ ...draft, soupAllergens: codes })} />
        {draft.mains.map((item, index) => (
          <div className="dish-group" key={index}>
            <div className="pair">
              <label>
                {index + 1}. főétel
                <input value={item.name} onChange={(e) => setMain(index, 'name', e.target.value)} />
              </label>
              <label>
                Ár (Ft)
                <input inputMode="numeric" value={item.price} onChange={(e) => setMain(index, 'price', e.target.value)} />
              </label>
            </div>
            <AllergenField value={item.allergens} onChange={(codes) => setMain(index, 'allergens', codes)} />
          </div>
        ))}
        <div className="pair">
          <label>
            Desszert
            <input value={draft.dessert} onChange={(e) => touch({ ...draft, dessert: e.target.value })} />
          </label>
          <label>
            Ár (Ft)
            <input inputMode="numeric" value={draft.dessertPrice} onChange={(e) => touch({ ...draft, dessertPrice: e.target.value })} />
          </label>
        </div>
        <AllergenField value={draft.dessertAllergens} onChange={(codes) => touch({ ...draft, dessertAllergens: codes })} />
        <p className="hint">
          Allergénjelek: {Object.entries(ALLERGENS).map(([c, n]) => `${c} ${n}`).join(', ')}.
        </p>
        <label>
          Megjegyzés a tábla alá
          <input value={draft.note} onChange={(e) => touch({ ...draft, note: e.target.value })} />
        </label>
        <div className="save-row">
          <button type="submit" className="btn">
            Kitűzöm a táblára
          </button>
          {formError ? (
            <p className="error" role="alert">
              {formError}
            </p>
          ) : null}
          {dirty && !formError ? <p className="hint">Ha napot váltasz, a mentetlen sor elvész.</p> : null}
          {saved ? (
            <p className="saved" role="status">
              Kint van. Ebben a böngészőben mentve.
            </p>
          ) : null}
        </div>
      </form>
      <div className="preview" aria-hidden="true">
        <p className="preview-label">Így néz ki a táblán</p>
        <Letterboard menu={draft} heading={weekdayName(day)} seed={day} compact />
      </div>
    </div>
  )
}

/** Takeaway pre-order: pick dishes, a pickup time, leave a name and number.
    The ticket on the right fills in as you choose, like the counter slip. */
function OrderPanel({ menu, now, dateIso, onStamp }) {
  const slots = useMemo(() => pickupSlots(now), [now])
  const items = useMemo(() => menuItems(menu), [menu])
  const [qty, setQty] = useState({})
  const [slot, setSlot] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [errors, setErrors] = useState({})
  const [placed, setPlaced] = useState(null)
  const lines = orderLines(items, qty)
  const total = orderTotal(lines)

  if (!items.length) return null

  function step(id, delta) {
    setQty((q) => ({ ...q, [id]: clampQty((q[id] ?? 0) + delta) }))
    clear('items')
  }

  /** A field's error goes as soon as the field is touched again. */
  function clear(field) {
    setErrors((e) => (e[field] ? { ...e, [field]: undefined } : e))
  }

  function submit(event) {
    event.preventDefault()
    const found = validateOrder({ lines, slot, name, phone }, slots)
    setErrors(found)
    if (Object.keys(found).length) return
    const order = addOrder(dateIso, { lines, slot, name: name.trim(), phone: phone.trim(), total })
    const stamp = addStamp()
    onStamp(stamp)
    setPlaced({ ...order, stamp })
  }

  function again() {
    setPlaced(null)
    setQty({})
    setSlot('')
  }

  const closedForToday = slots.length === 0

  return (
    <section className="order" aria-labelledby="rendeles">
      <div className="order-inner">
        <div className="order-copy">
          <h2 id="rendeles">Elvitelre? Rendeld meg előre.</h2>
          <p>Mire odaérsz, becsomagolva vár. Fizetni átvételkor kell, készpénzzel vagy kártyával.</p>
          {closedForToday ? (
            <p className="order-closed">Ma már nem veszünk fel rendelést. Hétköznap reggeltől 14:40-ig lehet előre rendelni.</p>
          ) : (
            <ul className="pick">
              {items.map((item) => {
                const n = qty[item.id] ?? 0
                return (
                  <li key={item.id} className={n ? 'picked' : undefined}>
                    <span className="pick-name">
                      {item.name}
                      <AllergenTags codes={item.allergens} />
                      <small>{formatHuf(item.price)}</small>
                    </span>
                    <span className="stepper">
                      <button type="button" disabled={!n || Boolean(placed)} aria-label={`Egy adaggal kevesebb: ${item.name}`} onClick={() => step(item.id, -1)}>
                        −
                      </button>
                      <output aria-live="polite" aria-label={`${item.name}, adag`}>
                        {n}
                      </output>
                      <button type="button" disabled={n >= 9 || Boolean(placed)} aria-label={`Még egy adag: ${item.name}`} onClick={() => step(item.id, 1)}>
                        +
                      </button>
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
          {errors.items ? (
            <p className="error" role="alert">
              {errors.items}
            </p>
          ) : null}
        </div>

        <aside className="ticket" aria-label="Rendelési blokk">
          <p className="ticket-head">
            {BUSINESS.name}
            <span>Elvitel</span>
          </p>
          {placed ? (
            <div className="ticket-done" role="status">
              <p className="ticket-no">#{String(placed.no).padStart(3, '0')}</p>
              <p>
                Átvétel: <b>{placed.slot}</b>
              </p>
              <ul className="ticket-lines">
                {placed.lines.map((l) => (
                  <li key={l.id}>
                    <span>
                      {l.qty}× {l.name}
                    </span>
                    <span>{formatHuf(l.qty * l.price)}</span>
                  </li>
                ))}
              </ul>
              <p className="ticket-total">
                <span>Összesen</span>
                <span>{formatHuf(placed.total)}</span>
              </p>
              <p className="ticket-stamp">{placed.stamp.free ? 'Ez volt a tizedik pecsét: a következő ebéd ingyen van.' : `Pecsét a kártyán: ${placed.stamp.count} / ${CARD_SIZE}`}</p>
              <p className="hint">Ebben a böngészőben mentve. A Pult fülön látod, ahogy a konyha látná.</p>
              <button type="button" className="btn ghost" onClick={again}>
                Új rendelés
              </button>
            </div>
          ) : (
            <form onSubmit={submit} noValidate>
              {lines.length ? (
                <ul className="ticket-lines">
                  {lines.map((l) => (
                    <li key={l.id}>
                      <span>
                        {l.qty}× {l.name}
                      </span>
                      <span>{formatHuf(l.qty * l.price)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="ticket-empty">Még üres. Válassz a listából.</p>
              )}
              <p className="ticket-total">
                <span>Összesen</span>
                <span>{formatHuf(total)}</span>
              </p>
              {closedForToday ? null : (
                <>
                  <fieldset className="slots">
                    <legend>Mikorra jössz érte?</legend>
                    <div>
                      {slots.map((s) => (
                        <label key={s} className={slot === s ? 'on' : undefined}>
                          <input type="radio" name="slot" value={s} checked={slot === s} onChange={() => { setSlot(s); clear('slot') }} />
                          {s}
                        </label>
                      ))}
                    </div>
                    {errors.slot ? (
                      <p className="error" role="alert">
                        {errors.slot}
                      </p>
                    ) : null}
                  </fieldset>
                  <label className="field">
                    Név
                    <input value={name} autoComplete="name" aria-invalid={errors.name ? true : undefined} onChange={(e) => { setName(e.target.value); clear('name') }} />
                    {errors.name ? <span className="error">{errors.name}</span> : null}
                  </label>
                  <label className="field">
                    Telefon
                    <input
                      value={phone}
                      type="tel"
                      autoComplete="tel"
                      inputMode="tel"
                      aria-invalid={errors.phone ? true : undefined}
                      onChange={(e) => { setPhone(e.target.value); clear('phone') }}
                    />
                    {errors.phone ? <span className="error">{errors.phone}</span> : null}
                  </label>
                  <button type="submit" className="btn">
                    Megrendelem
                  </button>
                </>
              )}
            </form>
          )}
        </aside>
      </div>
    </section>
  )
}

const STATUS_COPY = {
  uj: { label: 'Új', next: 'kesz', action: 'Kész, csomagolva' },
  kesz: { label: 'Kész', next: 'atadva', action: 'Átadva' },
  atadva: { label: 'Átadva', next: null, action: null },
}

/** The counter: today's tickets on the spike rail, in pickup order. */
function Counter({ dateIso }) {
  const [orders, setOrders] = useState(() => loadOrders(dateIso))
  const sorted = [...orders].sort((a, b) => a.slot.localeCompare(b.slot) || a.no - b.no)
  const open = orders.filter((o) => o.status !== 'atadva').length

  return (
    <>
      <p className="hint counter-hint">
        Ma {orders.length} rendelés, ebből {open} még nincs átadva. Bemutatóban csak az ebben a böngészőben leadott rendelések látszanak.
      </p>
      {sorted.length === 0 ? (
        <p className="counter-empty">Ma még nincs rendelés. Adj le egyet a Mai menü fülön, és itt megjelenik a blokk.</p>
      ) : (
        <ol className="rail">
          {sorted.map((o) => {
            const s = STATUS_COPY[o.status]
            return (
              <li key={o.no} className={`slip ${o.status}`}>
                <p className="slip-top">
                  <span className="ticket-no">#{String(o.no).padStart(3, '0')}</span>
                  <span className="slip-time">{o.slot}</span>
                </p>
                <p className="slip-who">
                  {o.name}, <a href={`tel:${o.phone.replace(/\s/g, '')}`}>{o.phone}</a>
                </p>
                <ul className="ticket-lines">
                  {o.lines.map((l) => (
                    <li key={l.id}>
                      <span>
                        {l.qty}× {l.name}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="ticket-total">
                  <span>{s.label}</span>
                  <span>{formatHuf(o.total)}</span>
                </p>
                {s.next ? (
                  <button type="button" className="btn" onClick={() => setOrders(setOrderStatus(dateIso, o.no, s.next))}>
                    {s.action}
                  </button>
                ) : null}
              </li>
            )
          })}
        </ol>
      )}
    </>
  )
}

/** A counter card with a QR code to this page, ready to print. */
function QrPoster() {
  const [svg, setSvg] = useState('')
  useEffect(() => {
    let alive = true
    // Loaded only here, behind the login, so the public page does not carry it.
    import('qrcode')
      .then(({ default: QRCode }) => QRCode.toString(SITE_URL, { type: 'svg', margin: 1, color: { dark: '#1d1d1f', light: '#fffdf5' } }))
      .then((out) => alive && setSvg(out))
    return () => {
      alive = false
    }
  }, [])
  return (
    <div className="qr">
      <div className="qr-poster">
        <p className="qr-title">Mai menü és elvitel</p>
        {/* The SVG comes from the qrcode library, built from a constant URL. */}
        <div className="qr-code" role="img" aria-label="QR-kód a Kispipa Büfé oldalára" dangerouslySetInnerHTML={{ __html: svg }} />
        <p className="qr-foot">
          Olvasd be, és rendeld meg előre.
          <span>{BUSINESS.name}, {BUSINESS.address}</span>
        </p>
      </div>
      <div className="qr-side">
        <h2>QR a pultra</h2>
        <p className="hint">Asztalra, ajtóra, szórólapra. A vendég beolvassa, és már a mai menüt látja, rendelni is tud.</p>
        <button type="button" className="btn" onClick={() => window.print()}>
          Kinyomtatom
        </button>
      </div>
    </div>
  )
}

function LoginForm({ title, intro, password, setPassword, pinError, onLogin }) {
  return (
    <form className="editor login" onSubmit={onLogin}>
      <h1 className="page-title">{title}</h1>
      <p className="hint">
        {intro} A bemutató jelszava: {BUSINESS.adminPassword}.
      </p>
      <label>
        Jelszó
        <input
          type="password"
          autoComplete="current-password"
          value={password}
          aria-invalid={pinError || undefined}
          aria-describedby={pinError ? 'pin-error' : undefined}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>
      {pinError ? (
        <p id="pin-error" className="error" role="alert">
          Nem ez a jelszó.
        </p>
      ) : null}
      <button type="submit" className="btn">
        Belépés
      </button>
    </form>
  )
}


/** "Mit nem ehetsz?" chips. Dishes with an avoided allergen get a marker line on the board. */
function DietFilter({ avoid, onToggle }) {
  return (
    <div className="diet" role="group" aria-label="Mit nem ehetsz?">
      <span className="diet-label">Mit nem ehetsz?</span>
      {Object.entries(ALLERGENS).map(([code, name]) => (
        <button key={code} type="button" aria-pressed={avoid.includes(code)} onClick={() => onToggle(code)}>
          <b>{code}</b> {name}
        </button>
      ))}
    </div>
  )
}

/** The loyalty card on the counter: one stamp per takeaway order, the tenth meal is free. */
function StampCard({ count, fresh }) {
  return (
    <section className="stamps" aria-labelledby="pecset">
      <div className="stamp-card">
        <div className="stamp-text">
          <h2 id="pecset">Tíz ebéd, a tizedik a miénk.</h2>
          <p>Minden elviteles rendelés egy pecsét. A kártya a telefonodon van, nem veszhet el a tárcádban.</p>
          <p className="stamp-count" aria-live="polite">
            {count} / {CARD_SIZE} pecsét
          </p>
        </div>
        <ol className="stamp-grid" aria-hidden="true">
          {Array.from({ length: CARD_SIZE }, (_, i) => (
            <li key={i} className={i < count ? (i === count - 1 && fresh ? 'on fresh' : 'on') : undefined}>
              {i === CARD_SIZE - 1 ? 'Ingyen' : i + 1}
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

/** The week as a tear-off pad: the top sheet is the next open day, tear it to see the one after. */
function TearPad({ week, monday, startDay }) {
  const days = [1, 2, 3, 4, 5].filter((d) => d >= startDay)
  const [torn, setTorn] = useState(0)
  const [tearing, setTearing] = useState(false)
  const left = days.slice(torn)

  function tear() {
    setTearing(true)
    setTimeout(() => {
      setTearing(false)
      setTorn((t) => t + 1)
    }, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 450)
  }

  return (
    <section className="pad-wrap" aria-labelledby="het">
      <h2 id="het">A hét, lapról lapra.</h2>
      <div className="pad">
        {left.length ? (
          left
            .slice(0, 3)
            .reverse()
            .map((day, i, arr) => {
              const top = i === arr.length - 1
              const menu = dayMenu(week, addDays(monday, day - 1))
              return (
                <article key={day} className={`sheet${top ? ' top' : ''}${top && tearing ? ' tearing' : ''}`} aria-hidden={top ? undefined : 'true'}>
                  <p className="sheet-day">{weekdayName(day)}</p>
                  {menu.closed ? (
                    <p>Zárva</p>
                  ) : (
                    <ul>
                      <li>{menu.soup}</li>
                      {menu.mains.map((m) => (
                        <li key={m.name}>{m.name}</li>
                      ))}
                      <li>{menu.dessert}</li>
                    </ul>
                  )}
                </article>
              )
            })
        ) : (
          <article className="sheet top empty">
            <p className="sheet-day">Ennyi volt a hét</p>
            <p>Hétfőn új lapot kezdünk.</p>
          </article>
        )}
      </div>
      {left.length ? (
        <button type="button" className="btn" onClick={tear} disabled={tearing}>
          {left.length > 1 ? 'Letépem, jöhet a következő nap' : 'Letépem az utolsót'}
        </button>
      ) : (
        <button type="button" className="btn ghost" onClick={() => setTorn(0)}>
          Elölről
        </button>
      )}
    </section>
  )
}

const FOOD = [
  [rantottPhoto, 'Rántott hús citromkarikával és burgonyával', 'Rántott hús, szerdánként'],
  [toltottPhoto, 'Töltött káposzta tejföllel, mély tányérban', 'Töltött káposzta, kedden'],
  [palacsintaPhoto, 'Hajtogatott palacsinták mintás tányéron', 'Palacsinta, szerdán'],
]

/** Three plates from the counter, staggered like they were just put down. */
function FoodStrip() {
  return (
    <section className="food" aria-labelledby="pultrol">
      <h2 id="pultrol" className="sr">A pultról</h2>
      {FOOD.map(([src, alt, caption]) => (
        <figure key={caption}>
          <img src={src} alt={alt} width="640" height="800" loading="lazy" />
          <figcaption>{caption}</figcaption>
        </figure>
      ))}
    </section>
  )
}

/** The door sign flips to the side that is true right now. */
function DoorSign({ status }) {
  return (
    <div className={`sign${status.open ? ' open' : ''}`}>
      <span className="sign-string" aria-hidden="true" />
      <p className="sign-board">{status.open ? 'Nyitva' : 'Zárva'}</p>
      <p className="sign-sub">{status.text}</p>
    </div>
  )
}

export default function App() {
  const today = useMemo(() => {
    const d = new Date()
    d.setHours(12, 0, 0, 0)
    return d
  }, [])
  const now = useMemo(() => new Date(), [])
  const [view, setView] = useState('today')
  const [week, setWeek] = useState(() => loadWeek())
  const [authed, setAuthed] = useState(() => isLoggedIn())
  const [password, setPassword] = useState('')
  const [pinError, setPinError] = useState(false)
  const todayDay = today.getDay()
  const [weekDay, setWeekDay] = useState(todayDay >= 1 && todayDay <= 5 ? todayDay : 1)
  const [editDay, setEditDay] = useState(todayDay >= 1 && todayDay <= 5 ? todayDay : 1)
  const [avoid, setAvoid] = useState([])
  const [stamps, setStamps] = useState(() => loadStamps())
  const [freshStamp, setFreshStamp] = useState(false)
  const status = useMemo(() => shopStatus(now), [now])

  const tel = `tel:${BUSINESS.phone.replace(/\s/g, '')}`
  // On the weekend the board already shows Monday, like a real board left out on Friday.
  const weekend = todayDay === 0 || todayDay === 6
  const monday = addDays(mondayOf(today), weekend ? 7 : 0)
  const boardDate = weekend ? monday : today
  const boardHeading = weekend ? 'Hétfőn ez lesz' : `Ma, ${weekdayName(todayDay)}`
  const todayMenu = dayMenu(week, boardDate)
  const weekDate = addDays(monday, weekDay - 1)
  const todayIso = isoLocal(today)

  function onLogin(event) {
    event.preventDefault()
    if (login(password, BUSINESS.adminPassword)) {
      setAuthed(true)
      setPinError(false)
      return
    }
    setPinError(true)
  }

  function onLogout() {
    logout()
    setAuthed(false)
  }

  const loginProps = { password, setPassword, pinError, onLogin }

  return (
    <>
      <a className="skip" href="#tartalom">
        Ugrás a menühöz
      </a>
      <p className="banner" role="status">
        <strong>Bemutató projekt</strong>, saját kezdeményezés. Nem élő étterem. Készítette: <a href="https://rizmajerdev.com/">Rizmajer Máté</a>{' '}
        <a className="banner-cta" href="https://rizmajerdev.com/?demo=napi-menu#kapcsolat">
          Ilyet kérek a vállalkozásomnak →
        </a>
      </p>

      <header className="mast">
        <div className="mast-inner">
          <p className="brand">
            {BUSINESS.name}
            <span>
              {BUSINESS.city}, {BUSINESS.address}
            </span>
          </p>
          <nav aria-label="Nézet">
            <button type="button" aria-current={view === 'today' ? 'page' : undefined} onClick={() => setView('today')}>
              Mai menü
            </button>
            <button type="button" aria-current={view === 'week' ? 'page' : undefined} onClick={() => setView('week')}>
              A hét
            </button>
            <button type="button" aria-current={view === 'counter' ? 'page' : undefined} onClick={() => setView('counter')}>
              Pult
            </button>
            <button type="button" aria-current={view === 'edit' ? 'page' : undefined} onClick={() => setView('edit')}>
              Szerkesztés
            </button>
          </nav>
        </div>
      </header>

      <main id="tartalom">
        {view === 'today' ? (
          <>
            <section className="cloth today">
              <div className="today-grid">
                <div className="today-copy">
                  <h1>{weekend ? 'Hétvégén zárva' : 'Mi a mai menü?'}</h1>
                  <p className="lede">Ami a táblán van, az a pulton is. Hétköznap 11-től 15 óráig, amíg a leves tart.</p>
                  <p className={status.open ? 'status open' : 'status'} role="status">
                    <span className="live" aria-hidden="true" />
                    {status.text}
                  </p>
                  <div className="today-actions">
                    {weekend ? null : (
                      <a className="btn" href="#rendeles">
                        Rendelés elvitelre
                      </a>
                    )}
                    <a className="btn ghost" href={tel}>
                      {BUSINESS.phone}
                    </a>
                  </div>
                </div>
                <div className="board-col">
                  <Letterboard menu={todayMenu} heading={boardHeading} seed={todayDay + 1} avoid={avoid} />
                  {todayMenu.closed ? null : <DietFilter avoid={avoid} onToggle={(c) => setAvoid((a) => (a.includes(c) ? a.filter((x) => x !== c) : [...a, c]))} />}
                </div>
              </div>
            </section>
            {weekend ? null : (
              <OrderPanel
                menu={todayMenu}
                now={now}
                dateIso={todayIso}
                onStamp={(st) => {
                  setStamps(st.free ? 0 : st.count)
                  setFreshStamp(true)
                }}
              />
            )}
            <StampCard count={stamps} fresh={freshStamp} />
            <FoodStrip />
            <TearPad week={week} monday={monday} startDay={weekend ? 1 : todayDay} />
            <section className="visit" aria-labelledby="hol">
              <img src={soupPhoto} alt="Gőzölgő leves egy nagy üstben, mellette szárított paprikafüzér" width="1200" height="358" loading="lazy" />
              <DoorSign status={status} />
              <div className="visit-text">
                <h2 id="hol">A körúton, a sarkon.</h2>
                <p>
                  {BUSINESS.address}, {BUSINESS.city}. {BUSINESS.hours}. Asztalt nem kell foglalni, elvitelre is adunk.
                </p>
              </div>
            </section>
          </>
        ) : null}

        {view === 'week' ? (
          <section className="cloth">
            <h1 className="page-title">A heti menü</h1>
            <div className="week-tabs" role="group" aria-label="Nap">
              {[1, 2, 3, 4, 5].map((day) => (
                <button key={day} type="button" aria-pressed={weekDay === day} onClick={() => setWeekDay(day)}>
                  {weekdayName(day)}
                  {day === todayDay ? <small>ma</small> : null}
                </button>
              ))}
            </div>
            {/* The key remounts the board, so the letters are set again for the new day */}
            <Letterboard key={weekDay} menu={dayMenu(week, weekDate)} heading={formatDay(isoLocal(weekDate))} seed={weekDay + 1} />
          </section>
        ) : null}

        {view === 'counter' ? (
          <section className="cloth counter">
            {authed ? (
              <>
                <div className="edit-head">
                  <h1 className="page-title">Pult, mai rendelések</h1>
                  <button type="button" className="btn ghost" onClick={onLogout}>
                    Kilépés
                  </button>
                </div>
                <Counter dateIso={todayIso} />
              </>
            ) : (
              <LoginForm title="Pult" intro="Itt látja a konyha a mai elviteles rendeléseket, átvételi idő szerint." {...loginProps} />
            )}
          </section>
        ) : null}

        {view === 'edit' ? (
          <section className="cloth edit">
            {authed ? (
              <>
                <div className="edit-head">
                  <h1 className="page-title">Szerkesztés</h1>
                  <button type="button" className="btn ghost" onClick={onLogout}>
                    Kilépés
                  </button>
                </div>
                <div className="week-tabs" role="group" aria-label="Melyik nap menüje">
                  {[1, 2, 3, 4, 5].map((day) => (
                    <button key={day} type="button" aria-pressed={editDay === day} onClick={() => setEditDay(day)}>
                      {weekdayName(day)}
                    </button>
                  ))}
                </div>
                <Editor
                  key={editDay}
                  day={editDay}
                  menu={week[editDay]}
                  onSave={(day, menu) => {
                    const result = saveDay(day, menu)
                    if (result.ok) setWeek(result.week)
                    return result
                  }}
                />
                <QrPoster />
              </>
            ) : (
              <LoginForm title="Szerkesztés" intro="A tulajdonos itt írja át a menüt, telefonról is." {...loginProps} />
            )}
          </section>
        ) : null}
      </main>

      <footer>
        {BUSINESS.name}, {BUSINESS.address}, {BUSINESS.city}. {BUSINESS.hours}. Bemutató a portfólióhoz, nem élő étterem.
      </footer>
    </>
  )
}
