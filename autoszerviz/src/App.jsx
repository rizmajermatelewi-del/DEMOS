import { useMemo, useState } from 'react'
import { BUSINESS, OPEN_WINDOWS, SERVICES, formatHuf, minutesToLabel, normalizePlate } from './data.js'
import { atMinutes, nextDays, slotsForDate } from './slots.js'
import { createBooking, createQuote, deleteBooking, deleteQuote, loadBookings, loadQuotes } from './storage.js'

const DAY_COUNT = 14
/** Work orders are numbered on from the garage's paper book. */
const FIRST_ORDER_NO = 418

const PROMISES = [
  { title: 'Előbb az ár, aztán a csavarkulcs.', body: 'Javítás előtt írásban kapod az árat. Ha közben több baj derül ki, előbb hívunk.' },
  { title: 'A régi alkatrész a tiéd.', body: 'A kicserélt darabot megmutatjuk, és ha kéred, hazaviheted.' },
  { title: '12 hónap garancia.', body: 'Minden elvégzett munkára, alkatrészre és munkadíjra is.' },
]

const WEEK = [
  [1, 'Hétfő'],
  [2, 'Kedd'],
  [3, 'Szerda'],
  [4, 'Csütörtök'],
  [5, 'Péntek'],
  [6, 'Szombat'],
  [0, 'Vasárnap'],
]

const PLATE_ERROR = 'Pl. ABC-123 vagy AA BB-123.'

function formatDay(iso, opts) {
  return new Intl.DateTimeFormat('hu-HU', opts).format(atMinutes(iso, 12 * 60))
}

function orderNo(n) {
  return `Nº ${String(n).padStart(4, '0')}`
}

function Field({ id, label, value, onChange, type = 'text', error, hint, textarea, className = '', ...rest }) {
  const describedBy = [error ? `${id}-error` : null, hint ? `${id}-hint` : null].filter(Boolean).join(' ') || undefined
  const Tag = textarea ? 'textarea' : 'input'
  return (
    <div className={`field ${className}`}>
      <label htmlFor={id}>{label}</label>
      {hint ? (
        <p id={`${id}-hint`} className="hint">
          {hint}
        </p>
      ) : null}
      <Tag
        id={id}
        name={id}
        type={textarea ? undefined : type}
        rows={textarea ? 5 : undefined}
        value={value}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
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

function contactErrors({ name, phone }) {
  const next = {}
  if (name.trim().length < 2) next.name = 'Írd be a neved.'
  if (phone.replace(/\D/g, '').length < 8) next.phone = 'Egy hívható szám kell.'
  return next
}

/** Focus the first field (by element id) that has an error. */
function focusFirst(ids, errors) {
  const target = ids.find((id) => errors[id])
  if (target) document.getElementById(target)?.focus()
}

export default function App() {
  const [view, setView] = useState('book')
  const [serviceId, setServiceId] = useState(SERVICES[0].id)
  const [date, setDate] = useState(() => nextDays(DAY_COUNT).find((iso) => atMinutes(iso, 12 * 60).getDay() !== 0))
  const [startMin, setStartMin] = useState(null)
  const [plate, setPlate] = useState('')
  const [car, setCar] = useState('')
  const [year, setYear] = useState('')
  const [problem, setProblem] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [errors, setErrors] = useState({})
  const [booking, setBooking] = useState(null)
  const [quote, setQuote] = useState(null)
  const [bookings, setBookings] = useState(() => loadBookings())
  const [quotes, setQuotes] = useState(() => loadQuotes())
  const [pin, setPin] = useState('')
  const [adminOk, setAdminOk] = useState(false)
  const [pinError, setPinError] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(null)

  const service = SERVICES.find((s) => s.id === serviceId)
  const days = useMemo(() => nextDays(DAY_COUNT), [])
  const slots = useMemo(
    () => (service && date ? slotsForDate(date, service.durationMin, bookings) : []),
    [service, date, bookings],
  )
  const nextNo = FIRST_ORDER_NO + bookings.length + quotes.length + 1
  const today = new Date().getDay()

  function go(next) {
    setErrors({})
    setPinError(false)
    setView(next)
  }

  function pickDate(iso) {
    setDate(iso)
    setStartMin(null)
  }

  function pickService(id) {
    setServiceId(id)
    setStartMin(null)
  }

  function onBook(event) {
    event.preventDefault()
    const next = contactErrors({ name, phone })
    if (startMin == null) next.idopont = 'Válassz leadási időt.'
    if (!normalizePlate(plate)) next.plate = PLATE_ERROR
    setErrors(next)
    if (Object.keys(next).length) {
      focusFirst(['idopont', 'plate', 'name', 'phone'], next)
      return
    }

    const result = createBooking({
      no: nextNo,
      serviceId: service.id,
      serviceName: service.name,
      durationMin: service.durationMin,
      priceHuf: service.priceHuf,
      date,
      startMin,
      plate: normalizePlate(plate),
      car: car.trim(),
      name: name.trim(),
      phone: phone.trim(),
    })
    setBookings(result.bookings)
    if (!result.ok) {
      setStartMin(null)
      setErrors({ idopont: 'Ezt az időt épp most foglalták le. Válassz másikat.' })
      document.getElementById('idopont')?.focus()
      return
    }
    setBooking(result.booking)
    setView('done')
    requestAnimationFrame(() => document.getElementById('kesz-cim')?.focus())
  }

  function onQuote(event) {
    event.preventDefault()
    const next = contactErrors({ name, phone })
    if (!normalizePlate(plate)) next.plate = PLATE_ERROR
    if (car.trim().length < 2) next.car = 'Írd be a márkát és a típust.'
    const y = Number(year)
    if (year.trim() && !(Number.isInteger(y) && y >= 1960 && y <= new Date().getFullYear() + 1)) next.year = 'Évszám, pl. 2014.'
    if (problem.trim().length < 10) next.problem = 'Írj pár mondatot a hibáról.'
    setErrors(next)
    if (Object.keys(next).length) {
      focusFirst(['plate', 'year', 'car', 'problem', 'name', 'phone'], next)
      return
    }

    const result = createQuote({
      no: nextNo,
      plate: normalizePlate(plate),
      car: car.trim(),
      year: year.trim(),
      problem: problem.trim(),
      name: name.trim(),
      phone: phone.trim(),
    })
    setQuotes(result.quotes)
    setQuote(result.quote)
    setProblem('')
    setView('quoteDone')
    requestAnimationFrame(() => document.getElementById('kesz-cim')?.focus())
  }

  function tryPin(event) {
    event.preventDefault()
    if (pin.trim() === BUSINESS.adminPin) {
      setAdminOk(true)
      setPinError(false)
      setBookings(loadBookings())
      setQuotes(loadQuotes())
      return
    }
    setPinError(true)
  }

  function remove(kind, id) {
    const key = `${kind}:${id}`
    if (pendingDelete !== key) {
      setPendingDelete(key)
      return
    }
    if (kind === 'b') setBookings(deleteBooking(id))
    else setQuotes(deleteQuote(id))
    setPendingDelete(null)
  }

  const sorted = [...bookings].sort((a, b) => a.date.localeCompare(b.date) || a.startMin - b.startMin)
  const tab = view === 'done' ? 'book' : view === 'quoteDone' ? 'quote' : view
  const tel = BUSINESS.phone.replace(/\s/g, '')

  const plateField = (
    <Field
      id="plate"
      label="Rendszám"
      value={plate}
      onChange={setPlate}
      autoComplete="off"
      autoCapitalize="characters"
      spellCheck={false}
      error={errors.plate}
      className="plate-field"
    />
  )

  const contactFields = (
    <>
      <Field id="name" label="Név" value={name} onChange={setName} autoComplete="name" error={errors.name} />
      <Field id="phone" label="Telefon" value={phone} onChange={setPhone} type="tel" autoComplete="tel" error={errors.phone} />
    </>
  )

  const side = (
    <aside className="side" aria-label="A műhely">
      <figure className="photo">
        <img src="/szerelo.webp" width="800" height="1000" alt="Szerelő kék munkaruhában egy motoron dolgozik a műhelyben" />
        <figcaption>A műhelyben három emelő van, ezért dolgozunk időpontra.</figcaption>
      </figure>
      <table className="hours">
        <caption>Nyitvatartás</caption>
        <tbody>
          {WEEK.map(([d, label]) => {
            const w = OPEN_WINDOWS[d]
            return (
              <tr key={d} aria-current={d === today ? 'date' : undefined}>
                <th scope="row">{label}</th>
                <td>{w ? `${minutesToLabel(w.start)} - ${minutesToLabel(w.end)}` : 'zárva'}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <p className="call">
        Inkább telefonálnál?
        <a href={`tel:${tel}`}>{BUSINESS.phone}</a>
      </p>
    </aside>
  )

  return (
    <>
      <a className="skip" href="#tartalom">
        Ugrás a tartalomhoz
      </a>
      <p className="banner" role="status">
        <strong>Bemutató projekt.</strong> Saját kezdeményezés, a foglalás csak ebben a böngészőben marad. Készítette:{' '}
        <a href="https://rizmajerdev.com/">Rizmajer Máté</a>{' '}
        <a className="banner-cta" href="https://rizmajerdev.com/?demo=autoszerviz#kapcsolat">
          Ilyet kérek a vállalkozásomnak →
        </a>
      </p>

      <header className="masthead">
        <div className="mast-id">
          <p className="wordmark">
            Kormos
            <span>Autószerviz</span>
          </p>
          <p className="mast-addr">
            {BUSINESS.address} {BUSINESS.city}
            <br />
            <a href={`tel:${tel}`}>{BUSINESS.phone}</a>
          </p>
        </div>
        <p className="mast-doc">
          Munkalap
          <span>{orderNo(nextNo)}</span>
        </p>
      </header>

      <nav className="tabs" aria-label="Nézet">
        <button type="button" aria-current={tab === 'book' ? 'page' : undefined} onClick={() => go(booking ? 'done' : 'book')}>
          Időpont
        </button>
        <button type="button" aria-current={tab === 'quote' ? 'page' : undefined} onClick={() => go('quote')}>
          Árajánlat
        </button>
        <button type="button" aria-current={tab === 'admin' ? 'page' : undefined} onClick={() => go('admin')}>
          Műhely
        </button>
      </nav>

      <main id="tartalom">
        {view === 'admin' ? (
          <section className="sheet">
            <h1 className="sheet-title">Műhely</h1>
            <p className="sheet-lede">Ezt látná a szerviz reggel, a kávé mellett. A bemutató PIN-je nyilvános: {BUSINESS.adminPin}.</p>
            {adminOk ? (
              <>
                <h2 className="block-title">Foglalások</h2>
                {sorted.length ? (
                  <ul className="copies">
                    {sorted.map((b) => (
                      <li key={b.id} className="copy">
                        <p className="copy-no">{b.no ? orderNo(b.no) : 'Munkalap'}</p>
                        <p className="copy-when">
                          {formatDay(b.date, { month: 'long', day: 'numeric', weekday: 'long' })}, {minutesToLabel(b.startMin)}
                        </p>
                        <p>
                          <b className="plate">{b.plate}</b> {b.car}
                        </p>
                        <p>{b.serviceName}</p>
                        <p className="copy-who">
                          {b.name}, <a href={`tel:${b.phone.replace(/\s/g, '')}`}>{b.phone}</a>
                        </p>
                        <button type="button" className="ghost" onClick={() => remove('b', b.id)}>
                          {pendingDelete === `b:${b.id}` ? 'Biztos, törlöm' : 'Törlés'}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="empty">Még nincs foglalás. Foglalj egyet az Időpont fülön, és itt megjelenik.</p>
                )}

                <h2 className="block-title">Árajánlatkérések</h2>
                {quotes.length ? (
                  <ul className="copies">
                    {quotes.map((q) => (
                      <li key={q.id} className="copy">
                        <p className="copy-no">{q.no ? orderNo(q.no) : 'Ajánlatkérés'}</p>
                        <p>
                          <b className="plate">{q.plate}</b> {q.car}
                          {q.year ? `, ${q.year}` : ''}
                        </p>
                        <p className="copy-problem">{q.problem}</p>
                        <p className="copy-who">
                          {q.name}, <a href={`tel:${q.phone.replace(/\s/g, '')}`}>{q.phone}</a>
                        </p>
                        <button type="button" className="ghost" onClick={() => remove('q', q.id)}>
                          {pendingDelete === `q:${q.id}` ? 'Biztos, lezárom' : 'Visszahívtuk'}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="empty">Még nincs ajánlatkérés.</p>
                )}
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
        ) : null}

        {view === 'done' && booking ? (
          <section className="sheet done">
            <p className="stamp" aria-hidden="true">
              Beírva
            </p>
            <h1 id="kesz-cim" className="sheet-title" tabIndex={-1}>
              Várjuk az autót.
            </h1>
            <dl className="receipt">
              <div>
                <dt>Munkalap</dt>
                <dd>{orderNo(booking.no)}</dd>
              </div>
              <div>
                <dt>Munka</dt>
                <dd>{booking.serviceName}</dd>
              </div>
              <div>
                <dt>Autó</dt>
                <dd>
                  <b className="plate">{booking.plate}</b> {booking.car}
                </dd>
              </div>
              <div>
                <dt>Leadás</dt>
                <dd>
                  {formatDay(booking.date, { month: 'long', day: 'numeric', weekday: 'long' })}, {minutesToLabel(booking.startMin)}
                </dd>
              </div>
              <div>
                <dt>Munkadíj</dt>
                <dd>{formatHuf(booking.priceHuf)}-tól</dd>
              </div>
            </dl>
            <p className="sheet-lede">Élesben előző nap SMS-ben emlékeztetnénk. A Műhely fülön látod, mit kap belőle a szerviz.</p>
            <div className="row">
              <button
                className="submit"
                type="button"
                onClick={() => {
                  setBooking(null)
                  setStartMin(null)
                  setView('book')
                }}
              >
                Új foglalás
              </button>
              <button className="ghost" type="button" onClick={() => go('admin')}>
                Műhely nézet
              </button>
            </div>
          </section>
        ) : null}

        {view === 'quoteDone' && quote ? (
          <section className="sheet done">
            <p className="stamp" aria-hidden="true">
              Megkaptuk
            </p>
            <h1 id="kesz-cim" className="sheet-title" tabIndex={-1}>
              Munkanapon délig visszahívunk.
            </h1>
            <dl className="receipt">
              <div>
                <dt>Szám</dt>
                <dd>{orderNo(quote.no)}</dd>
              </div>
              <div>
                <dt>Autó</dt>
                <dd>
                  <b className="plate">{quote.plate}</b> {quote.car}
                  {quote.year ? `, ${quote.year}` : ''}
                </dd>
              </div>
              <div>
                <dt>Hiba</dt>
                <dd>{quote.problem}</dd>
              </div>
              <div>
                <dt>Hívjuk</dt>
                <dd>{quote.phone}</dd>
              </div>
            </dl>
            <button className="ghost" type="button" onClick={() => go('admin')}>
              Műhely nézet (PIN: {BUSINESS.adminPin})
            </button>
          </section>
        ) : null}

        {view === 'book' || view === 'quote' ? (
          <>
            <div className="desk">
              {view === 'book' ? (
                <form className="sheet" onSubmit={onBook} noValidate>
                  <h1 className="sheet-title">Időpontra jössz, nem sorba állsz.</h1>
                  <p className="sheet-lede">Jelöld be a munkát, válassz leadási időt. Az árat most látod, nem a számlán.</p>

                  <fieldset className="block">
                    <legend>Elvégzendő munka</legend>
                    <div className="jobs">
                      {SERVICES.map((item) => {
                        const on = item.id === serviceId
                        return (
                          <button key={item.id} type="button" aria-pressed={on} className="job" onClick={() => pickService(item.id)}>
                            <span className="box" aria-hidden="true">
                              {on ? '×' : ''}
                            </span>
                            <span className="job-name">
                              {item.name}
                              <small>{item.blurb}</small>
                            </span>
                            <span className="leader" aria-hidden="true" />
                            <span className="job-price">
                              {formatHuf(item.priceHuf)}
                              <small>{item.durationMin} perc</small>
                            </span>
                          </button>
                        )
                      })}
                    </div>
                    <p className="hint">
                      Nem tudod, mi a baj?{' '}
                      <button type="button" className="link" onClick={() => go('quote')}>
                        Írd le, és árajánlattal hívunk
                      </button>
                    </p>
                  </fieldset>

                  <fieldset className="block" id="idopont" tabIndex={-1} aria-describedby={errors.idopont ? 'slot-error' : 'slot-hint'}>
                    <legend>Leadás</legend>
                    <div className="days">
                      {days.map((iso) => {
                        const closed = atMinutes(iso, 12 * 60).getDay() === 0
                        const on = iso === date
                        return (
                          <button
                            key={iso}
                            type="button"
                            aria-pressed={closed ? undefined : on}
                            disabled={closed}
                            className="day"
                            onClick={() => pickDate(iso)}
                          >
                            <span>{formatDay(iso, { weekday: 'short' })}</span>
                            <strong>{formatDay(iso, { day: 'numeric' })}</strong>
                            <small>{closed ? 'zárva' : formatDay(iso, { month: 'short' })}</small>
                          </button>
                        )
                      })}
                    </div>
                    <p className="hint" id="slot-hint">
                      {date ? `${formatDay(date, { month: 'long', day: 'numeric', weekday: 'long' })}, a munka kb. ${service.durationMin} perc` : ''}
                    </p>
                    {slots.length ? (
                      <div className="times">
                        {slots.map((min) => (
                          <button
                            key={min}
                            type="button"
                            aria-pressed={min === startMin}
                            className="time"
                            onClick={() => {
                              setStartMin(min)
                              setErrors((prev) => ({ ...prev, idopont: undefined }))
                            }}
                          >
                            {minutesToLabel(min)}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="empty" role="status">
                        Erre a napra nincs olyan szabad idő, amibe ez a munka belefér. Nézd meg a következő napot.
                      </p>
                    )}
                    {errors.idopont ? (
                      <p id="slot-error" className="field-error" role="alert">
                        {errors.idopont}
                      </p>
                    ) : null}
                  </fieldset>

                  <fieldset className="block">
                    <legend>Autó és ügyfél</legend>
                    <div className="grid2">
                      {plateField}
                      <Field id="car" label="Márka, típus" value={car} onChange={setCar} placeholder="pl. Opel Astra" />
                      {contactFields}
                    </div>
                  </fieldset>

                  <div className="sheet-foot">
                    <button className="submit" type="submit">
                      Lefoglalom
                    </button>
                    <p>A megadott árak munkadíjak, az alkatrész külön. Fizetni a műhelyben kell.</p>
                  </div>
                </form>
              ) : (
                <form className="sheet" onSubmit={onQuote} noValidate>
                  <h1 className="sheet-title">Írd le, mit csinál az autó.</h1>
                  <p className="sheet-lede">Becsült árral hívunk vissza, mielőtt bármihez hozzányúlnánk.</p>

                  <fieldset className="block">
                    <legend>Az autó</legend>
                    <div className="grid2">
                      {plateField}
                      <Field id="year" label="Évjárat" value={year} onChange={setYear} inputMode="numeric" error={errors.year} placeholder="nem kötelező" />
                    </div>
                    <Field id="car" label="Márka, típus" value={car} onChange={setCar} error={errors.car} placeholder="pl. Opel Astra 1.6" />
                  </fieldset>

                  <fieldset className="block">
                    <legend>A hiba</legend>
                    <Field
                      id="problem"
                      label="Mit tapasztalsz?"
                      hint="Mikor jelentkezik, van-e hang, szag vagy figyelmeztető lámpa."
                      value={problem}
                      onChange={setProblem}
                      error={errors.problem}
                      textarea
                      className="lined"
                    />
                  </fieldset>

                  <fieldset className="block">
                    <legend>Kit hívjunk?</legend>
                    <div className="grid2">{contactFields}</div>
                  </fieldset>

                  <div className="sheet-foot">
                    <button className="submit" type="submit">
                      Visszahívást kérek
                    </button>
                    <p>Munkanapon délig hívunk. Az átnézés ingyenes, ha nálunk javíttatod.</p>
                  </div>
                </form>
              )}
              {side}
            </div>

            <section className="warranty" aria-labelledby="vallalas">
              <img src="/motor.webp" width="900" height="700" loading="lazy" alt="Motortér közelről, egy kék hengeres alkatrésszel" />
              <div>
                <h2 id="vallalas">Amit írásban vállalunk</h2>
                <ul>
                  {PROMISES.map((p) => (
                    <li key={p.title}>
                      <strong>{p.title}</strong>
                      {p.body}
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </>
        ) : null}
      </main>

      <footer className="foot">
        <p>
          {BUSINESS.name}, {BUSINESS.address} {BUSINESS.city}. <a href={`tel:${tel}`}>{BUSINESS.phone}</a>
        </p>
        <p>Kitalált vállalkozás, bemutató célra. Fotók: Lummi.</p>
      </footer>
    </>
  )
}
