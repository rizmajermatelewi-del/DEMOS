import { beforeEach, describe, expect, it } from 'vitest'
import { cartTotal, dayStatus, earliestPickup, pickupTimes, DAILY_CAKE_LIMIT } from './order.js'
import { createOrder, loadOrders } from './storage.js'

const cake = (qty = 1) => ({ productId: 'eszterhazy', sizeId: '12', qty, inscription: '' })
const tray = { productId: 'pogacsa', sizeId: '40', qty: 1 }
// Friday 2026-09-25; Monday 2026-09-28 is closed.
const friMorning = new Date('2026-09-25T10:00:00')
const friEvening = new Date('2026-09-25T16:30:00')

describe('earliestPickup', () => {
  it('needs one day for a tray and two for a cake', () => {
    expect(earliestPickup([tray], friMorning)).toBe('2026-09-26')
    expect(earliestPickup([tray, cake()], friMorning)).toBe('2026-09-27')
  })

  it('adds a day when ordered after the 14:00 cutoff', () => {
    expect(earliestPickup([cake()], friEvening)).toBe('2026-09-28')
  })

  it('still asks for a day on an empty basket', () => {
    expect(earliestPickup([], friMorning)).toBe('2026-09-26')
  })
})

describe('dayStatus', () => {
  it('marks Monday closed and too-soon days early', () => {
    expect(dayStatus('2026-09-28', [cake()], [], friMorning).status).toBe('closed')
    expect(dayStatus('2026-09-26', [cake()], [], friMorning).status).toBe('early')
    expect(dayStatus('2026-09-27', [cake()], [], friMorning).status).toBe('open')
  })

  it('fills a day at the cake limit but still takes trays', () => {
    const booked = [{ pickupDate: '2026-09-29', lines: [cake(DAILY_CAKE_LIMIT - 1)] }]
    expect(dayStatus('2026-09-29', [cake(1)], booked, friMorning)).toEqual({ status: 'open', left: 1 })
    expect(dayStatus('2026-09-29', [cake(2)], booked, friMorning).status).toBe('full')
    const fullDay = [{ pickupDate: '2026-09-29', lines: [cake(DAILY_CAKE_LIMIT)] }]
    expect(dayStatus('2026-09-29', [tray], fullDay, friMorning).status).toBe('open')
  })

  it('ignores broken saved orders', () => {
    expect(dayStatus('2026-09-29', [cake()], [null, { pickupDate: '2026-09-29' }], friMorning).status).toBe('open')
  })
})

describe('totals and times', () => {
  it('sums size price times quantity', () => {
    expect(cartTotal([cake(2), tray])).toBe(2 * 16900 + 7900)
  })

  it('offers pickups from opening to half an hour before closing', () => {
    const times = pickupTimes()
    expect(times[0]).toBe(9 * 60)
    expect(times.at(-1)).toBe(17 * 60 + 30)
  })
})

describe('createOrder', () => {
  const memory = new Map()
  beforeEach(() => {
    memory.clear()
    globalThis.localStorage = {
      getItem: (k) => (memory.has(k) ? memory.get(k) : null),
      setItem: (k, v) => memory.set(k, String(v)),
    }
  })

  const draft = (qty) => ({ lines: [cake(qty)], pickupDate: '2026-09-29', pickupMin: 600, name: 'Anna', phone: '+36301234567' })

  it('refuses an order that no longer fits the day', () => {
    expect(createOrder(draft(5), friMorning).ok).toBe(true)
    const late = createOrder(draft(2), friMorning)
    expect(late).toMatchObject({ ok: false, reason: 'full' })
    expect(loadOrders()).toHaveLength(1)
  })

  it('survives storage that is not JSON', () => {
    memory.set('habcsok-orders-v1', '{')
    expect(loadOrders()).toEqual([])
  })
})
