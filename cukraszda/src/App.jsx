import { useMemo, useState } from 'react'
import {
  BUSINESS,
  DAILY_CAKE_LIMIT,
  INSCRIPTION_MAX,
  PRODUCTS,
  QTY_MAX,
  addDays,
  cakeCount,
  cartTotal,
  dayStatus,
  formatHuf,
  isoLocal,
  lineTotal,
  minutesToLabel,
  noonOf,
  pickupTimes,
  productById,
  sizeOf,
} from './order.js'
import { createOrder, deleteOrder, loadOrders } from './storage.js'

const DAY_COUNT = 14
const TIMES = pickupTimes()
const CAKES = PRODUCTS.filter((p) => p.kind === 'torta')
const TRAYS = PRODUCTS.filter((p) => p.kind === 'talca')

const DAY_NOTE = { closed: 'zárva', early: 'korai', full: 'betelt' }

function formatDay(iso, opts) {
  return new Intl.DateTimeFormat('hu-HU', opts).format(noonOf(iso))
}

function Field({ id, label, value, onChange, error, type = 'text', ...rest }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(e) => onChange(e.target.value)}
        {...rest}
      />
      {error ? (
        <p id={`${id}-error`} className="field-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}

/** The shop sign: neon script over block capitals. */
function Sign() {
  return (
    <p className="sign">
      <span className="neon">Habcsók</span>
      <span className="sign-caps">Cukrászda</span>
    </p>
  )
}

export default function App() {
  const [view, setView] = useState('order')
  const [sizes, setSizes] = useState(() => Object.fromEntries(PRODUCTS.map((p) => [p.id, p.sizes[0].id])))
  const [lines, setLines] = useState([])
  const [pickupDate, setPickupDate] = useState(null)
  const [pickupMin, setPickupMin] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [errors, setErrors] = useState({})
  const [order, setOrder] = useState(null)
  const [orders, setOrders] = useState(() => loadOrders())
  const [pin, setPin] = useState('')
  const [adminOk, setAdminOk] = useState(false)
  const [pinError, setPinError] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(null)

  const days = useMemo(() => {
    const today = isoLocal(new Date())
    return Array.from({ length: DAY_COUNT }, (_, i) => addDays(today, i + 1))
  }, [])
  const statuses = useMemo(
    () => Object.fromEntries(days.map((iso) => [iso, dayStatus(iso, lines, orders)])),
    [days, lines, orders],
  )
  // A day picked earlier can stop fitting when the basket grows.
  const chosenDate = pickupDate && statuses[pickupDate]?.status === 'open' ? pickupDate : null
  const total = cartTotal(lines)
  const itemCount = lines.reduce((n, l) => n + l.qty, 0)

  function add(product) {
    const sizeId = sizes[product.id]
    setErrors((prev) => ({ ...prev, lines: undefined }))
    setLines((prev) => {
      const hit = prev.find((l) => l.productId === product.id && l.sizeId === sizeId)
      if (hit) return prev.map((l) => (l === hit ? { ...l, qty: Math.min(QTY_MAX, l.qty + 1) } : l))
      return [...prev, { productId: product.id, sizeId, qty: 1, inscription: '' }]
    })
  }

  function changeLine(target, patch) {
    setLines((prev) =>
      prev.flatMap((l) => {
        if (l !== target) return [l]
        const next = { ...l, ...patch }
        return next.qty <= 0 ? [] : [next]
      }),
    )
  }

  function onSubmit(event) {
    event.preventDefault()
    const next = {}
    if (!lines.length) next.lines = 'Tegyél valamit a dobozba.'
    if (!chosenDate) next.nap = 'Válassz átvételi napot.'
    if (pickupMin === '') next.ido = 'Válassz időpontot.'
    if (name.trim().length < 2) next.name = 'Írd be a neved.'
    if (phone.replace(/\D/g, '').length < 8) next.phone = 'Egy hívható szám kell.'
    setErrors(next)
    const first = ['lines', 'nap', 'ido', 'name', 'phone'].find((k) => next[k])
    if (first) {
      document.getElementById(first === 'lines' ? 'kosar' : first)?.focus()
      return
    }

    const result = createOrder({
      lines: lines.map((l) => ({ ...l, inscription: l.inscription.trim() })),
      pickupDate: chosenDate,
      pickupMin: Number(pickupMin),
      total,
      name: name.trim(),
      phone: phone.trim(),
    })
    setOrders(result.orders)
    if (!result.ok) {
      setPickupDate(null)
      setErrors({ nap: 'Ez a nap közben betelt. Válassz másikat.' })
      document.getElementById('nap')?.focus()
      return
    }
    setOrder(result.order)
    setLines([])
    setPickupDate(null)
    setPickupMin('')
    setView('done')
    window.scrollTo({ top: 0 })
    requestAnimationFrame(() => document.getElementById('kesz-cim')?.focus())
  }

  function tryPin(event) {
    event.preventDefault()
    if (pin.trim() === BUSINESS.adminPin) {
      setAdminOk(true)
      setPinError(false)
      setOrders(loadOrders())
      return
    }
    setPinError(true)
  }

  function remove(id) {
    if (pendingDelete !== id) {
      setPendingDelete(id)
      return
    }
    setOrders(deleteOrder(id))
    setPendingDelete(null)
  }

  const byDay = Object.entries(
    [...orders]
      .sort((a, b) => a.pickupDate.localeCompare(b.pickupDate) || a.pickupMin - b.pickupMin)
      .reduce((acc, o) => ({ ...acc, [o.pickupDate]: [...(acc[o.pickupDate] ?? []), o] }), {}),
  )

  const lineLabel = (l) => `${productById(l.productId)?.name ?? l.productId}, ${sizeOf(l)?.label ?? ''}`
  const tel = BUSINESS.phone.replace(/\s/g, '')

  const sizePicker = (p, size) =>
    p.sizes.length > 1 ? (
      <div className="sizes" role="group" aria-label={`${p.name} mérete`}>
        {p.sizes.map((s) => (
          <button key={s.id} type="button" aria-pressed={s.id === size.id} onClick={() => setSizes((prev) => ({ ...prev, [p.id]: s.id }))}>
            {s.label}
          </button>
        ))}
      </div>
    ) : null

  return (
    <>
      <a className="skip" href="#tartalom">
        Ugrás a rendeléshez
      </a>
      <p className="banner" role="status">
        <strong>Bemutató projekt.</strong> Saját kezdeményezés, a rendelés csak ebben a böngészőben marad. Készítette:{' '}
        <a href="https://rizmajerdev.com/">Rizmajer Máté</a>{' '}
        <a className="banner-cta" href="https://rizmajerdev.com/?demo=cukraszda#kapcsolat">
          Ilyet kérek a vállalkozásomnak →
        </a>
      </p>

      <div className="awning" aria-hidden="true" />

      <nav className="top" aria-label="Nézet">
        <Sign />
        <div className="top-links">
          <button type="button" aria-current={view !== 'admin' ? 'page' : undefined} onClick={() => setView(order ? 'done' : 'order')}>
            Rendelés
          </button>
          <button
            type="button"
            aria-current={view === 'admin' ? 'page' : undefined}
            onClick={() => {
              setPinError(false)
              setView('admin')
            }}
          >
            Pult
          </button>
        </div>
      </nav>

      <main id="tartalom">
        {view === 'admin' ? (
          <section className="board wide">
            <h1>Pult</h1>
            <p className="board-lede">
              Ezt látná a cukrászda: mit kell sütni, mikorra. Napi kapacitás {DAILY_CAKE_LIMIT} torta. A bemutató PIN-je nyilvános: {BUSINESS.adminPin}.
            </p>
            {adminOk ? (
              byDay.length ? (
                byDay.map(([iso, list]) => (
                  <section key={iso} className="day-group">
                    <h2>
                      {formatDay(iso, { month: 'long', day: 'numeric', weekday: 'long' })}
                      <small>
                        {list.reduce((n, o) => n + cakeCount(o.lines), 0)} / {DAILY_CAKE_LIMIT} torta
                      </small>
                    </h2>
                    <ul className="order-list">
                      {list.map((o) => (
                        <li key={o.id}>
                          <div>
                            <strong>
                              {minutesToLabel(o.pickupMin)} {o.name}, <a href={`tel:${o.phone.replace(/\s/g, '')}`}>{o.phone}</a>
                            </strong>
                            {o.lines.map((l, i) => (
                              <span key={i}>
                                {l.qty} × {lineLabel(l)}
                                {l.inscription ? <em> „{l.inscription}”</em> : null}
                              </span>
                            ))}
                            <span>{formatHuf(o.total ?? cartTotal(o.lines))}, átvételkor fizet</span>
                          </div>
                          <button type="button" className="pill-btn" onClick={() => remove(o.id)}>
                            {pendingDelete === o.id ? 'Biztos?' : 'Átadva'}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </section>
                ))
              ) : (
                <p className="board-lede">Még nincs rendelés. Adj le egyet a Rendelés oldalon, és itt megjelenik.</p>
              )
            ) : (
              <form className="pin" onSubmit={tryPin}>
                <Field id="pin" label="PIN" value={pin} onChange={setPin} type="password" autoComplete="off" error={pinError ? 'Nem ez a PIN.' : undefined} />
                <button className="cta" type="submit">
                  Megnyitás
                </button>
              </form>
            )}
          </section>
        ) : null}

        {view === 'done' && order ? (
          <section className="thanks">
            <p className="neon thanks-neon" aria-hidden="true">
              Köszönjük!
            </p>
            <h1 id="kesz-cim" tabIndex={-1}>
              Várunk {formatDay(order.pickupDate, { weekday: 'long' })} {minutesToLabel(order.pickupMin)}-kor.
            </h1>
            <ul className="receipt">
              {order.lines.map((l, i) => (
                <li key={i}>
                  <span>
                    {l.qty} × {lineLabel(l)}
                    {l.inscription ? <em>Felirat: „{l.inscription}”</em> : null}
                  </span>
                  <span>{formatHuf(lineTotal(l))}</span>
                </li>
              ))}
              <li className="sum">
                <span>Átvételkor fizetendő</span>
                <span>{formatHuf(order.total)}</span>
              </li>
            </ul>
            <p className="thanks-note">
              {formatDay(order.pickupDate, { year: 'numeric', month: 'long', day: 'numeric' })}, {BUSINESS.address} Élesben erről SMS menne. A Pult oldalon
              látod, mit kap belőle a cukrászda.
            </p>
            <div className="row">
              <button
                className="cta"
                type="button"
                onClick={() => {
                  setOrder(null)
                  setView('order')
                }}
              >
                Új rendelés
              </button>
              <button className="pill-btn" type="button" onClick={() => setView('admin')}>
                Pult nézet
              </button>
            </div>
          </section>
        ) : null}

        {view === 'order' ? (
          <>
            <section className="front">
              <div className="front-sign">
                <h1>Rendeld meg előre. Mi elkészítjük.</h1>
                <p className="front-lede">Torta két nappal, tálca egy nappal előre. Fizetés átvételkor, a pultnál.</p>
                <a className="cta" href="#kinalat">
                  Tortát rendelek
                </a>
              </div>
              <img className="front-photo" src="/torta.webp" width="800" height="1000" alt="Rózsaszín és sárga piskótarétegekből álló torta, tetején színes cukorszórással" />
            </section>

            <div className="shop">
              <div className="menu">
                <section id="kinalat" aria-labelledby="tortak">
                  <h2 id="tortak" className="menu-title">
                    Torták
                  </h2>
                  <ul className="cakes">
                    {CAKES.map((p) => {
                      const size = p.sizes.find((s) => s.id === sizes[p.id])
                      return (
                        <li key={p.id} className="cake">
                          <div className="cake-head">
                            <h3>{p.name}</h3>
                            <p className="price">{formatHuf(size.priceHuf)}</p>
                          </div>
                          <p className="cake-blurb">{p.blurb}</p>
                          <div className="cake-foot">
                            {sizePicker(p, size)}
                            <button type="button" className="add" onClick={() => add(p)} aria-label={`${p.name}, ${size.label} a dobozba`}>
                              Dobozba
                            </button>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </section>

                <section className="letterboard" aria-labelledby="talcak">
                  <h2 id="talcak">Tálcák egy nappal előre</h2>
                  <ul>
                    {TRAYS.map((p) => {
                      const size = p.sizes[0]
                      return (
                        <li key={p.id}>
                          <span className="lb-name">
                            {p.name}
                            <small>{p.blurb}</small>
                          </span>
                          <span className="lb-price">{formatHuf(size.priceHuf)}</span>
                          <button type="button" className="lb-add" onClick={() => add(p)} aria-label={`${p.name} a dobozba`}>
                            +
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </section>

                <dl className="facts">
                  <div>
                    <dt>Nyitva</dt>
                    <dd>{BUSINESS.hours}</dd>
                  </div>
                  <div>
                    <dt>Cím</dt>
                    <dd>
                      {BUSINESS.address} {BUSINESS.city}
                    </dd>
                  </div>
                  <div>
                    <dt>Telefon</dt>
                    <dd>
                      <a href={`tel:${tel}`}>{BUSINESS.phone}</a>
                    </dd>
                  </div>
                </dl>
              </div>

              <form className="box" onSubmit={onSubmit} noValidate>
                <h2 id="kosar" tabIndex={-1}>
                  A dobozod
                </h2>
                {lines.length ? (
                  <ul className="lines">
                    {lines.map((l) => {
                      const p = productById(l.productId)
                      const key = `${l.productId}-${l.sizeId}`
                      return (
                        <li key={key}>
                          <div className="line-top">
                            <span>
                              <strong>{p.name}</strong>
                              <small>{sizeOf(l).label}</small>
                            </span>
                            <span className="qty" role="group" aria-label={`${p.name} darabszám`}>
                              <button type="button" aria-label="Eggyel kevesebb" onClick={() => changeLine(l, { qty: l.qty - 1 })}>
                                −
                              </button>
                              <output aria-live="polite">{l.qty}</output>
                              <button type="button" aria-label="Eggyel több" disabled={l.qty >= QTY_MAX} onClick={() => changeLine(l, { qty: l.qty + 1 })}>
                                +
                              </button>
                            </span>
                            <span className="line-price">{formatHuf(lineTotal(l))}</span>
                          </div>
                          {p.kind === 'torta' ? (
                            <div className="field inscription">
                              <label htmlFor={`felirat-${key}`}>Felirat a tortára, ha kell</label>
                              <input
                                id={`felirat-${key}`}
                                value={l.inscription}
                                maxLength={INSCRIPTION_MAX}
                                placeholder="pl. Boldog szülinapot, Anna!"
                                onChange={(e) => changeLine(l, { inscription: e.target.value })}
                              />
                              <small>
                                {l.inscription.length}/{INSCRIPTION_MAX}
                              </small>
                            </div>
                          ) : null}
                        </li>
                      )
                    })}
                    <li className="sum">
                      <span>Összesen, átvételkor</span>
                      <strong>{formatHuf(total)}</strong>
                    </li>
                  </ul>
                ) : (
                  <p className="box-empty">Még üres. Válassz egy tortát vagy tálcát a kínálatból.</p>
                )}
                {errors.lines ? (
                  <p className="field-error" role="alert">
                    {errors.lines}
                  </p>
                ) : null}

                <fieldset id="nap" tabIndex={-1}>
                  <legend>Átvétel napja</legend>
                  <div className="days">
                    {days.map((iso) => {
                      const st = statuses[iso]
                      const off = st.status !== 'open'
                      const on = iso === chosenDate
                      return (
                        <button
                          key={iso}
                          type="button"
                          disabled={off}
                          aria-pressed={off ? undefined : on}
                          className="day"
                          onClick={() => {
                            setPickupDate(iso)
                            setErrors((prev) => ({ ...prev, nap: undefined }))
                          }}
                        >
                          <span>{formatDay(iso, { weekday: 'short' })}</span>
                          <strong>{formatDay(iso, { day: 'numeric' })}</strong>
                          <small>{DAY_NOTE[st.status] ?? formatDay(iso, { month: 'short' })}</small>
                        </button>
                      )
                    })}
                  </div>
                  <p className="hint">Korai: addigra nem készül el. Betelt: aznapra elfogyott a tortakapacitás, tálcát még lehet kérni.</p>
                  {errors.nap ? (
                    <p className="field-error" role="alert">
                      {errors.nap}
                    </p>
                  ) : null}
                </fieldset>

                <div className="field">
                  <label htmlFor="ido">Átvétel ideje</label>
                  <select
                    id="ido"
                    value={pickupMin}
                    aria-invalid={errors.ido ? true : undefined}
                    aria-describedby={errors.ido ? 'ido-error' : undefined}
                    onChange={(e) => {
                      setPickupMin(e.target.value)
                      setErrors((prev) => ({ ...prev, ido: undefined }))
                    }}
                  >
                    <option value="">Válassz…</option>
                    {TIMES.map((m) => (
                      <option key={m} value={m}>
                        {minutesToLabel(m)}
                      </option>
                    ))}
                  </select>
                  {errors.ido ? (
                    <p id="ido-error" className="field-error" role="alert">
                      {errors.ido}
                    </p>
                  ) : null}
                </div>

                <Field id="name" label="Név" value={name} onChange={setName} autoComplete="name" error={errors.name} />
                <Field id="phone" label="Telefon" value={phone} onChange={setPhone} type="tel" autoComplete="tel" error={errors.phone} />

                <button className="cta cta-full" type="submit">
                  Megrendelem{lines.length ? `, ${formatHuf(total)}` : ''}
                </button>
              </form>
            </div>

            {itemCount ? (
              <a className="cart-bar" href="#kosar">
                <span>A dobozban: {itemCount} tétel</span>
                <strong>{formatHuf(total)}</strong>
              </a>
            ) : null}
          </>
        ) : null}
      </main>

      <footer className="foot">
        <p>
          {BUSINESS.name}, {BUSINESS.address} {BUSINESS.city}. <a href={`tel:${tel}`}>{BUSINESS.phone}</a>
        </p>
        <p>Kitalált vállalkozás, bemutató célra. Fotó: Lummi.</p>
      </footer>
    </>
  )
}
