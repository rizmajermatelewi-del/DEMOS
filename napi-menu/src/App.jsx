import { useMemo, useState } from 'react'
import { BUSINESS, DAY_COPY, dayMenu, formatDay, formatHuf, isoLocal, weekdayName } from './data.js'
import { isLoggedIn, loadWeek, login, logout, saveDay } from './storage.js'

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

function Board({ menu, title }) {
  if (menu.closed) {
    return (
      <article className="board">
        <h2>{title}</h2>
        <p className="closed">Zárva.</p>
      </article>
    )
  }

  return (
    <article className="board">
      <h2>{title}</h2>
      {menu.note ? <p className="note">{menu.note}</p> : null}
      <section>
        <h3>Leves</h3>
        <p className="dish">
          <span>{menu.soup}</span>
          <strong>{formatHuf(menu.soupPrice)}</strong>
        </p>
      </section>
      <section>
        <h3>Főételek</h3>
        <ul>
          {menu.mains.map((item, index) => (
            <li key={`${index}-${item.name}`} className="dish">
              <span>{item.name}</span>
              <strong>{formatHuf(item.price)}</strong>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h3>Desszert</h3>
        <p className="dish">
          <span>{menu.dessert}</span>
          <strong>{formatHuf(menu.dessertPrice)}</strong>
        </p>
      </section>
    </article>
  )
}

function Editor({ day, menu, onSave, onDirty }) {
  const [draft, setDraft] = useState(menu)
  const [saved, setSaved] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [formError, setFormError] = useState('')

  function touch(next) {
    setDraft(next)
    setSaved(false)
    setDirty(true)
    setFormError('')
    onDirty?.(true)
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
    onDirty?.(false)
  }

  const copy = DAY_COPY[day]

  return (
    <form className="editor" onSubmit={commit}>
      <h2>A {copy.title} menü</h2>
      <p className="note">Minden {copy.every} ez jelenik meg. A bemutató jelszava: {BUSINESS.adminPassword}.</p>
      <label className="check">
        <input
          type="checkbox"
          checked={draft.closed}
          onChange={(e) => touch({ ...draft, closed: e.target.checked })}
        />
        Ezen a napon zárva
      </label>
      <label>
        Leves
        <input value={draft.soup} onChange={(e) => touch({ ...draft, soup: e.target.value })} />
      </label>
      <label>
        Leves ára (Ft)
        <input inputMode="numeric" value={draft.soupPrice} onChange={(e) => touch({ ...draft, soupPrice: e.target.value })} />
      </label>
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
      <label>
        Desszert
        <input value={draft.dessert} onChange={(e) => touch({ ...draft, dessert: e.target.value })} />
      </label>
      <label>
        Desszert ára (Ft)
        <input inputMode="numeric" value={draft.dessertPrice} onChange={(e) => touch({ ...draft, dessertPrice: e.target.value })} />
      </label>
      <label>
        Megjegyzés
        <input value={draft.note} onChange={(e) => touch({ ...draft, note: e.target.value })} />
      </label>
      <button type="submit">Mentés</button>
      {formError ? (
        <p className="error" role="alert">
          {formError}
        </p>
      ) : null}
      {dirty && !formError ? <p className="note">Ha napot váltasz, ez a sor elvész.</p> : null}
      {saved ? <p role="status">Elmentve ebben a böngészőben.</p> : null}
    </form>
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
  const [editDay, setEditDay] = useState(() => {
    const day = new Date().getDay()
    return day >= 1 && day <= 5 ? day : 1
  })

  const weekDays = [0, 1, 2, 3, 4].map((i) => addDays(mondayOf(today), i))

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
        <strong>Bemutató projekt</strong> — saját kezdeményezés. Nem élő étterem. Készítette: <a href="https://rizmajerdev.com/" style={{ color: 'inherit', textDecoration: 'underline' }}>Rizmajer Máté</a>
        {' '}<a className="banner-cta" href="https://rizmajerdev.com/?demo=napi-menu#kapcsolat">Ilyet kérek a vállalkozásomnak →</a>
      </p>
      <header className="mast">
        <p className="where">
          {BUSINESS.city} · {BUSINESS.hours}
        </p>
        <h1>{BUSINESS.name}</h1>
        <p className="address">
          {BUSINESS.address} · {BUSINESS.phone}
        </p>
        <nav aria-label="Nézet">
          <button type="button" aria-current={view === 'today' ? 'page' : undefined} onClick={() => setView('today')}>
            Mai menü
          </button>
          <button type="button" aria-current={view === 'week' ? 'page' : undefined} onClick={() => setView('week')}>
            Hét
          </button>
          <button type="button" aria-current={view === 'edit' ? 'page' : undefined} onClick={() => setView('edit')}>
            Szerkesztés
          </button>
        </nav>
      </header>

      <main id="tartalom">
        {view === 'today' ? <Board menu={dayMenu(week, today)} title={formatDay(isoLocal(today))} /> : null}

        {view === 'week' ? (
          <div className="week">
            {weekDays.map((date) => (
              <Board key={isoLocal(date)} menu={dayMenu(week, date)} title={formatDay(isoLocal(date))} />
            ))}
          </div>
        ) : null}

        {view === 'edit' ? (
          authed ? (
            <div className="edit-layout">
              <div className="day-pick" aria-label="Nap">
                {[1, 2, 3, 4, 5].map((day) => (
                  <button
                    key={day}
                    type="button"
                    aria-pressed={editDay === day}
                    onClick={() => setEditDay(day)}
                  >
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
              <button
                type="button"
                className="texty"
                onClick={() => {
                  logout()
                  setAuthed(false)
                }}
              >
                Kilépés
              </button>
            </div>
          ) : (
            <form className="editor" onSubmit={onLogin}>
              <h2>Szerkesztés</h2>
              <p className="note">A tulajdonos itt írja át a mai menüt. Bemutató jelszó: {BUSINESS.adminPassword}.</p>
              <label>
                Jelszó
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  aria-invalid={pinError || undefined}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
              {pinError ? (
                <p className="error" role="alert">
                  Nem ez a jelszó.
                </p>
              ) : null}
              <button type="submit">Belépés</button>
            </form>
          )
        ) : null}
      </main>
      <footer>
        {BUSINESS.name} · {BUSINESS.address} · {BUSINESS.hours}. Bemutató a portfólióhoz, nem élő étterem.
      </footer>
    </>
  )
}
