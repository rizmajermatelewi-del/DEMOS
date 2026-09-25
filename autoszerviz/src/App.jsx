import { useMemo, useState } from 'react'
import { BUSINESS, SERVICES, formatHuf, minutesToLabel, normalizePlate } from './data.js'
import { atMinutes, nextDays, slotsForDate } from './slots.js'
import { createBooking, createQuote, deleteBooking, deleteQuote, loadBookings, loadQuotes } from './storage.js'

const DAY_COUNT = 14

const PROMISES = [
  'Javítás előtt írásban kapod az árat. Ha közben több baj derül ki, előbb hívunk.',
  'A kicserélt alkatrészt megmutatjuk, ha kéred, hazaviheted.',
  'Minden munkára 12 hónap garancia.',
]

function formatDay(iso, opts) {
  return new Intl.DateTimeFormat('hu-HU', opts).format(atMinutes(iso, 12 * 60))
}

function Field({ id, label, value, onChange, type = 'text', error, hint, textarea, ...rest }) {
  const describedBy = [error ? `${id}-error` : null, hint ? `${id}-hint` : null].filter(Boolean).join(' ') || undefined
  const Tag = textarea ? 'textarea' : 'input'
  return (
    <div className="field">
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
        rows={textarea ? 4 : undefined}
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

const PLATE_ERROR = 'Pl. ABC-123 vagy AA BB-123.'

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
    if (startMin == null) next.idopont = 'Válassz időpontot.'
    if (!normalizePlate(plate)) next.plate = PLATE_ERROR
    setErrors(next)
    if (Object.keys(next).length) {
      focusFirst(['idopont', 'plate', 'name', 'phone'], next)
      return
    }

    const result = createBooking({
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
      setErrors({ idopont: 'Ezt a sávot épp most foglalták le. Válassz másikat.' })
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
      className="plate-input"
    />
  )

  const contactFields = (
    <>
      <Field id="name" label="Név" value={name} onChange={setName} autoComplete="name" error={errors.name} />
      <Field id="phone" label="Telefon" value={phone} onChange={setPhone} type="tel" autoComplete="tel" error={errors.phone} />
    </>
  )

  return (
    <>
      <a className="skip" href="#tartalom">
        Ugrás a tartalomhoz
      </a>
      <p className="banner" role="status">
        <strong>Bemutató projekt</strong> — saját kezdeményezés. A foglalás csak ebben a böngészőben marad, e-mail nem megy ki. Készítette:{' '}
        <a href="https://rizmajerdev.com/">Rizmajer Máté</a>
        {' '}<a className="banner-cta" href="https://rizmajerdev.com/?demo=autoszerviz#kapcsolat">Ilyet kérek a vállalkozásomnak →</a>
      </p>

      <header className="top">
        <p className="brand">
          <span className="mark" aria-hidden="true">
            K
          </span>
          <span>
            {BUSINESS.name}
            <small>{BUSINESS.city}</small>
          </span>
        </p>
        <nav aria-label="Nézet">
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
      </header>

      <main id="tartalom">
        {view === 'admin' ? (
          <section className="sheet admin">
            <h1>Műhely</h1>
            <p className="lede">A szerviz ezt látná reggel. A bemutató PIN-je nyilvános: {BUSINESS.adminPin}.</p>
            {adminOk ? (
              <>
                <h2>Foglalások</h2>
                {sorted.length ? (
                  <ul className="book-list">
                    {sorted.map((b) => (
                      <li key={b.id}>
                        <div>
                          <strong>
                            {formatDay(b.date, { month: 'long', day: 'numeric', weekday: 'long' })} · {minutesToLabel(b.startMin)}
                          </strong>
                          <span>
                            <b className="plate">{b.plate}</b> {b.car} · {b.serviceName}
                          </span>
                          <span>
                            {b.name} · {b.phone}
                          </span>
                        </div>
                        <button type="button" onClick={() => remove('b', b.id)}>
                          {pendingDelete === `b:${b.id}` ? 'Biztos, törlöm' : 'Törlés'}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="empty">Még nincs foglalás.</p>
                )}

                <h2>Árajánlatkérések</h2>
                {quotes.length ? (
                  <ul className="book-list">
                    {quotes.map((q) => (
                      <li key={q.id}>
                        <div>
                          <strong>
                            <b className="plate">{q.plate}</b> {q.car}
                            {q.year ? `, ${q.year}` : ''}
                          </strong>
                          <span className="problem">{q.problem}</span>
                          <span>
                            {q.name} · <a href={`tel:${q.phone.replace(/\s/g, '')}`}>{q.phone}</a>
                          </span>
                        </div>
                        <button type="button" onClick={() => remove('q', q.id)}>
                          {pendingDelete === `q:${q.id}` ? 'Biztos, lezárom' : 'Lezárás'}
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
            <p className="eyebrow">Beírva</p>
            <h1 id="kesz-cim" tabIndex={-1}>
              Várjuk az autót.
            </h1>
            <dl>
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
                  {formatDay(booking.date, { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
                  {' · '}
                  {minutesToLabel(booking.startMin)}
                </dd>
              </div>
              <div>
                <dt>Ár</dt>
                <dd>{formatHuf(booking.priceHuf)}-tól</dd>
              </div>
            </dl>
            <p className="lede">Élesben előző nap SMS-emlékeztető menne. Itt nem megy.</p>
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
          </section>
        ) : null}

        {view === 'quoteDone' && quote ? (
          <section className="sheet done">
            <p className="eyebrow">Megkaptuk</p>
            <h1 id="kesz-cim" tabIndex={-1}>
              Munkanapon délig visszahívunk.
            </h1>
            <dl>
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
            <p className="lede">A kérés bekerült a Műhely nézetbe. Nézd meg, mit lát belőle a szerviz (PIN: {BUSINESS.adminPin}).</p>
            <button className="submit" type="button" onClick={() => go('admin')}>
              Műhely nézet
            </button>
          </section>
        ) : null}

        {view === 'book' || view === 'quote' ? (
          <div className="layout">
            <section className="intro">
              <p className="eyebrow">Autószerviz · {BUSINESS.city}</p>
              <h1>
                Időpontra jössz,
                <br />
                nem sorba állsz.
              </h1>
              <p className="lede">Foglalj műhelyidőt online, vagy írd le a hibát, és árajánlattal hívunk vissza, mielőtt hozzányúlnánk az autóhoz.</p>
              <ul className="promises">
                {PROMISES.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              <dl className="facts">
                <div>
                  <dt>Nyitva</dt>
                  <dd>{BUSINESS.hours}</dd>
                </div>
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
              </dl>
            </section>

            {view === 'book' ? (
              <form className="sheet" onSubmit={onBook} noValidate>
                <h2>Időpontfoglalás</h2>

                <fieldset>
                  <legend>Munka</legend>
                  <div className="choices">
                    {SERVICES.map((item) => {
                      const on = item.id === serviceId
                      return (
                        <button key={item.id} type="button" aria-pressed={on} className={on ? 'choice on' : 'choice'} onClick={() => pickService(item.id)}>
                          <span>
                            <strong>{item.name}</strong>
                            <em>{item.blurb}</em>
                          </span>
                          <span className="meta">
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
                      Kérj árajánlatot
                    </button>
                  </p>
                </fieldset>

                <fieldset>
                  <legend>Nap</legend>
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
                          className={on ? 'day on' : 'day'}
                          onClick={() => pickDate(iso)}
                        >
                          <span>{formatDay(iso, { weekday: 'short' })}</span>
                          <strong>{formatDay(iso, { day: 'numeric' })}</strong>
                          <small>{closed ? 'zárva' : formatDay(iso, { month: 'short' })}</small>
                        </button>
                      )
                    })}
                  </div>
                </fieldset>

                <fieldset id="idopont" tabIndex={-1} aria-describedby={errors.idopont ? 'slot-error' : 'slot-hint'}>
                  <legend>Leadás ideje</legend>
                  <p className="hint" id="slot-hint">
                    {date ? `${formatDay(date, { month: 'long', day: 'numeric', weekday: 'long' })} · kb. ${service.durationMin} perc` : ''}
                  </p>
                  {slots.length ? (
                    <div className="times">
                      {slots.map((min) => {
                        const on = min === startMin
                        return (
                          <button
                            key={min}
                            type="button"
                            aria-pressed={on}
                            className={on ? 'time on' : 'time'}
                            onClick={() => {
                              setStartMin(min)
                              setErrors((prev) => ({ ...prev, idopont: undefined }))
                            }}
                          >
                            {minutesToLabel(min)}
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="empty" role="status">
                      Erre a napra nincs olyan szabad sáv, amibe ez a munka belefér.
                    </p>
                  )}
                  {errors.idopont ? (
                    <p id="slot-error" className="field-error" role="alert">
                      {errors.idopont}
                    </p>
                  ) : null}
                </fieldset>

                <fieldset>
                  <legend>Autó és adataid</legend>
                  <div className="pair">
                    {plateField}
                    <Field id="car" label="Márka, típus" value={car} onChange={setCar} placeholder="pl. Opel Astra" />
                  </div>
                  {contactFields}
                </fieldset>

                <button className="submit" type="submit">
                  Lefoglalom
                </button>
              </form>
            ) : (
              <form className="sheet" onSubmit={onQuote} noValidate>
                <h2>Árajánlatkérés</h2>
                <p className="hint">Írd le, mit csinál az autó. Becsült árral hívunk vissza, és ha kell, adunk időpontot átnézésre.</p>

                <fieldset>
                  <legend>Autó</legend>
                  <div className="pair">
                    {plateField}
                    <Field id="year" label="Évjárat" value={year} onChange={setYear} inputMode="numeric" error={errors.year} placeholder="nem kötelező" />
                  </div>
                  <Field id="car" label="Márka, típus" value={car} onChange={setCar} error={errors.car} placeholder="pl. Opel Astra 1.6" />
                </fieldset>

                <fieldset>
                  <legend>A hiba</legend>
                  <Field
                    id="problem"
                    label="Mit tapasztalsz?"
                    hint="Mikor jelentkezik, van-e hang, szag, figyelmeztető lámpa."
                    value={problem}
                    onChange={setProblem}
                    error={errors.problem}
                    textarea
                  />
                </fieldset>

                <fieldset>
                  <legend>Kit hívjunk?</legend>
                  {contactFields}
                </fieldset>

                <button className="submit" type="submit">
                  Árajánlatot kérek
                </button>
              </form>
            )}
          </div>
        ) : null}
      </main>
    </>
  )
}
