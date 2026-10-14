import { useState } from 'react'
import { BUSINESS, minutesToLabel } from './data.js'
import { atMinutes, isoLocal, nextFreeSlot } from './slots.js'

/** Today's three lifts, as the whiteboard in the workshop shows them. Sample cars. */
const LIFTS = [
  [
    { plate: 'PRT-418', car: 'Opel Astra', job: 'olajcsere', state: 'kesz' },
    { plate: 'AA DK-217', car: 'Škoda Octavia', job: 'fékbetét elöl', state: 'munka' },
  ],
  [
    { plate: 'LKM-902', car: 'Suzuki Swift', job: 'vizsga előtti átnézés', state: 'kesz' },
    { plate: 'NHR-551', car: 'Ford Focus', job: 'kuplung', state: 'var' },
  ],
  [
    { plate: 'AE BC-104', car: 'Toyota Yaris', job: 'klímatöltés', state: 'munka' },
  ],
]

const STATES = {
  kesz: 'Kész, vihető',
  munka: 'Dolgozunk rajta',
  var: 'Alkatrészre vár',
}

const CHECKS = [
  'Mind a nyolc lámpa ég, a ködlámpát is beleértve',
  'A gumik mintázata legalább 1,6 mm',
  'Nem világít hibajelző a műszerfalon',
  'Az ablaktörlő nem csíkoz',
  'A kürt szól',
  'Az elsősegélydoboz nem járt le',
  'Van elakadásjelző háromszög',
  'Minden biztonsági öv bekapcsol és visszahúz',
  'A kipufogó nem dörmög és nem füstöl',
  'A rendszámtábla olvasható és világít',
]

const SHOTS = [
  { src: '/emelo.webp', alt: 'Két piros autó, az egyik az emelőn, a másik alatta', cap: 'Három emelő, ezért mindig van hely' },
  { src: '/kerek.webp', alt: 'Kesztyűs kéz egy alufelnis kereket tart', cap: 'Kerékcsere és -tárolás' },
  { src: '/olaj.webp', alt: 'Szerelő friss motorolajat tölt a motorba', cap: 'Olajcsere, egy óra alatt' },
  { src: '/alul.webp', alt: 'Szerelő egy felemelt autó alját vizsgálja', cap: 'Futómű és kipufogó alulról' },
]

const NOTES = [
  { plate: 'MZT-306', who: 'Kati, Gyál', text: 'Reggel leadtam, délben hívtak, hogy kész. Annyit fizettem, amennyit a telefonban mondtak.' },
  { plate: 'AA KR-882', who: 'Tamás, Ócsa', text: 'Megmutatták a régi fékbetétet. Eddig senki nem csinálta ezt.' },
  { plate: 'JBN-147', who: 'Ildikó, Vecsés', text: 'A vizsga előtti átnézés után elsőre átment. A listát kinyomtatva adták.' },
]

const FAQ = [
  ['Megvárhatom az autót?', 'Az egyórás munkáknál igen, van kávé és wifi. A hosszabbaknál hívunk, amikor kész.'],
  ['Hozhatok saját alkatrészt?', 'Hozhatsz. Akkor csak a munkadíjat fizeted, de a garancia a beszerelésre vonatkozik, az alkatrészre nem.'],
  ['Mennyi ideig van garancia?', '12 hónap minden elvégzett munkára, alkatrészre és munkadíjra is, ha nálunk vettük az alkatrészt.'],
  ['Kártyával is lehet fizetni?', 'Igen, kártyával és készpénzzel. Céges autónál átutalásra is adunk számlát.'],
]

function dayLabel(iso, now) {
  const today = isoLocal(now)
  const tomorrow = new Date(now)
  tomorrow.setDate(now.getDate() + 1)
  if (iso === today) return 'ma'
  if (iso === isoLocal(tomorrow)) return 'holnap'
  return new Intl.DateTimeFormat('hu-HU', { weekday: 'long' }).format(atMinutes(iso, 12 * 60))
}

export function Hero({ onBook, onQuote, nextNo }) {
  return (
    <section className="hero-sheet" aria-labelledby="hero-cim">
      <div className="hero-copy">
        <p className="eyebrow">Autószerelő műhely, {BUSINESS.city}</p>
        <h1 id="hero-cim">Három emelő. Időpontra dolgozunk.</h1>
        <p className="sheet-lede">
          Olajcsere, fék, klíma, vizsga előtti átnézés. Az árat a foglaláskor látod, a régi alkatrészt megmutatjuk, és minden munkára 12 hónap a garancia.
        </p>
        <div className="row">
          <button type="button" className="submit" onClick={onBook}>
            Időpontot foglalok
          </button>
          <button type="button" className="ghost" onClick={onQuote}>
            Nem tudom, mi a baja
          </button>
        </div>
      </div>
      <figure className="hero-photo">
        <img src="/muhely.webp" width="1600" height="800" alt="A műhely este: szerszámfal, hegesztőpad, egy szerelő munkaruhában, előtérben kerekek" />
        <figcaption>
          <span>Ipar utca 14.</span>
          <span className="stamp-mini">Nº {String(nextNo).padStart(4, '0')}</span>
        </figcaption>
      </figure>
    </section>
  )
}

export function LiftBoard({ bookings, onBook }) {
  const now = new Date()
  const next = nextFreeSlot(60, bookings, now)
  const weekday = new Intl.DateTimeFormat('hu-HU', { weekday: 'long', month: 'long', day: 'numeric' }).format(now)
  return (
    <section className="board-wrap" aria-labelledby="tabla-cim">
      <div className="board-head">
        <h2 id="tabla-cim">Mi van ma az emelőkön?</h2>
        <p className="sheet-lede">A műhely fehértáblája, ahogy reggel felírjuk. Ha a kocsid itt van, látod, hol tart.</p>
      </div>
      <div className="whiteboard">
        <p className="wb-date">{weekday}</p>
        <div className="lifts">
          {LIFTS.map((cars, i) => (
            <div key={i} className="lift">
              <h3>{i + 1}. emelő</h3>
              <ul>
                {cars.map((c) => (
                  <li key={c.plate} className={`magnet ${c.state}`}>
                    <span className="hu-plate">
                      <i aria-hidden="true">H</i>
                      {c.plate}
                    </span>
                    <span className="wb-text">
                      {c.car}, {c.job}
                    </span>
                    <span className="wb-state">{STATES[c.state]}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="wb-next">
          {next ? (
            <>
              Következő szabad leadás: <b>{dayLabel(next.date, now)} {minutesToLabel(next.startMin)}</b>{' '}
              <button type="button" className="link" onClick={onBook}>
                lefoglalom
              </button>
            </>
          ) : (
            'A következő két hét betelt. Hívj, és beszorítunk.'
          )}
        </p>
      </div>
    </section>
  )
}

export function Checklist({ onBookInspection }) {
  const [done, setDone] = useState(() => CHECKS.map(() => false))
  const count = done.filter(Boolean).length
  return (
    <section className="checklist sheet" aria-labelledby="vizsga-cim">
      <h2 id="vizsga-cim" className="sheet-title">
        Vizsga előtt? Nézd át otthon.
      </h2>
      <p className="sheet-lede">Ezen bukik el a legtöbb autó a műszaki vizsgán. Pipáld ki, amit magad is meg tudsz nézni.</p>
      <ul className="checks">
        {CHECKS.map((text, i) => (
          <li key={text}>
            <label>
              <input
                type="checkbox"
                checked={done[i]}
                onChange={() => setDone((d) => d.map((v, j) => (j === i ? !v : v)))}
              />
              <span className="box" aria-hidden="true">
                {done[i] ? '×' : ''}
              </span>
              {text}
            </label>
          </li>
        ))}
      </ul>
      <div className="sheet-foot">
        <p className="tally" aria-live="polite">
          <b>
            {count} / {CHECKS.length}
          </b>{' '}
          {count === CHECKS.length ? 'rendben. A fék, a futómű és a kipufogó tömítettsége viszont emelőn látszik.' : 'kipipálva. A többit és ami alulról látszik, mi nézzük meg.'}
        </p>
        <button type="button" className="submit" onClick={onBookInspection}>
          Átnézést kérek, 14 900 Ft
        </button>
      </div>
    </section>
  )
}

export function Shots() {
  return (
    <section className="shots" aria-labelledby="muhely-cim">
      <h2 id="muhely-cim" className="block-title">
        A műhelyből
      </h2>
      <ul>
        {SHOTS.map((s) => (
          <li key={s.src}>
            <img src={s.src} alt={s.alt} width="640" height="800" loading="lazy" />
            <p>{s.cap}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function Notes() {
  return (
    <section className="notes" aria-labelledby="ugyfel-cim">
      <h2 id="ugyfel-cim">Az ügyfél megjegyzése</h2>
      <p className="sheet-lede">A munkalap alján van egy sor. Néhányan beleírnak. A nevek a bemutatóhoz kitaláltak.</p>
      <ul>
        {NOTES.map((n) => (
          <li key={n.plate} className="slip">
            <p className="slip-head">
              <b className="plate">{n.plate}</b>
              <span>{n.who}</span>
            </p>
            <p className="slip-label">Ügyfél megjegyzése:</p>
            <p className="hand">{n.text}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function Faq() {
  return (
    <section className="faq" aria-labelledby="gyik-cim">
      <h2 id="gyik-cim" className="block-title">
        Gyakori kérdések
      </h2>
      {FAQ.map(([q, a]) => (
        <details key={q}>
          <summary>{q}</summary>
          <p>{a}</p>
        </details>
      ))}
    </section>
  )
}

export function Where() {
  const tel = BUSINESS.phone.replace(/\s/g, '')
  return (
    <section className="where" aria-labelledby="hol-cim">
      <div>
        <h2 id="hol-cim">Gyál, az Ipar utcában.</h2>
        <p className="sheet-lede">Az M0-ról négy perc. Az udvaron hat autónak van hely, a kaput nyitva hagyjuk.</p>
      </div>
      <dl className="receipt">
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
        <div>
          <dt>Nyitva</dt>
          <dd>{BUSINESS.hours}</dd>
        </div>
      </dl>
    </section>
  )
}
