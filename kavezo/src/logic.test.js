import test from 'node:test'
import assert from 'node:assert/strict'
import { modeAt, nightness, openState, upcoming, bookingProblems, clock, MENU, MODES } from './logic.js'

test('napszak: a határokon vált, minden napszakhoz van étlap', () => {
  assert.equal(modeAt(7 * 60).id, 'reggel')
  assert.equal(modeAt(11 * 60 - 1).id, 'reggel')
  assert.equal(modeAt(11 * 60).id, 'delutan')
  assert.equal(modeAt(18 * 60 + 59).id, 'aperitivo')
  assert.equal(modeAt(23 * 60).id, 'este')
  for (const m of MODES) assert.ok(MENU[m.id].length >= 3, m.id)
})

test('esti hangulat: 16 előtt 0, 20 után 1, 18-kor fél', () => {
  assert.equal(nightness(9 * 60), 0)
  assert.equal(nightness(18 * 60), 0.5)
  assert.equal(nightness(22 * 60), 1)
})

test('nyitva: hétköznap 7-23, vasárnap 9-18, zárás után a másnapi nyitást mondja', () => {
  assert.deepEqual(openState(new Date(2026, 9, 14, 10, 0)), { open: true, until: 23 * 60 }) // szerda
  assert.deepEqual(openState(new Date(2026, 9, 18, 8, 30)), { open: false, opens: 9 * 60, inDays: 0 }) // vasárnap reggel
  assert.deepEqual(openState(new Date(2026, 9, 18, 19, 0)), { open: false, opens: 7 * 60, inDays: 1 }) // vasárnap este
  assert.equal(openState(new Date(2026, 9, 17, 23, 30)).open, true) // szombat éjfélig
})

test('programok: csak kedd, csütörtök, péntek; stabil; sosem negatív hely', () => {
  const a = upcoming('2026-10-16', 9)
  assert.equal(a.length, 9)
  for (const e of a) {
    assert.ok([2, 4, 5].includes(new Date(`${e.date}T12:00:00Z`).getUTCDay()), e.date)
    assert.ok(e.left >= 0 && e.left <= e.seats)
  }
  assert.deepEqual(upcoming('2026-10-16', 9), a)
  assert.equal(a[0].date, '2026-10-16') // péntek: jazz
})

test('foglalás: létszám, betelt est, kvízcsapat mérete', () => {
  const ev = { name: 'Borkóstoló', left: 3 }
  assert.deepEqual(bookingProblems(ev, 2), [])
  assert.match(bookingProblems(ev, 4).join(), /csak 3 hely/)
  assert.match(bookingProblems({ name: 'Jazz', left: 0 }, 1).join(), /betelt/)
  assert.match(bookingProblems({ name: 'Kocsmakvíz', left: 20 }, 7).join(), /legfeljebb 6/)
  assert.match(bookingProblems(null, 2).join(), /Válasszon/)
  assert.equal(clock(19 * 60 + 5), '19:05')
  assert.equal(clock(24 * 60), '0:00')
})
