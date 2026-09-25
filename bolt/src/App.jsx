import { useEffect, useMemo, useRef, useState } from 'react'
import {
  BUSINESS,
  CATEGORIES,
  HOURS,
  PRODUCTS,
  WEEKDAYS,
  arrivalIso,
  filterProducts,
  formatHuf,
  holdUntil,
  minutesToLabel,
  openLabel,
  openState,
  productById,
  stockLevel,
} from './shop.js'
import { closeHold, createHold, freeOf, loadHolds, loadStock, setStock, stockOf } from './storage.js'

const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0]

function formatDay(iso, opts) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Intl.DateTimeFormat('hu-HU', opts).format(new Date(y, m - 1, d, 12))
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

function StockPill({ product, free }) {
  const level = stockLevel(free)
  if (level === 'ok') return <span className="pill ok">Raktáron</span>
  if (level === 'low')
    return (
      <span className="pill low">
        Már csak {free} {product.unit}
      </span>
    )
  const arrives = arrivalIso(product)
  return <span className="pill none">{arrives ? `Elfogyott · érkezik ${formatDay(arrives, { month: 'short', day: 'numeric' })}` : 'Elfogyott'}</span>
}

export default function App() {
  const [view, setView] = useState('catalog')
  const [now, setNow] = useState(() => new Date())
  const [query, setQuery] = useState('')
  const [cat, setCat] = useState(null)
  const [inStockOnly, setInStockOnly] = useState(false)
  const [stock, setStockState] = useState(() => loadStock())
  const [holds, setHolds] = useState(() => loadHolds())
  const [target, setTarget] = useState(null)
  const [qty, setQty] = useState('1')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [errors, setErrors] = useState({})
  const [placed, setPlaced] = useState(null)
  const [pin, setPin] = useState('')
  const [adminOk, setAdminOk] = useState(false)
  const [pinError, setPinError] = useState(false)
  const dialog = useRef(null)

  // The open/closed badge should turn over at 18:00 without a reload.
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(t)
  }, [])

  const state = openState(now)
  const hold = holdUntil(now)
  const free = (p) => freeOf(p, stock, holds)
  const shown = useMemo(
    () => filterProducts(PRODUCTS, { query, cat, inStockOnly, available: (p) => freeOf(p, stock, holds) }),
    [query, cat, inStockOnly, stock, holds],
  )

  function openHold(product) {
    setTarget(product)
    setQty('1')
    setErrors({})
    setPlaced(null)
    dialog.current?.showModal()
  }

  function submitHold(event) {
    event.preventDefault()
    const n = Number(qty)
    const left = free(target)
    const next = {}
    if (!Number.isInteger(n) || n < 1 || n > left) next.qty = `1 és ${left} között.`
    if (name.trim().length < 2) next.name = 'Írd be a neved.'
    if (phone.replace(/\D/g, '').length < 8) next.phone = 'Egy hívható szám kell.'
    setErrors(next)
    const first = ['qty', 'name', 'phone'].find((k) => next[k])
    if (first) {
      document.getElementById(first)?.focus()
      return
    }
    const result = createHold({ productId: target.id, qty: n, name: name.trim(), phone: phone.trim() })
    setHolds(result.holds)
    if (!result.ok) {
      setErrors({ qty: result.free ? `Közben elvittek belőle, már csak ${result.free} van.` : 'Közben elfogyott.' })
      return
    }
    setPlaced(result.hold)
  }

  function tryPin(event) {
    event.preventDefault()
    if (pin.trim() === BUSINESS.adminPin) {
      setAdminOk(true)
      setPinError(false)
      setStockState(loadStock())
      setHolds(loadHolds())
      return
    }
    setPinError(true)
  }

  function finish(id, picked) {
    const result = closeHold(id, picked)
    setHolds(result.holds)
    setStockState(result.stock)
  }

  const holdLabel = `${WEEKDAYS[hold.weekday]} ${minutesToLabel(hold.closesAt)}-ig`

  return (
    <>
      <a className="skip" href="#tartalom">
        Ugrás a termékekhez
      </a>
      <p className="banner" role="status">
        <strong>Bemutató projekt</strong> — saját kezdeményezés. A készlet és a félretétel csak ebben a böngészőben él. Készítette:{' '}
        <a href="https://rizmajerdev.com/">Rizmajer Máté</a>
        {' '}<a className="banner-cta" href="https://rizmajerdev.com/?demo=bolt#kapcsolat">Ilyet kérek a vállalkozásomnak →</a>
      </p>

      <header className="top">
        <p className="brand">
          {BUSINESS.name}
          <span>{BUSINESS.city}</span>
        </p>
        <p className={state.open ? 'open-badge is-open' : 'open-badge'}>
          <span aria-hidden="true" />
          {openLabel(state)}
        </p>
        <nav aria-label="Nézet">
          <button type="button" aria-current={view === 'catalog' ? 'page' : undefined} onClick={() => setView('catalog')}>
            Termékek
          </button>
          <button
            type="button"
            aria-current={view === 'admin' ? 'page' : undefined}
            onClick={() => {
              setPinError(false)
              setView('admin')
            }}
          >
            Bolt
          </button>
        </nav>
      </header>

      <main id="tartalom">
        {view === 'admin' ? (
          <section className="sheet admin">
            <h1>Bolt</h1>
            <p className="lede">Ezt látná a tulajdonos a telefonján: ki mit kért félre, és mennyi van a polcon. A bemutató PIN-je nyilvános: {BUSINESS.adminPin}.</p>
            {adminOk ? (
              <>
                <h2>Félretéve</h2>
                {holds.length ? (
                  <ul className="hold-list">
                    {holds.map((h) => {
                      const p = productById(h.productId)
                      return (
                        <li key={h.id}>
                          <div>
                            <strong>
                              {h.qty} {p?.unit} · {p?.name ?? h.productId}
                            </strong>
                            <span>
                              {h.name} · <a href={`tel:${h.phone.replace(/\s/g, '')}`}>{h.phone}</a>
                            </span>
                            <span>Eddig tartjuk: {formatDay(h.holdUntil, { month: 'long', day: 'numeric', weekday: 'long' })}</span>
                          </div>
                          <div className="actions">
                            <button type="button" className="primary" onClick={() => finish(h.id, true)}>
                              Átvette
                            </button>
                            <button type="button" onClick={() => finish(h.id, false)}>
                              Visszatesz
                            </button>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                ) : (
                  <p className="empty">Nincs félretett áru.</p>
                )}

                <h2>Készlet</h2>
                <p className="hint">Ha elfogy vagy jön az áru, itt kell átírni, és a vevők azonnal látják.</p>
                <ul className="stock-list">
                  {PRODUCTS.map((p) => {
                    const count = stockOf(p, stock)
                    return (
                      <li key={p.id}>
                        <span>
                          {p.name}
                          <small>{count - free(p) > 0 ? `${count - free(p)} félretéve` : p.spec}</small>
                        </span>
                        <span className="stepper" role="group" aria-label={`${p.name} készlet`}>
                          <button type="button" aria-label="Eggyel kevesebb" disabled={count <= 0} onClick={() => setStockState(setStock(p.id, count - 1))}>
                            −
                          </button>
                          <output aria-live="polite">{count}</output>
                          <button type="button" aria-label="Eggyel több" onClick={() => setStockState(setStock(p.id, count + 1))}>
                            +
                          </button>
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </>
            ) : (
              <form className="pin" onSubmit={tryPin}>
                <Field id="pin" label="PIN" value={pin} onChange={setPin} type="password" autoComplete="off" error={pinError ? 'Nem ez a PIN.' : undefined} />
                <button className="submit" type="submit">
                  Megnyitás
                </button>
              </form>
            )}
          </section>
        ) : (
          <>
            <section className="intro">
              <p className="eyebrow">Vas-műszaki bolt · {BUSINESS.city}</p>
              <h1>Nézd meg, van-e, mielőtt elindulsz.</h1>
              <p className="lede">
                A készlet itt látszik. Ha van, félretesszük neked {holdLabel}, fizetni a pultnál kell. Amit nem találsz, arra hívj fel, és megrendeljük.
              </p>
            </section>

            <section className="tools" aria-label="Keresés és szűrés">
              <div className="field search">
                <label htmlFor="kereses">Keresés</label>
                <input
                  id="kereses"
                  type="search"
                  value={query}
                  placeholder="pl. csavar, led izzó, tömlő"
                  autoComplete="off"
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <div className="chips" role="group" aria-label="Kategória">
                <button type="button" aria-pressed={cat === null} onClick={() => setCat(null)}>
                  Mind
                </button>
                {CATEGORIES.map((c) => (
                  <button key={c.id} type="button" aria-pressed={cat === c.id} onClick={() => setCat(cat === c.id ? null : c.id)}>
                    {c.name}
                  </button>
                ))}
              </div>
              <label className="check">
                <input type="checkbox" checked={inStockOnly} onChange={(e) => setInStockOnly(e.target.checked)} />
                Csak ami most raktáron van
              </label>
            </section>

            <p className="count" role="status">
              {shown.length} termék
            </p>

            {shown.length ? (
              <ul className="grid">
                {shown.map((p) => {
                  const left = free(p)
                  return (
                    <li key={p.id} className="card">
                      <p className="cat">{CATEGORIES.find((c) => c.id === p.cat)?.name}</p>
                      <h2>{p.name}</h2>
                      <p className="spec">{p.spec}</p>
                      <StockPill product={p} free={left} />
                      <div className="buy">
                        <strong>
                          {formatHuf(p.priceHuf)}
                          <small> / {p.unit}</small>
                        </strong>
                        <button type="button" disabled={left <= 0} onClick={() => openHold(p)}>
                          Félreteszem
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="empty">
                Nincs ilyen a listán. Hívj fel: <a href={`tel:${BUSINESS.phone.replace(/\s/g, '')}`}>{BUSINESS.phone}</a>, és megnézzük, be tudjuk-e hozni.
              </p>
            )}

            <section className="visit" aria-labelledby="hol">
              <h2 id="hol">Hol találsz</h2>
              <div className="visit-grid">
                <dl className="facts">
                  <div>
                    <dt>Cím</dt>
                    <dd>
                      {BUSINESS.address}, {BUSINESS.city}
                    </dd>
                  </div>
                  <div>
                    <dt>Telefon</dt>
                    <dd>
                      <a href={`tel:${BUSINESS.phone.replace(/\s/g, '')}`}>{BUSINESS.phone}</a>
                    </dd>
                  </div>
                  <div>
                    <dt>Parkolás</dt>
                    <dd>Az udvarban, a bejárat mellett.</dd>
                  </div>
                </dl>
                <table className="hours">
                  <caption>Nyitvatartás</caption>
                  <tbody>
                    {WEEK_ORDER.map((d) => (
                      <tr key={d} className={d === now.getDay() ? 'today' : undefined} aria-current={d === now.getDay() ? 'date' : undefined}>
                        <th scope="row">{WEEKDAYS[d]}</th>
                        <td>{HOURS[d] ? `${minutesToLabel(HOURS[d][0])}–${minutesToLabel(HOURS[d][1])}` : 'zárva'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>

      <dialog ref={dialog} className="hold" aria-labelledby="hold-title" onClose={() => setTarget(null)}>
        {target ? (
          placed ? (
            <div>
              <p className="eyebrow">Félretettük</p>
              <h2 id="hold-title">
                {placed.qty} {target.unit} {target.name}
              </h2>
              <p className="lede">
                A pultnál vár a neveddel, {formatDay(placed.holdUntil, { weekday: 'long' })} {minutesToLabel(hold.closesAt)}-ig. Élesben SMS-t kapnál róla. A „Bolt”
                nézetben látod, mit lát a tulajdonos.
              </p>
              <button type="button" className="submit" onClick={() => dialog.current?.close()}>
                Rendben
              </button>
            </div>
          ) : (
            <form onSubmit={submitHold} noValidate>
              <p className="eyebrow">Félretétel · {holdLabel}</p>
              <h2 id="hold-title">{target.name}</h2>
              <p className="hint">
                {formatHuf(target.priceHuf)} / {target.unit} · {free(target)} {target.unit} szabad
              </p>
              <Field
                id="qty"
                label={`Mennyiség (${target.unit})`}
                type="number"
                inputMode="numeric"
                min={1}
                max={free(target)}
                value={qty}
                onChange={setQty}
                error={errors.qty}
              />
              <Field id="name" label="Név" value={name} onChange={setName} autoComplete="name" error={errors.name} />
              <Field id="phone" label="Telefon" value={phone} onChange={setPhone} type="tel" autoComplete="tel" error={errors.phone} />
              <div className="row">
                <button type="submit" className="submit">
                  Félreteszem
                </button>
                <button type="button" className="ghost" onClick={() => dialog.current?.close()}>
                  Mégse
                </button>
              </div>
            </form>
          )
        ) : null}
      </dialog>
    </>
  )
}
