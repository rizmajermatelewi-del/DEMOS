import { useMemo, useState } from 'react'
import { BUSINESS, SERVICES, formatHuf, minutesToLabel } from './data.js'
import { atMinutes, nextDays, slotsForDate } from './slots.js'
import { createBooking, deleteBooking, loadBookings } from './storage.js'

const DAY_COUNT = 14

function formatDay(iso, opts) {
  return new Intl.DateTimeFormat('hu-HU', opts).format(atMinutes(iso, 12 * 60))
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
    if (startMin == null) next.slot = 'Válassz időpontot.'
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

  return (
    <>
      <a className="skip" href="#tartalom">
        Ugrás a foglaláshoz
      </a>
      <p className="banner" role="status">
        <strong>Bemutató projekt</strong> — saját kezdeményezés. A foglalás csak ebben a böngészőben marad, e-mail nem megy ki. Készítette: <a href="https://rizmajerdev.com/" style={{ color: 'inherit', textDecoration: 'underline' }}>Rizmajer Máté</a>
        {' '}<a className="banner-cta" href="https://rizmajerdev.com/?demo=idopontfoglalo#kapcsolat">Ilyet kérek a vállalkozásomnak →</a>
      </p>

      <header className="top">
        <p className="brand">
          {BUSINESS.name}
          <span>{BUSINESS.city}</span>
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
          <section className="sheet admin">
            <h1>Naptár</h1>
            <p className="lede">A szalon ezt a listát látná. A bemutató PIN-je nyilvános: {BUSINESS.adminPin}.</p>
            {adminOk ? (
              sorted.length ? (
                <ul className="book-list">
                  {sorted.map((b) => (
                    <li key={b.id}>
                      <div>
                        <strong>
                          {formatDay(b.date, { month: 'long', day: 'numeric', weekday: 'long' })} · {minutesToLabel(b.startMin)}
                        </strong>
                        <span>
                          {b.serviceName} · {b.name}
                        </span>
                        <span>
                          {b.phone} · {b.email}
                        </span>
                      </div>
                      <button type="button" onClick={() => remove(b.id)}>
                        {pendingDelete === b.id ? 'Biztos, törlöm' : 'Törlés'}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>Még nincs foglalás.</p>
              )
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
              Megvan az időpontod.
            </h1>
            <dl>
              <div>
                <dt>Kezelés</dt>
                <dd>{booking.serviceName}</dd>
              </div>
              <div>
                <dt>Mikor</dt>
                <dd>
                  {formatDay(booking.date, { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
                  {' · '}
                  {minutesToLabel(booking.startMin)}
                </dd>
              </div>
              <div>
                <dt>Ár</dt>
                <dd>{formatHuf(booking.priceHuf)}</dd>
              </div>
            </dl>
            <p className="lede">Élesben erről e-mail menne neked és a szalonnak. Itt nem megy.</p>
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

        {view === 'book' ? (
          <div className="layout">
            <section className="intro">
              <p className="eyebrow">{BUSINESS.city}</p>
              <h1>{BUSINESS.name}</h1>
              <p className="lede">Pontos időpont, nyugodt szalon. Foglalj online — Kecskeméten, a tér mellett.</p>
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

            <form className="sheet" onSubmit={onSubmit} noValidate>
              <h2>Foglalás</h2>

              <fieldset>
                <legend>Szolgáltatás</legend>
                <div className="choices">
                  {SERVICES.map((item) => {
                    const on = item.id === serviceId
                    return (
                      <button
                        key={item.id}
                        type="button"
                        aria-pressed={on}
                        className={on ? 'choice on' : 'choice'}
                        onClick={() => pickService(item.id)}
                      >
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

              <fieldset id="idopont" tabIndex={-1} aria-describedby={errors.slot ? 'slot-error' : 'slot-hint'}>
                <legend>Időpont</legend>
                <p className="hint" id="slot-hint">
                  {date
                    ? `${formatDay(date, { month: 'long', day: 'numeric', weekday: 'long' })} · ${service.durationMin} perc`
                    : ''}
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
                            setErrors((prev) => ({ ...prev, slot: undefined }))
                          }}
                        >
                          {minutesToLabel(min)}
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <p className="empty" role="status">
                    Erre a napra nem maradt idő, ami befér.
                  </p>
                )}
                {errors.slot ? (
                  <p id="slot-error" className="field-error" role="alert">
                    {errors.slot}
                  </p>
                ) : null}
              </fieldset>

              <fieldset>
                <legend>Adataid</legend>
                <Field id="name" label="Név" value={name} onChange={setName} autoComplete="name" error={errors.name} />
                <Field id="phone" label="Telefon" value={phone} onChange={setPhone} type="tel" autoComplete="tel" error={errors.phone} />
                <Field id="email" label="E-mail" value={email} onChange={setEmail} type="email" autoComplete="email" error={errors.email} />
                <div className="field">
                  <label htmlFor="note">Megjegyzés, ha van</label>
                  <textarea id="note" name="note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
                </div>
              </fieldset>

              <button className="submit" type="submit">
                Lefoglalom
              </button>
            </form>
          </div>
        ) : null}
      </main>
    </>
  )
}
