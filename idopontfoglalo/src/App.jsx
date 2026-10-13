import { useMemo, useState } from 'react'
import { LazyMotion, domAnimation, m, useReducedMotion } from 'motion/react'
import { ArrowRight } from '@phosphor-icons/react/dist/csr/ArrowRight'
import { Clock } from '@phosphor-icons/react/dist/csr/Clock'
import { MapPin } from '@phosphor-icons/react/dist/csr/MapPin'
import { Phone } from '@phosphor-icons/react/dist/csr/Phone'
import { Plus } from '@phosphor-icons/react/dist/csr/Plus'
import { Scissors } from '@phosphor-icons/react/dist/csr/Scissors'
import { BUSINESS, SERVICES, formatHuf, minutesToLabel } from './data.js'
import { atMinutes, nextDays } from './slots.js'
import { ANY, STAFF, availability, firstFree, staffFor, staffName, teethFor } from './staff.js'
import { createBooking, deleteBooking, loadBookings } from './storage.js'
import hero from './assets/foto/hero.webp'
import salon from './assets/foto/szalon.webp'
import reka from './assets/foto/reka.webp'
import bence from './assets/foto/bence.webp'
import dora from './assets/foto/dora.webp'
import noiVagas from './assets/foto/noi-vagas.webp'
import ferfiVagas from './assets/foto/ferfi-vagas.webp'
import festes from './assets/foto/festes.webp'
import balayage from './assets/foto/balayage.webp'
import alkalmi from './assets/foto/alkalmi.webp'
import apolas from './assets/foto/apolas.webp'
import g1 from './assets/foto/g1.webp'
import g2 from './assets/foto/g2.webp'
import g3 from './assets/foto/g3.webp'
import g4 from './assets/foto/g4.webp'
import g5 from './assets/foto/g5.webp'
import g6 from './assets/foto/g6.webp'

const DAY_COUNT = 14
const CTA = 'Időpontot foglalok'

const SERVICE_PHOTO = {
  'noi-vagas': [noiVagas, 'Fodrász ollóval vágja egy vendég nedves haját'],
  'ferfi-vagas': [ferfiVagas, 'Borbély ollóval igazítja egy férfi haját'],
  festes: [festes, 'Festék felvitele fóliára terített hajtincsekre'],
  balayage: [balayage, 'Hamvas szőke balayage hullámos hajon'],
  alkalmi: [alkalmi, 'Fodrász csavarókkal készít alkalmi frizurát'],
  apolas: [apolas, 'Hajmosás és ápoló pakolás a mosótálnál'],
}
const STAFF_PHOTO = { reka, bence, dora }

const WORK = [
  [g1, 'Két szőke, hosszú, hullámos frizura hátulról'],
  [g2, 'Vörösesréz haj, lazán csomóba tekerve'],
  [g3, 'Hamvas balayage hullámokkal'],
  [g4, 'Egyenes, tompa vágású bubi'],
  [g5, 'Szürkésbarna, göndörített középhosszú haj'],
  [g6, 'Hosszú, karamellszínű hullámos haj'],
]

const REVIEWS = [
  { text: 'Réka elsőre eltalálta a színt, pedig csak egy elmosódott fotót mutattam neki.', who: 'Kovács Eszter', what: 'balayage' },
  { text: 'Este foglaltam a telefonon, másnap reggel már ott ültem. Bence tíz perc alatt rendbe tett.', who: 'Szabó Márton', what: 'férfi hajvágás' },
  { text: 'A ballagásra Dóra csinálta a hajam, a buli végéig kitartott.', who: 'Tóth Lili', what: 'alkalmi frizura' },
]

const FAQ = [
  ['Mennyivel előtte mondhatom le?', 'Legkésőbb 24 órával előtte, telefonon vagy a visszaigazoló e-mailből. Utána a kezelés díjának felét felszámoljuk.'],
  ['Hogyan fizethetek?', 'Készpénzzel vagy kártyával a szalonban. Előleg nincs.'],
  ['Hol tudok parkolni?', 'A Szabadság téren fizetős, a Petőfi utcában hétköznap 18 óra után ingyenes.'],
  ['Mit hozzak festésre?', 'Egy fotót arról, amit szeretnél, és ha van, a régi festék nevét. Két napig ne moss hajat előtte.'],
  ['Gyereket is vállaltok?', 'Igen, 12 éves kor alatt a férfi vágás árán, bármelyik fodrásznál.'],
]

function formatDay(iso, opts) {
  return new Intl.DateTimeFormat('hu-HU', opts).format(atMinutes(iso, 12 * 60))
}

/** "ma 15:30", "holnap 9:00" or "csütörtök 10:30" for a free slot. */
function whenLabel(slot, days) {
  if (!slot) return 'két hétig minden foglalt'
  const prefix = slot.date === days[0] ? 'ma' : slot.date === days[1] ? 'holnap' : formatDay(slot.date, { weekday: 'long' })
  return `${prefix} ${minutesToLabel(slot.startMin)}`
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
        {preview != null ? `${minutesToLabel(preview)} - ${minutesToLabel(preview + duration)}` : 'Válassz egy fogat'}
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

/** Fades a section in once as it enters the viewport; static under reduced motion. */
function Reveal({ className, children, ...rest }) {
  const reduce = useReducedMotion()
  return (
    <m.section
      className={className}
      initial={reduce ? false : { opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      {...rest}
    >
      {children}
    </m.section>
  )
}

/** The swatch ring: one strand per service, fanned from a single pin.
    Picking a strand swings it forward and opens its card. */
function SwatchRing({ activeId, onActive, onBook }) {
  const active = SERVICES.find((s) => s.id === activeId)
  const [src, alt] = SERVICE_PHOTO[active.id]
  const mid = (SERVICES.length - 1) / 2
  return (
    <div className="ring">
      <div className="ring-fan" role="radiogroup" aria-label="Szolgáltatások">
        <span className="ring-pin" aria-hidden="true" />
        {SERVICES.map((s, i) => {
          const on = s.id === activeId
          return (
            <button
              key={s.id}
              type="button"
              role="radio"
              aria-checked={on}
              className={`strand${on ? ' on' : ''}`}
              style={{ '--shade': s.shade, '--a': `${(i - mid) * 15}deg` }}
              onClick={() => onActive(s.id)}
            >
              <span className="strand-hair" aria-hidden="true" />
              <span className="strand-tag">
                <strong>{s.name}</strong>
                <em>{formatHuf(s.priceHuf)}</em>
              </span>
            </button>
          )
        })}
      </div>
      <article className="ring-card" aria-live="polite">
        <img src={src} alt={alt} width="700" height="900" loading="lazy" />
        <div className="ring-card-text">
          <h3>{active.name}</h3>
          <p>{active.blurb}</p>
          <p className="ring-facts">
            <span>
              <Clock size={18} weight="bold" aria-hidden="true" /> {active.durationMin} perc
            </span>
            <strong>{formatHuf(active.priceHuf)}</strong>
          </p>
          <button type="button" className="btn" onClick={() => onBook(active.id)}>
            Ezt kérem <ArrowRight size={18} weight="bold" aria-hidden="true" />
          </button>
        </div>
      </article>
    </div>
  )
}

export default function App() {
  const reduce = useReducedMotion()
  const [view, setView] = useState('book')
  const [serviceId, setServiceId] = useState(SERVICES[0].id)
  const [ringId, setRingId] = useState(SERVICES[3].id)
  const [staffId, setStaffId] = useState(ANY)
  const [adminStaff, setAdminStaff] = useState('all')
  // Opens on the first day that still has room, so the comb never starts empty.
  const [date, setDate] = useState(() => firstFree(nextDays(DAY_COUNT), SERVICES[0].durationMin, loadBookings(), staffFor(SERVICES[0].id).map((s) => s.id))?.date ?? nextDays(DAY_COUNT)[1])
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
  const [openWork, setOpenWork] = useState(0)

  const service = SERVICES.find((s) => s.id === serviceId)
  const days = useMemo(() => nextDays(DAY_COUNT), [])
  const eligible = staffFor(serviceId)
  const staffKey = staffId === ANY ? eligible.map((s) => s.id).join(',') : staffId
  const staffIds = useMemo(() => staffKey.split(','), [staffKey])
  const slots = useMemo(
    () => (service && date ? availability(date, service.durationMin, bookings, staffIds).slots : []),
    [service, date, bookings, staffIds],
  )
  const teeth = useMemo(() => (date ? teethFor(date, slots, bookings, staffIds) : []), [date, slots, bookings, staffIds])

  // Live "next free" lines, from the same calendars the comb reads.
  const heroNext = useMemo(() => firstFree(days, 30, bookings, STAFF.map((s) => s.id)), [days, bookings])
  const staffNext = useMemo(
    () => Object.fromEntries(STAFF.map((s) => [s.id, firstFree(days, 30, bookings, [s.id])])),
    [days, bookings],
  )

  function goBook() {
    setView(booking ? 'done' : 'book')
    requestAnimationFrame(() => document.getElementById('foglalas')?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }))
  }

  function pickDate(iso) {
    setDate(iso)
    setStartMin(null)
  }

  function pickService(id) {
    setServiceId(id)
    setStartMin(null)
    // A stylist who does not take the new service falls back to "anyone".
    if (staffId !== ANY && !staffFor(id).some((s) => s.id === staffId)) setStaffId(ANY)
  }

  function pickStaff(id) {
    setStaffId(id)
    setStartMin(null)
    if (id !== ANY && !staffFor(serviceId).some((s) => s.id === id)) setServiceId(STAFF.find((s) => s.id === id).services[0])
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
      staffId,
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
    window.scrollTo({ top: 0 })
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

  const sorted = [...bookings]
    .filter((b) => adminStaff === 'all' || b.staffId === adminStaff)
    .sort((a, b) => a.date.localeCompare(b.date) || a.startMin - b.startMin)
  const tel = `tel:${BUSINESS.phone.replace(/\s/g, '')}`

  return (
    <LazyMotion features={domAnimation} strict>
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
        <button type="button" className="brand" onClick={() => { setView('book'); window.scrollTo({ top: 0 }) }}>
          Szálka
        </button>
        <nav aria-label="Fő menü" className="menu">
          <a href="#arak" onClick={() => setView('book')}>Árak</a>
          <a href="#csapat" onClick={() => setView('book')}>Csapat</a>
          <a href="#munkak" onClick={() => setView('book')}>Munkáink</a>
          <a href="#kapcsolat" onClick={() => setView('book')}>Kapcsolat</a>
        </nav>
        <button type="button" className="btn small" onClick={goBook}>
          {CTA}
        </button>
      </header>

      <main id="tartalom">
        {view === 'admin' ? (
          <section className="panel admin">
            <h1>Naptár</h1>
            <p className="lede">A szalon ezt a listát látná. A bemutató PIN-je nyilvános: {BUSINESS.adminPin}.</p>
            {adminOk ? (
              <div className="staff-filter" role="group" aria-label="Kinek a naptára">
                {[{ id: 'all', name: 'Mindenki' }, ...STAFF].map((s) => (
                  <button key={s.id} type="button" aria-pressed={adminStaff === s.id} onClick={() => setAdminStaff(s.id)}>
                    {s.name}
                  </button>
                ))}
              </div>
            ) : null}
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
                        <strong>
                          {b.serviceName}
                          {b.staffId ? <em className="book-staff">{staffName(b.staffId)}</em> : null}
                        </strong>
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
                <p className="empty">
                  {adminStaff === 'all' ? 'Még nincs foglalás. Foglalj egyet a főoldalon, és itt megjelenik.' : `${staffName(adminStaff)} naptárában még nincs foglalás.`}
                </p>
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
            <div className="ticket">
              <h1 id="kesz-cim" tabIndex={-1}>
                Megvan az időpontod.
              </h1>
              <p className="ticket-when">
                {formatDay(booking.date, { month: 'long', day: 'numeric', weekday: 'long' })}
                <strong>{minutesToLabel(booking.startMin)}</strong>
              </p>
              <dl>
                <div>
                  <dt>Kezelés</dt>
                  <dd>{booking.serviceName}</dd>
                </div>
                {booking.staffId ? (
                  <div>
                    <dt>Fodrász</dt>
                    <dd>{staffName(booking.staffId)}</dd>
                  </div>
                ) : null}
                <div>
                  <dt>Ár</dt>
                  <dd>{formatHuf(booking.priceHuf)}</dd>
                </div>
              </dl>
            </div>
            <p className="lede">Élesben erről e-mail menne neked és a szalonnak. Itt nem megy, de a lap alján, a Naptár nézetben látod, mit lát a szalon.</p>
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
              <div className="hero-copy">
                <h1>
                  Szálka Fodrászat
                  <svg className="strand-line" viewBox="0 0 600 60" aria-hidden="true" preserveAspectRatio="none">
                    <m.path
                      d="M4 38 C 90 6, 150 58, 240 30 S 390 8, 470 34 S 560 44, 596 18"
                      initial={reduce ? false : { pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1.6, ease: [0.65, 0, 0.35, 1], delay: 0.2 }}
                    />
                  </svg>
                </h1>
                <p className="lede">Vágás, festés, balayage Kecskeméten, a Szabadság téren. Foglalj most, harminc másodperc.</p>
                <div className="hero-actions">
                  <button type="button" className="btn big" onClick={goBook}>
                    {CTA} <ArrowRight size={20} weight="bold" aria-hidden="true" />
                  </button>
                  <p className="next-free" role="status">
                    <span className="live" aria-hidden="true" />
                    Legközelebb szabad: <strong>{whenLabel(heroNext, days)}</strong>
                  </p>
                </div>
              </div>
              <figure className="hero-photo">
                <img src={hero} alt="Fodrász ollóval vágja egy vendég nedves, sötét haját" width="1400" height="1600" fetchPriority="high" />
              </figure>
            </section>

            <Reveal className="services" id="arak" aria-labelledby="arak-cim">
              <h2 id="arak-cim">Válassz egy tincset.</h2>
              <p className="section-lede">Mint a festékkártya a szalonban: minden szál egy kezelés, ár és idő együtt.</p>
              <SwatchRing
                activeId={ringId}
                onActive={setRingId}
                onBook={(id) => {
                  pickService(id)
                  goBook()
                }}
              />
            </Reveal>

            <Reveal className="team" id="csapat" aria-labelledby="csapat-cim">
              <h2 id="csapat-cim">Hárman vagyunk.</h2>
              <p className="section-lede">Mindenkinek saját naptára van. Alattuk látod, nála mikor van legközelebb hely.</p>
              <ul className="mirrors">
                {STAFF.map((s) => (
                  <li key={s.id} className="mirror">
                    <div className="mirror-glass">
                      <img src={STAFF_PHOTO[s.id]} alt={`${s.name} portréja`} width="600" height="600" loading="lazy" />
                    </div>
                    <h3>{s.name}</h3>
                    <p className="mirror-role">{s.role}</p>
                    <p>{s.bio}</p>
                    <p className="mirror-next">
                      <Clock size={16} weight="bold" aria-hidden="true" /> Nála legközelebb: <strong>{whenLabel(staffNext[s.id], days)}</strong>
                    </p>
                    <button
                      type="button"
                      className="link-btn"
                      onClick={() => {
                        pickStaff(s.id)
                        goBook()
                      }}
                    >
                      Hozzá foglalok <ArrowRight size={16} weight="bold" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal className="work" id="munkak" aria-labelledby="munkak-cim">
              <h2 id="munkak-cim">A múlt hét a székből.</h2>
              <ul className="strips">
                {WORK.map(([src, alt], i) => (
                  <li key={alt} className={`strip${openWork === i ? ' open' : ''}`}>
                    <button type="button" aria-pressed={openWork === i} aria-label={alt} onMouseEnter={() => setOpenWork(i)} onFocus={() => setOpenWork(i)} onClick={() => setOpenWork(i)}>
                      <img src={src} alt="" width="900" height="1200" loading="lazy" />
                    </button>
                  </li>
                ))}
              </ul>
            </Reveal>

            <section id="foglalas" className="booking-wrap" aria-labelledby="foglalas-cim">
              <h2 id="foglalas-cim">Foglalás a fésűn.</h2>
              <p className="section-lede">Minden fog fél óra. A világos fogak szabadok.</p>
              <form className="booking" onSubmit={onSubmit} noValidate>
                <fieldset className="services-pick">
                  <legend>Mit csinálunk?</legend>
                  <div className="chips">
                    {SERVICES.map((item) => (
                      <button key={item.id} type="button" aria-pressed={item.id === serviceId} className="chip" style={{ '--shade': item.shade }} onClick={() => pickService(item.id)}>
                        <span className="chip-swatch" aria-hidden="true" />
                        {item.name}
                        <small>{item.durationMin} perc</small>
                      </button>
                    ))}
                  </div>
                </fieldset>

                <fieldset className="staff">
                  <legend>Kihez?</legend>
                  <div className="chips">
                    {[{ id: ANY, name: 'Bárkihez' }, ...eligible].map((s) => (
                      <button key={s.id} type="button" className="chip person" aria-pressed={staffId === s.id} onClick={() => pickStaff(s.id)}>
                        {s.id === ANY ? (
                          <span className="chip-face any" aria-hidden="true">
                            <Scissors size={16} weight="bold" />
                          </span>
                        ) : (
                          <img className="chip-face" src={STAFF_PHOTO[s.id]} alt="" width="32" height="32" />
                        )}
                        {s.name}
                      </button>
                    ))}
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
                          <strong>{formatDay(iso, { day: 'numeric' })}</strong>
                          <small>{closed ? 'zárva' : formatDay(iso, { month: 'short' })}</small>
                        </button>
                      )
                    })}
                  </div>
                </fieldset>

                <fieldset id="idopont" tabIndex={-1} aria-describedby={errors.slot ? 'slot-error' : 'slot-hint'}>
                  <legend>Hánykor?</legend>
                  <p className="hint" id="slot-hint">
                    {date ? `${formatDay(date, { month: 'long', day: 'numeric', weekday: 'long' })}, ${service.name.toLowerCase()}, ${service.durationMin} perc, ${staffId === ANY ? 'bárkinél' : staffName(staffId)}` : ''}
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
                    {staffId !== ANY ? `, ${staffName(staffId)}` : ''}
                    {startMin != null ? `, ${formatDay(date, { weekday: 'long' })} ${minutesToLabel(startMin)}` : ''}
                    <strong>{formatHuf(service.priceHuf)}</strong>
                  </p>
                  <button className="btn big" type="submit">
                    Lefoglalom
                  </button>
                </div>
              </form>
            </section>

            <Reveal className="reviews" aria-labelledby="velemeny-cim">
              <h2 id="velemeny-cim" className="sr">Vélemények</h2>
              <figure className="quote-main">
                <blockquote>„{REVIEWS[0].text}”</blockquote>
                <figcaption>
                  {REVIEWS[0].who}, {REVIEWS[0].what}
                </figcaption>
              </figure>
              <div className="quote-side">
                {REVIEWS.slice(1).map((r) => (
                  <figure key={r.who}>
                    <blockquote>„{r.text}”</blockquote>
                    <figcaption>
                      {r.who}, {r.what}
                    </figcaption>
                  </figure>
                ))}
                <p className="fine">Kitalált minta-vélemények, a bemutató része.</p>
              </div>
            </Reveal>

            <Reveal className="faq" aria-labelledby="gyik-cim">
              <h2 id="gyik-cim">Mielőtt jössz</h2>
              <div className="faq-list">
                {FAQ.map(([q, a]) => (
                  <details key={q}>
                    <summary>
                      {q}
                      <Plus size={20} weight="bold" aria-hidden="true" />
                    </summary>
                    <p>{a}</p>
                  </details>
                ))}
              </div>
            </Reveal>

            <Reveal className="visit" id="kapcsolat" aria-labelledby="hol">
              <img src={salon} alt="A szalon belülről: piros fodrászszék a tükrök előtt" width="1200" height="800" loading="lazy" />
              <div className="visit-text">
                <h2 id="hol">A téren, az emeleten.</h2>
                <ul className="visit-list">
                  <li>
                    <MapPin size={22} weight="bold" aria-hidden="true" />
                    <span>
                      {BUSINESS.address}, {BUSINESS.city}
                      <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${BUSINESS.address} ${BUSINESS.city}`)}`} target="_blank" rel="noreferrer">
                        Útvonal
                      </a>
                    </span>
                  </li>
                  <li>
                    <Clock size={22} weight="bold" aria-hidden="true" />
                    <span>{BUSINESS.hours}</span>
                  </li>
                  <li>
                    <Phone size={22} weight="bold" aria-hidden="true" />
                    <a href={tel}>{BUSINESS.phone}</a>
                  </li>
                </ul>
                <button type="button" className="btn" onClick={goBook}>
                  {CTA}
                </button>
              </div>
            </Reveal>
          </>
        ) : null}
      </main>

      <footer className="foot">
        <p>
          <strong>Szálka Fodrászat</strong>, kitalált szalon. Fotók: Unsplash. Betűk: Bricolage Grotesque és Figtree (SIL OFL).
        </p>
        <button type="button" className="link-btn" onClick={openAdmin}>
          Naptár (a szalon nézete)
        </button>
      </footer>
    </LazyMotion>
  )
}
