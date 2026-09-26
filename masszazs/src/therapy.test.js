import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { bookingProblems, freeSlots, recommend } from './therapy.js'

describe('recommend', () => {
  it('suggests a relaxing hour when nothing hurts', () => {
    assert.equal(recommend([]).key, 'svedRelax')
  })
  it('keeps desk-worker pain to the short neck and shoulder treatment', () => {
    assert.equal(recommend(['nyak', 'vall']).key, 'nyakVall')
  })
  it('sends feet to the foot massage', () => {
    assert.equal(recommend(['talp']).key, 'talp')
  })
  it('goes deeper on a badly hurting back', () => {
    assert.equal(recommend(['derek'], 2).key, 'hatDerek')
    assert.equal(recommend(['derek'], 3).key, 'sport')
  })
  it('takes the whole body from four zones up', () => {
    assert.equal(recommend(['nyak', 'hat', 'lab', 'talp']).key, 'svedTeljes')
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
  it('finds room for the longest treatment too', () => {
    assert.equal(freeSlots(new Date('2026-09-26T16:30:00'), 90, 8).length, 8)
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
