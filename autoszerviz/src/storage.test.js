import { beforeEach, describe, expect, it } from 'vitest'
import { createBooking, loadBookings } from './storage.js'

const memory = new Map()

beforeEach(() => {
  memory.clear()
  globalThis.localStorage = {
    getItem: (key) => (memory.has(key) ? memory.get(key) : null),
    setItem: (key, value) => memory.set(key, String(value)),
    removeItem: (key) => memory.delete(key),
  }
})

const free = {
  serviceId: 'ferfi-vagas',
  serviceName: 'Férfi hajvágás',
  durationMin: 30,
  priceHuf: 4200,
  date: '2026-09-22',
  startMin: 9 * 60,
  name: 'Anna',
  phone: '+36 30 123 4567',
  email: 'anna@example.com',
  note: '',
}

const morning = new Date('2026-09-22T08:00:00')

describe('createBooking', () => {
  it('saves a start that is still free', () => {
    const result = createBooking(free, morning)
    expect(result.ok).toBe(true)
    expect(loadBookings()).toHaveLength(1)
    expect(loadBookings()[0].startMin).toBe(9 * 60)
  })

  it('refuses a start that no longer fits and leaves the list unchanged', () => {
    createBooking(free, morning)
    const clash = createBooking({ ...free, name: 'Béla' }, morning)
    expect(clash.ok).toBe(false)
    expect(clash.booking).toBeUndefined()
    expect(loadBookings()).toHaveLength(1)
  })

  it('drops a saved record that cannot be a booking', () => {
    localStorage.setItem(
      'kormos-bookings-v1',
      JSON.stringify([
        null,
        { date: '2026-09-22' },
        { id: 'ok', date: '2026-09-22', startMin: 600, durationMin: 30, name: 'Anna' },
      ]),
    )
    const kept = loadBookings()
    expect(kept).toHaveLength(1)
    expect(kept[0].id).toBe('ok')
  })

  it('returns an empty list when storage is not JSON', () => {
    localStorage.setItem('kormos-bookings-v1', '{')
    expect(loadBookings()).toEqual([])
  })
})
