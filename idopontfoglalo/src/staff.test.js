import { beforeEach, describe, expect, it } from 'vitest'
import { ANY, availability, busyFor, sampleBusy, staffFor, teethFor } from './staff.js'
import { createBooking, loadBookings } from './storage.js'

const TUE = '2026-09-22'
const morning = new Date('2026-09-22T08:00:00')

describe('stylists', () => {
  it('offers only the stylists who take the service', () => {
    expect(staffFor('ferfi-vagas').map((s) => s.id)).toEqual(['bence'])
    expect(staffFor('noi-vagas')).toHaveLength(3)
  })

  it('keeps the sample calendar the same on every visit, and empty on Sunday', () => {
    expect(sampleBusy(TUE, 'reka')).toEqual(sampleBusy(TUE, 'reka'))
    expect(sampleBusy(TUE, 'reka').length).toBeGreaterThanOrEqual(1)
    expect(sampleBusy('2026-09-27', 'reka')).toEqual([])
  })

  it("does not let one stylist's booking block another", () => {
    const booking = { date: TUE, startMin: 9 * 60, durationMin: 30, staffId: 'reka' }
    expect(busyFor('bence', TUE, [booking]).some((b) => b.staffId === 'reka')).toBe(false)
    expect(busyFor('reka', TUE, [booking])).toContain(booking)
    // A legacy booking that names nobody blocks everyone.
    const legacy = { date: TUE, startMin: 9 * 60, durationMin: 30 }
    expect(busyFor('bence', TUE, [legacy])).toContain(legacy)
  })

  it('offers a start for "anyone" when at least one stylist is free then', () => {
    const ids = staffFor('noi-vagas').map((s) => s.id)
    const all = availability(TUE, 45, [], ids, morning)
    for (const id of ids) {
      for (const start of availability(TUE, 45, [], [id], morning).slots) expect(all.slots).toContain(start)
    }
    const first = all.slots[0]
    expect(all.who.get(first).length).toBeGreaterThan(0)
  })

  it('marks a tooth taken for "anyone" only when every stylist is busy', () => {
    const ids = ['reka', 'dora']
    const { slots } = availability(TUE, 30, [], ids, morning)
    const teeth = teethFor(TUE, slots, [], ids, morning)
    for (const t of teeth.filter((x) => x.state === 'taken')) {
      for (const id of ids) {
        const busy = busyFor(id, TUE, [])
        expect(busy.some((b) => t.min < b.startMin + b.durationMin && t.min + 30 > b.startMin)).toBe(true)
      }
    }
  })
})

describe('createBooking with a stylist', () => {
  const memory = new Map()
  beforeEach(() => {
    memory.clear()
    globalThis.localStorage = {
      getItem: (key) => (memory.has(key) ? memory.get(key) : null),
      setItem: (key, value) => memory.set(key, String(value)),
      removeItem: (key) => memory.delete(key),
    }
  })

  it('books "anyone" onto a stylist who is free, and two people can share a start', () => {
    const { slots, who } = availability(TUE, 45, [], ['reka', 'bence', 'dora'], morning)
    const start = slots.find((s) => who.get(s).length >= 2)
    const draft = { serviceId: 'noi-vagas', serviceName: 'Női hajvágás', durationMin: 45, priceHuf: 6500, date: TUE, startMin: start, name: 'Anna', phone: '06301234567', email: 'a@b.hu', note: '', staffId: ANY }
    const a = createBooking(draft, morning)
    const b = createBooking({ ...draft, name: 'Béla' }, morning)
    expect(a.ok && b.ok).toBe(true)
    expect(a.booking.staffId).not.toBe(b.booking.staffId)
    expect(loadBookings()).toHaveLength(2)
  })

  it('refuses a stylist who is already busy at that time', () => {
    const busy = sampleBusy(TUE, 'reka')[0]
    const draft = { serviceId: 'noi-vagas', serviceName: 'Női hajvágás', durationMin: 30, priceHuf: 6500, date: TUE, startMin: busy.startMin, name: 'Anna', phone: '06301234567', email: 'a@b.hu', note: '', staffId: 'reka' }
    expect(createBooking(draft, morning).ok).toBe(false)
  })
})
