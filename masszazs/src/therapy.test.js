import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { AREAS, bookingProblems, composeSession, freeSlots, MINUTES, priceFor } from './therapy.js'

describe('composeSession', () => {
  const sum = (r) => r.parts.reduce((a, p) => a + p.minutes, 0)
  it('fills exactly the chosen time in 5-minute steps', () => {
    for (const m of MINUTES) {
      const r = composeSession(m, ['nyak', 'hat'])
      assert.ok(r.fits)
      assert.equal(sum(r), m)
      assert.ok(r.parts.every((p) => p.minutes % 5 === 0))
    }
  })
  it('gives every area at least its minimum', () => {
    const r = composeSession(45, ['nyak', 'hat', 'talp'])
    assert.deepEqual(r.parts.map((p) => p.minutes >= AREAS.find((a) => a.id === p.id).min), [true, true, true])
  })
  it('says when the areas do not fit and how long they need', () => {
    const r = composeSession(30, ['nyak', 'hat', 'derek', 'lab'])
    assert.equal(r.fits, false)
    assert.equal(r.need, 45)
  })
  it('treats nothing chosen as the whole body', () => {
    assert.equal(composeSession(90).parts.length, AREAS.length)
    assert.equal(composeSession(30).fits, false)
  })
})

describe('priceFor', () => {
  it('rounds up to the next listed length', () => {
    assert.equal(priceFor(60), 12900)
    assert.equal(priceFor(50), 12900)
    assert.equal(priceFor(500), 20900)
  })
})

describe('freeSlots', () => {
  it('never offers Sunday or Monday and starts two hours from now', () => {
    const now = new Date('2026-09-26T13:00:00') // Saturday
    const slots = freeSlots(now, 60, 10)
    assert.equal(slots.length, 10)
    for (const s of slots) {
      assert.ok(![0, 1].includes(s.getDay()))
      assert.ok(s - now >= 2 * 3600e3)
    }
  })
  it('fits the treatment before closing time', () => {
    for (const s of freeSlots(new Date('2026-09-29T08:00:00'), 90, 20)) {
      const end = s.getHours() * 60 + s.getMinutes() + 90
      assert.ok(end <= (s.getDay() === 6 ? 15 : 19) * 60)
    }
  })
  it('finds room for the longest session too', () => {
    assert.equal(freeSlots(new Date('2026-09-26T16:30:00'), 120, 8).length, 8)
  })
  it('is stable for the same moment', () => {
    const now = new Date('2026-09-29T08:00:00')
    assert.deepEqual(freeSlots(now), freeSlots(now))
  })
})

describe('bookingProblems', () => {
  it('needs a slot, a name and a phone', () => {
    assert.deepEqual(Object.keys(bookingProblems({})).sort(), ['name', 'phone', 'slot'])
  })
  it('accepts a full booking', () => {
    assert.deepEqual(bookingProblems({ slot: '2026-09-29T10:00', name: 'Balogh Zita', phone: '06 30 412 8876' }), {})
  })
})

it('a voucher is valid for one year', async () => {
  const { voucherExpiry, huDate } = await import('./therapy.js')
  assert.equal(huDate(voucherExpiry(new Date(2026, 9, 14))), '2027. október 14.')
  assert.equal(huDate(voucherExpiry(new Date(2028, 1, 29))), '2029. február 28.')
})
