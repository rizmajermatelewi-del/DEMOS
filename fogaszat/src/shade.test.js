import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { bookingProblems, emergencySlot, sessionsNeeded, SHADES, whiteningQuote } from './shade.js'

describe('shade guide', () => {
  it('has the 16 VITA classical shades, B1 lightest and C4 darkest', () => {
    assert.equal(SHADES.length, 16)
    assert.equal(SHADES[0].code, 'B1')
    assert.equal(SHADES.at(-1).code, 'C4')
  })
})

describe('sessionsNeeded', () => {
  it('needs nothing when the target is not lighter', () => {
    assert.equal(sessionsNeeded(4, 4), 0)
    assert.equal(sessionsNeeded(2, 6), 0)
  })
  it('takes one session per started three steps', () => {
    assert.equal(sessionsNeeded(8, 5), 1)
    assert.equal(sessionsNeeded(8, 4), 2)
    assert.equal(sessionsNeeded(15, 0), 5)
  })
})

describe('whiteningQuote', () => {
  it('adds the check-up before the sessions', () => {
    assert.deepEqual(whiteningQuote(8, 4), { sessions: 2, total: 12000 + 2 * 45000 })
    assert.deepEqual(whiteningQuote(3, 3), { sessions: 0, total: 0 })
  })
})

describe('emergencySlot', () => {
  it('offers today before the emergency hour ends', () => {
    const s = emergencySlot(new Date('2026-09-28T07:00:00')) // Monday
    assert.equal(s.today, true)
    assert.equal(s.minutes, 7 * 60 + 30)
  })
  it('rounds up to the next quarter hour inside the window', () => {
    assert.equal(emergencySlot(new Date('2026-09-28T07:40:00')).minutes, 7 * 60 + 45)
  })
  it('moves to the next weekday after the window and over the weekend', () => {
    const fri = emergencySlot(new Date('2026-10-02T09:00:00'))
    assert.equal(fri.today, false)
    assert.equal(fri.date.getDay(), 1)
    assert.equal(emergencySlot(new Date('2026-09-26T07:00:00')).date.getDate(), 28) // Saturday -> Monday
  })
})

describe('bookingProblems', () => {
  it('needs name, phone and a reason', () => {
    assert.deepEqual(Object.keys(bookingProblems({})).sort(), ['name', 'phone', 'reason'])
    assert.deepEqual(bookingProblems({ name: 'Szabó Nóra', phone: '06 30 581 2204', reason: 'kontroll' }), {})
  })
})
