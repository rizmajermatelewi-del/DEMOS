import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Broom,
  Drop,
  Hammer,
  Knife,
  Lightbulb,
  Nut,
  Package,
  PaintBrush,
  PaintBrushBroad,
  PaintBucket,
  Plug,
  PlugsConnected,
  Ruler,
  Screwdriver,
  Spiral,
  Trash,
} from '@phosphor-icons/react'
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
import shelves from './assets/polcok.webp'

const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0]

/** The silhouette each product leaves on the shadow board. */
const ICONS = {
  facsavar: Nut,
  tipli: Package,
  dubel: Hammer,
  szilikon: Drop,
  csavarhuzo: Screwdriver,
  vizmertek: Ruler,
  fureszlap: Knife,
  ecset: PaintBrush,
  diszperzit: PaintBucket,
  lazur: PaintBrushBroad,
  izzo: Lightbulb,
  hosszabbito: Plug,
  kabelkoto: PlugsConnected,
  locsolotomlo: Spiral,
  lombsepru: Broom,
  zsak: Trash,
}

function formatDay(iso, opts) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Intl.DateTimeFormat('hu-HU', opts).format(new Date(y, m - 1, d, 12))
}

/** Digits roll to their new value (idea from Animate UI's sliding number). */
function Roll({ value }) {
  const digits = String(value).split('')
  return (
    <span className="roll">
      <span className="sr">{value}</span>
      {digits.map((d, i) => (
        <span key={digits.length - i} className="roll-digit" aria-hidden="true">
          <span style={{ transform: `translateY(${-Number(d)}em)` }}>
            {'0123456789'.split('').map((n) => (
              <span key={n}>{n}</span>
            ))}
          </span>
        </span>
      ))}
    </span>
  )
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

function StockLine({ product, free }) {
  const level = stockLevel(free)
  if (level === 'ok') return <p className="stock ok">Raktáron</p>
  if (level === 'low')
    return (
      <p className="stock low">
        Már csak <Roll value={free} /> {product.unit}
      </p>
    )
  const arrives = arrivalIso(product)
  return (
    <p className="stock none">
      Elfogyott{arrives ? `, érkezik ${formatDay(arrives, { month: 'short', day: 'numeric' })}` : ''}
    </p>
  )
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
  const tel = `tel:${BUSINESS.phone.replace(/\s/g, '')}`

  return (
    <>
      <a className="skip" href="#tartalom">
        Ugrás a termékekhez
      </a>
      <p className="banner" role="status">
        <strong>Bemutató projekt</strong>, saját kezdeményezés. A készlet és a félretétel csak ebben a böngészőben él. Készítette:{' '}
        <a href="https://rizmajerdev.com/">Rizmajer Máté</a>{' '}
        <a className="banner-cta" href="https://rizmajerdev.com/?demo=bolt#kapcsolat">
          Ilyet kérek a vállalkozásomnak →
        </a>
      </p>

      <header className="top">
        <div className="brand">
          <p className="brand-name">{BUSINESS.name}</p>
          <p className="brand-place">
            <span>{BUSINESS.city}, {BUSINESS.address}</span>
          </p>
        </div>
        <p className={state.open ? 'dymo is-open' : 'dymo'}>{openLabel(state)}</p>
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
          <section className="counter">
            <h1>A pult mögül</h1>
            <p className="lede">
              <span>Ezt látná a tulajdonos a telefonján: ki mit kért félre, és mennyi van a polcon. A bemutató PIN-je nyilvános: {BUSINESS.adminPin}.</span>
            </p>
            {adminOk ? (
              <div className="counter-grid">
                <section className="sheet" aria-labelledby="felreteve">
                  <h2 id="felreteve">Félretéve</h2>
                  {holds.length ? (
                    <ul className="hold-list">
                      {holds.map((h) => {
                        const p = productById(h.productId)
                        return (
                          <li key={h.id}>
                            <div>
                              <strong>
                                {h.qty} {p?.unit} {p?.name ?? h.productId}
                              </strong>
                              <span>
                                {h.name}, <a href={`tel:${h.phone.replace(/\s/g, '')}`}>{h.phone}</a>
                              </span>
                              <span>Eddig tartjuk: {formatDay(h.holdUntil, { month: 'long', day: 'numeric', weekday: 'long' })}</span>
                            </div>
                            <div className="actions">
                              <button type="button" className="btn" onClick={() => finish(h.id, true)}>
                                Átvette
                              </button>
                              <button type="button" className="btn ghost" onClick={() => finish(h.id, false)}>
                                Visszatesz
                              </button>
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  ) : (
                    <p className="empty">Nincs félretett áru. Ha egy vevő félretesz valamit a táblán, itt jelenik meg.</p>
                  )}
                </section>

                <section className="sheet" aria-labelledby="keszlet">
                  <h2 id="keszlet">Készlet</h2>
                  <p className="hint">Ha elfogy vagy jön az áru, itt kell átírni, és a vevők azonnal látják a táblán.</p>
                  <ul className="stock-list">
                    {PRODUCTS.map((p) => {
                      const count = stockOf(p, stock)
                      const Icon = ICONS[p.id]
                      return (
                        <li key={p.id}>
                          <Icon className="stock-icon" weight="fill" aria-hidden="true" />
                          <span>
                            {p.name}
                            <small>{count - free(p) > 0 ? `${count - free(p)} félretéve` : p.spec}</small>
                          </span>
                          <span className="stepper" role="group" aria-label={`${p.name} készlet`}>
                            <button type="button" aria-label="Eggyel kevesebb" disabled={count <= 0} onClick={() => setStockState(setStock(p.id, count - 1))}>
                              −
                            </button>
                            <output aria-live="polite">
                              <Roll value={count} />
                            </output>
                            <button type="button" aria-label="Eggyel több" onClick={() => setStockState(setStock(p.id, count + 1))}>
                              +
                            </button>
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                </section>
              </div>
            ) : (
              <form className="sheet pin" onSubmit={tryPin}>
                <Field id="pin" label="PIN" value={pin} onChange={setPin} type="password" autoComplete="off" error={pinError ? 'Nem ez a PIN.' : undefined} />
                <button className="btn" type="submit">
                  Megnyitás
                </button>
              </form>
            )}
          </section>
        ) : (
          <>
            <section className="intro">
              <h1>Van-e? Nézd meg a táblán.</h1>
              <p className="lede">
                <span>Ami a kampón lóg, az a polcon is ott van. Félretesszük neked {holdLabel}, fizetni a pultnál kell.</span>
              </p>
            </section>

            <section className="bench" aria-label="Keresés és szűrés">
              <div className="field search">
                <label htmlFor="kereses">Mit keresel?</label>
                <input
                  id="kereses"
                  type="search"
                  value={query}
                  placeholder="csavar, led izzó, tömlő"
                  autoComplete="off"
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <div className="tapes" role="group" aria-label="Kategória">
                <button type="button" className="dymo" aria-pressed={cat === null} onClick={() => setCat(null)}>
                  Mind
                </button>
                {CATEGORIES.map((c) => (
                  <button key={c.id} type="button" className="dymo" aria-pressed={cat === c.id} onClick={() => setCat(cat === c.id ? null : c.id)}>
                    {c.name}
                  </button>
                ))}
              </div>
              <label className="lever">
                <input type="checkbox" role="switch" checked={inStockOnly} onChange={(e) => setInStockOnly(e.target.checked)} />
                <span className="lever-plate" aria-hidden="true">
                  <span className="lever-arm" />
                </span>
                Csak ami most raktáron van
              </label>
            </section>

            <div className="board-head">
              <p className="count" role="status">
                <Roll value={shown.length} /> termék a táblán
              </p>
              <p className="legend" aria-hidden="true">
                <span className="legend-item">
                  <Nut weight="fill" /> kampón: raktáron
                </span>
                <span className="legend-item gone">
                  <Nut weight="fill" /> csak a helye: elfogyott
                </span>
              </p>
            </div>

            {shown.length ? (
              <ul className="board">
                {shown.map((p, i) => {
                  const left = free(p)
                  const level = stockLevel(left)
                  const Icon = ICONS[p.id]
                  return (
                    <li key={p.id} className={`hang ${level}`} style={{ '--i': i }}>
                      <span className="peg" aria-hidden="true" />
                      <Icon className="tool" weight="fill" aria-hidden="true" />
                      <div className="tag">
                        <h2>{p.name}</h2>
                        <p className="spec">{p.spec}</p>
                        <StockLine product={p} free={left} />
                        <div className="buy">
                          <p className="price">
                            {formatHuf(p.priceHuf)}
                            <small> / {p.unit}</small>
                          </p>
                          <button type="button" className="btn" disabled={left <= 0} onClick={() => openHold(p)}>
                            Félreteszem
                          </button>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <div className="empty-board">
                <p>
                  Ez nincs a táblán. Hívj fel: <a href={tel}>{BUSINESS.phone}</a>, és megnézzük, be tudjuk-e hozni.
                </p>
                <button
                  type="button"
                  className="btn ghost"
                  onClick={() => {
                    setQuery('')
                    setCat(null)
                    setInStockOnly(false)
                  }}
                >
                  Szűrők törlése
                </button>
              </div>
            )}

            <section className="visit" aria-labelledby="hol">
              <img className="visit-photo" src={shelves} alt="Dobozokkal teli polcfal egy régi vasboltban, előtte létra" width="1100" height="754" loading="lazy" />
              <div className="notice">
                <h2 id="hol">Hol találsz</h2>
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
                      <a href={tel}>{BUSINESS.phone}</a>
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
                        <td>{HOURS[d] ? `${minutesToLabel(HOURS[d][0])}-${minutesToLabel(HOURS[d][1])}` : 'zárva'}</td>
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
              <p className="dymo is-open stamp">Félretéve</p>
              <h2 id="hold-title">
                {placed.qty} {target.unit} {target.name}
              </h2>
              <p className="lede">
                A pultnál vár a neveddel, {formatDay(placed.holdUntil, { weekday: 'long' })} {minutesToLabel(hold.closesAt)}-ig. Élesben SMS-t kapnál róla. A „Bolt”
                nézetben látod, mit lát a tulajdonos.
              </p>
              <button type="button" className="btn" onClick={() => dialog.current?.close()}>
                Rendben
              </button>
            </div>
          ) : (
            <form onSubmit={submitHold} noValidate>
              <p className="hold-when">Félretétel {holdLabel}</p>
              <h2 id="hold-title">{target.name}</h2>
              <p className="hint">
                {formatHuf(target.priceHuf)} / {target.unit}, {free(target)} {target.unit} szabad
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
                <button type="submit" className="btn">
                  Félreteszem
                </button>
                <button type="button" className="btn ghost" onClick={() => dialog.current?.close()}>
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
