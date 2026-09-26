import { useMemo, useState } from 'react'
import { BUSINESS, DAY_COPY, boardPrice, dayMenu, formatDay, isoLocal, weekdayName } from './data.js'
import { isLoggedIn, loadWeek, login, logout, saveDay } from './storage.js'
import soupPhoto from './assets/leves.webp'

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

function Row({ name, price, seed, start }) {
  return (
    <li className="row">
      <Letters text={name} seed={seed} start={start} />
      <Letters text={boardPrice(price)} seed={seed + 3} start={start + 4} />
    </li>
  )
}

/** The felt letterboard in its oak frame. */
function Letterboard({ menu, heading, seed = 1, compact = false }) {
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
  return (
    <figure className={compact ? 'board compact' : 'board'}>
      <div className="felt">
        <p className="board-head">
          <Letters text={heading} seed={seed} />
        </p>
        <p className="board-label">Leves</p>
        <ul>
          <Row name={menu.soup} price={menu.soupPrice} seed={seed + 11} start={4} />
        </ul>
        <p className="board-label">Főétel</p>
        <ul>
          {menu.mains.map((item, index) => (
            <Row key={index} name={item.name} price={item.price} seed={seed + 20 + index} start={10 + index * 6} />
          ))}
        </ul>
        <p className="board-label">Desszert</p>
        <ul>
          <Row name={menu.dessert} price={menu.dessertPrice} seed={seed + 40} start={24} />
        </ul>
        {menu.note ? <p className="board-note">{menu.note}</p> : null}
      </div>
    </figure>
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
        {draft.mains.map((item, index) => (
          <div className="pair" key={index}>
            <label>
              {index + 1}. főétel
              <input value={item.name} onChange={(e) => setMain(index, 'name', e.target.value)} />
            </label>
            <label>
              Ár (Ft)
              <input inputMode="numeric" value={item.price} onChange={(e) => setMain(index, 'price', e.target.value)} />
            </label>
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

export default function App() {
  const today = useMemo(() => {
    const d = new Date()
    d.setHours(12, 0, 0, 0)
    return d
  }, [])
  const [view, setView] = useState('today')
  const [week, setWeek] = useState(() => loadWeek())
  const [authed, setAuthed] = useState(() => isLoggedIn())
  const [password, setPassword] = useState('')
  const [pinError, setPinError] = useState(false)
  const todayDay = today.getDay()
  const [weekDay, setWeekDay] = useState(todayDay >= 1 && todayDay <= 5 ? todayDay : 1)
  const [editDay, setEditDay] = useState(todayDay >= 1 && todayDay <= 5 ? todayDay : 1)

  const monday = mondayOf(today)
  const tel = `tel:${BUSINESS.phone.replace(/\s/g, '')}`
  // On the weekend the board already shows Monday, like a real board left out on Friday.
  const weekend = todayDay === 0 || todayDay === 6
  const boardDate = weekend ? addDays(monday, 7) : today
  const boardHeading = weekend ? 'Hétfőn ez lesz' : `Ma, ${weekdayName(todayDay)}`
  const todayMenu = dayMenu(week, boardDate)
  const weekDate = addDays(monday, weekDay - 1)

  function onLogin(event) {
    event.preventDefault()
    if (login(password, BUSINESS.adminPassword)) {
      setAuthed(true)
      setPinError(false)
      return
    }
    setPinError(true)
  }

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
                  <a className="btn" href={tel}>
                    Elvitelre: {BUSINESS.phone}
                  </a>
                </div>
                <Letterboard menu={todayMenu} heading={boardHeading} seed={todayDay + 1} />
              </div>
            </section>
            <section className="visit" aria-labelledby="hol">
              <img src={soupPhoto} alt="Gőzölgő leves egy nagy üstben, mellette szárított paprikafüzér" width="1200" height="358" loading="lazy" />
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

        {view === 'edit' ? (
          <section className="cloth edit">
            {authed ? (
              <>
                <div className="edit-head">
                  <h1 className="page-title">Szerkesztés</h1>
                  <button
                    type="button"
                    className="btn ghost"
                    onClick={() => {
                      logout()
                      setAuthed(false)
                    }}
                  >
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
              </>
            ) : (
              <form className="editor login" onSubmit={onLogin}>
                <h1 className="page-title">Szerkesztés</h1>
                <p className="hint">A tulajdonos itt írja át a menüt, telefonról is. A bemutató jelszava: {BUSINESS.adminPassword}.</p>
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
