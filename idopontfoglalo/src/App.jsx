import { useMemo, useState } from 'react'
import { BUSINESS, SERVICES, formatHuf, minutesToLabel } from './data.js'
import { atMinutes, combTeeth, nextDays, slotsForDate } from './slots.js'
import { createBooking, deleteBooking, loadBookings } from './storage.js'
import drying from './assets/szaritas.webp'
import dryingSmall from './assets/szaritas-480.webp'
import colouring from './assets/festes.webp'

const DAY_COUNT = 14

function formatDay(iso, opts) {
  return new Intl.DateTimeFormat('hu-HU', opts).format(atMinutes(iso, 12 * 60))
}

const inRange = (min, from, duration) => from != null && min >= from && min < from + duration

function Comb({ teeth, duration, value, onPick }) {
  const [hover, setHover] = useState(null)
  const preview = hover ?? value
  return (
    <div className="comb-wrap">
      <div className="comb" onMouseLeave={() => setHover(null)}>
        <span className="comb-spine" aria-hidden="true" />
        {teeth.map(({ min, state }) => {
          const cls = ['tooth', state, inRange(min, value, duration) ? 'chosen' : '', inRange(min, hover, duration) ? 'lift' : ''].join(' ')
          const label = min % 60 === 0 ? String(min / 60).padStart(2, '0') : ''
          if (state !== 'start')
            return (
              <span key={min} className={cls} aria-hidden="true">
                <i />
                <b>{label}</b>
              </span>
            )
          return (
            <button
              key={min}
              type="button"
              className={cls}
              aria-pressed={value === min}
              aria-label={`${minutesToLabel(min)} és ${minutesToLabel(min + duration)} között`}
              onMouseEnter={() => setHover(min)}
              onFocus={() => setHover(min)}
              onBlur={() => setHover(null)}
              onClick={() => onPick(min)}
            >
              <i />
              <b>{label}</b>
            </button>
          )
        })}
      </div>
      <p className="comb-read" aria-hidden="true">
        {preview != null ? `${minutesToLabel(preview)} - ${minutesToLabel(preview + duration)}` : 'Vidd a fogak fölé'}
      </p>
    </div>
  )
}

function Field({ id, label, value, onChange, type = 'text', autoComplete, error }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        name={id}
        type={type}
        autoComplete={autoComplete}
        value={value}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(e) => onChange(e.target.value)}
      />
      {error ? (
        <p id={`${id}-error`} className="field-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}

export default function App() {
  const [view, setView] = useState('book')
  const [serviceId, setServiceId] = useState(SERVICES[0].id)
  const [date, setDate] = useState(() => nextDays(DAY_COUNT).find((iso) => atMinutes(iso, 12 * 60).getDay() !== 0))
  const [startMin, setStartMin] = useState(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [note, setNote] = useState('')
  const [errors, setErrors] = useState({})
  const [booking, setBooking] = useState(null)
  const [bookings, setBookings] = useState(() => loadBookings())
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
  const teeth = useMemo(() => (date ? combTeeth(date, slots, bookings) : []), [date, slots, bookings])

  function pickDate(iso) {
    setDate(iso)
    setStartMin(null)
  }

  function pickService(id) {
    setServiceId(id)
    setStartMin(null)
  }

  function validate() {
    const next = {}
    if (name.trim().length < 2) next.name = 'Írd be a neved.'
    if (phone.replace(/\D/g, '').length < 8) next.phone = 'Egy hívható szám kell.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = 'Ez nem e-mail cím.'
    if (startMin == null) next.slot = 'Válassz időpontot a fésűn.'
    return next
  }

  function focusProblem(next) {
    const target = next.slot ? 'idopont' : next.name ? 'name' : next.phone ? 'phone' : next.email ? 'email' : null
    if (!target) return
    document.getElementById(target)?.focus()
  }

  function onSubmit(event) {
    event.preventDefault()
    const next = validate()
    setErrors(next)
    if (Object.keys(next).length) {
      focusProblem(next)
      return
    }

    const result = createBooking({
      serviceId: service.id,
      serviceName: service.name,
      durationMin: service.durationMin,
      priceHuf: service.priceHuf,
      date,
      startMin,
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      note: note.trim(),
    })
    setBookings(result.bookings)
    if (!result.ok) {
      setStartMin(null)
      setErrors({ slot: 'Ezt a sávot épp most foglalták le. Válassz másikat.' })
      document.getElementById('idopont')?.focus()
      return
    }
    setBooking(result.booking)
    setView('done')
    window.scrollTo({ top: 0 })
    requestAnimationFrame(() => document.getElementById('kesz-cim')?.focus())
  }

  function openAdmin() {
    setView('admin')
    setPinError(false)
  }

  function tryPin(event) {
    event.preventDefault()
    if (pin.trim() === BUSINESS.adminPin) {
      setAdminOk(true)
      setPinError(false)
      setBookings(loadBookings())
      return
    }
    setPinError(true)
  }

  function remove(id) {
    if (pendingDelete !== id) {
      setPendingDelete(id)
      return
    }
    setBookings(deleteBooking(id))
    setPendingDelete(null)
  }

  const sorted = [...bookings].sort((a, b) => a.date.localeCompare(b.date) || a.startMin - b.startMin)
  const tel = `tel:${BUSINESS.phone.replace(/\s/g, '')}`

  return (
    <>
      <a className="skip" href="#foglalas">
        Ugrás a foglaláshoz
      </a>
      <p className="banner" role="status">
        <strong>Bemutató projekt</strong>, saját kezdeményezés. A foglalás csak ebben a böngészőben marad, e-mail nem megy ki. Készítette:{' '}
        <a href="https://rizmajerdev.com/">Rizmajer Máté</a>{' '}
        <a className="banner-cta" href="https://rizmajerdev.com/?demo=idopontfoglalo#kapcsolat">
          Ilyet kérek a vállalkozásomnak →
        </a>
      </p>

      <header className="top">
        <p className="brand">
          <span className="brand-dot" aria-hidden="true">
            Sz
          </span>
          {BUSINESS.name}
        </p>
        <nav aria-label="Nézet">
          <button type="button" aria-current={view !== 'admin' ? 'page' : undefined} onClick={() => setView(booking ? 'done' : 'book')}>
            Foglalás
          </button>
          <button type="button" aria-current={view === 'admin' ? 'page' : undefined} onClick={openAdmin}>
            Naptár
          </button>
        </nav>
      </header>

      <main id="tartalom">
        {view === 'admin' ? (
          <section className="panel admin">
            <h1>Naptár</h1>
            <p className="lede">A szalon ezt a listát látná. A bemutató PIN-je nyilvános: {BUSINESS.adminPin}.</p>
            {adminOk ? (
              sorted.length ? (
                <ul className="book-list">
                  {sorted.map((b) => (
                    <li key={b.id}>
                      <p className="book-time">
                        <strong>{minutesToLabel(b.startMin)}</strong>
                        <span>{formatDay(b.date, { month: 'short', day: 'numeric', weekday: 'short' })}</span>
                      </p>
                      <div>
                        <strong>{b.serviceName}</strong>
                        <span>
                          {b.name}, <a href={`tel:${b.phone.replace(/\s/g, '')}`}>{b.phone}</a>
                        </span>
                        <span>{b.email}</span>
                      </div>
                      <button type="button" className="btn ghost" onClick={() => remove(b.id)}>
                        {pendingDelete === b.id ? 'Biztos, törlöm' : 'Törlés'}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="empty">Még nincs foglalás. Foglalj egyet a Foglalás oldalon, és itt megjelenik.</p>
              )
            ) : (
              <form className="pin" onSubmit={tryPin}>
                <Field id="pin" label="PIN" value={pin} onChange={setPin} type="password" autoComplete="off" error={pinError ? 'Nem ez a PIN.' : undefined} />
                <button className="btn" type="submit">
                  Megnyitás
                </button>
              </form>
            )}
          </section>
        ) : null}

        {view === 'done' && booking ? (
          <section className="done">
            <div className="card">
              <div className="card-inner">
                <div className="card-face card-front" aria-hidden="true">
                  <span className="brand-dot big">Sz</span>
                  <span>{BUSINESS.name}</span>
                </div>
                <div className="card-face card-back">
                  <h1 id="kesz-cim" tabIndex={-1}>
                    Megvan az időpontod.
                  </h1>
                  <p className="card-when">
                    {formatDay(booking.date, { month: 'long', day: 'numeric', weekday: 'long' })}
                    <strong>{minutesToLabel(booking.startMin)}</strong>
                  </p>
                  <dl>
                    <div>
                      <dt>Kezelés</dt>
                      <dd>{booking.serviceName}</dd>
                    </div>
                    <div>
                      <dt>Ár</dt>
                      <dd>{formatHuf(booking.priceHuf)}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
            <p className="lede">Élesben erről e-mail menne neked és a szalonnak. Itt nem megy, de a Naptár nézetben látod, mit lát a szalon.</p>
            <button
              className="btn"
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

        {view === 'book' ? (
          <>
            <section className="hero">
              <h1 className="cut">
                  <span className="sr">{BUSINESS.name}</span>
                  <span className="cut-half cut-top" aria-hidden="true">
                    Szálka
                    <br />
                    Fodrászat
                  </span>
                  <span className="cut-half cut-bottom" aria-hidden="true">
                    Szálka
                    <br />
                    Fodrászat
                  </span>
                </h1>
              <div className="hero-copy">
                
                <p className="lede">Kecskemét, a Szabadság téren. Válassz kezelést, és foglalj a fésűn: minden fog fél óra.</p>
                <a className="btn" href="#foglalas">
                  Időpontot foglalok
                </a>
              </div>
              <figure className="hero-photo">
                <img src={drying} srcSet={`${dryingSmall} 480w, ${drying} 900w`} sizes="(max-width: 860px) 78vw, 24rem" alt="Fodrász hajszárítóval és körkefével formázza egy vendég haját" width="900" height="900" />
              </figure>
            </section>

            <form id="foglalas" className="booking" onSubmit={onSubmit} noValidate>
              <fieldset className="services">
                <legend>Mit csinálunk?</legend>
                <div className="service-list">
                  {SERVICES.map((item) => {
                    const on = item.id === serviceId
                    return (
                      <button key={item.id} type="button" aria-pressed={on} className="service" onClick={() => pickService(item.id)}>
                        <span className="service-min">
                          {item.durationMin}
                          <small>perc</small>
                        </span>
                        <span className="service-name">
                          <strong>{item.name}</strong>
                          <em>{item.blurb}</em>
                        </span>
                        <span className="service-price">{formatHuf(item.priceHuf)}</span>
                      </button>
                    )
                  })}
                </div>
              </fieldset>

              <fieldset>
                <legend>Melyik nap?</legend>
                <div className="days">
                  {days.map((iso) => {
                    const closed = atMinutes(iso, 12 * 60).getDay() === 0
                    const on = iso === date
                    return (
                      <button key={iso} type="button" aria-pressed={closed ? undefined : on} disabled={closed} className="day" onClick={() => pickDate(iso)}>
                        <span>{formatDay(iso, { weekday: 'short' })}</span>
                        <strong>
                          <span className="flip">{formatDay(iso, { day: 'numeric' })}</span>
                        </strong>
                        <small>{closed ? 'zárva' : formatDay(iso, { month: 'short' })}</small>
                      </button>
                    )
                  })}
                </div>
              </fieldset>

              <fieldset id="idopont" tabIndex={-1} aria-describedby={errors.slot ? 'slot-error' : 'slot-hint'}>
                <legend>Hánykor?</legend>
                <p className="hint" id="slot-hint">
                  {date ? `${formatDay(date, { month: 'long', day: 'numeric', weekday: 'long' })}, ${service.name.toLowerCase()}, ${service.durationMin} perc` : ''}
                </p>
                {slots.length ? (
                  <Comb
                    teeth={teeth}
                    duration={service.durationMin}
                    value={startMin}
                    onPick={(min) => {
                      setStartMin(min)
                      setErrors((prev) => ({ ...prev, slot: undefined }))
                    }}
                  />
                ) : (
                  <p className="empty" role="status">
                    Erre a napra nem maradt idő, ami befér. Nézz egy másik napot.
                  </p>
                )}
                <p className="legend" aria-hidden="true">
                  <span className="lg start">szabad</span>
                  <span className="lg taken">foglalt</span>
                  <span className="lg free">nem fér bele</span>
                </p>
                {errors.slot ? (
                  <p id="slot-error" className="field-error" role="alert">
                    {errors.slot}
                  </p>
                ) : null}
              </fieldset>

              <fieldset className="details">
                <legend>Kinek írjuk be?</legend>
                <div className="details-grid">
                  <Field id="name" label="Név" value={name} onChange={setName} autoComplete="name" error={errors.name} />
                  <Field id="phone" label="Telefon" value={phone} onChange={setPhone} type="tel" autoComplete="tel" error={errors.phone} />
                  <Field id="email" label="E-mail" value={email} onChange={setEmail} type="email" autoComplete="email" error={errors.email} />
                  <div className="field">
                    <label htmlFor="note">Megjegyzés, ha van</label>
                    <textarea id="note" name="note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
                  </div>
                </div>
              </fieldset>

              <div className="submit-row">
                <p className="summary">
                  {service.name}
                  {startMin != null ? `, ${formatDay(date, { weekday: 'long' })} ${minutesToLabel(startMin)}` : ''}
                  <strong>{formatHuf(service.priceHuf)}</strong>
                </p>
                <button className="btn big" type="submit">
                  Lefoglalom
                </button>
              </div>
            </form>

            <section className="visit" aria-labelledby="hol">
              <img src={colouring} alt="Fodrász ecsettel festéket visz fel egy fóliára terített hajtincsre" width="1200" height="800" loading="lazy" />
              <div className="visit-text">
                <h2 id="hol">A téren, az emeleten.</h2>
                <dl>
                  <div>
                    <dt>Cím</dt>
                    <dd>
                      {BUSINESS.address}, {BUSINESS.city}
                    </dd>
                  </div>
                  <div>
                    <dt>Nyitva</dt>
                    <dd>{BUSINESS.hours}</dd>
                  </div>
                  <div>
                    <dt>Telefon</dt>
                    <dd>
                      <a href={tel}>{BUSINESS.phone}</a>
                    </dd>
                  </div>
                </dl>
              </div>
            </section>
          </>
        ) : null}
      </main>
    </>
  )
}
