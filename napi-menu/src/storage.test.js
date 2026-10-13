import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import { addOrder, loadOrders, loadWeek, normalizeAllergens, normalizeMenu, saveDay, setOrderStatus } from './storage.js'

const memory = new Map()

beforeEach(() => {
  memory.clear()
  globalThis.localStorage = {
    getItem: (key) => (memory.has(key) ? memory.get(key) : null),
    setItem: (key, value) => memory.set(key, String(value)),
    removeItem: (key) => memory.delete(key),
  }
})

const tuesday = {
  soup: 'Gulyásleves',
  soupPrice: 990,
  mains: [
    { name: 'Csirkepaprikás galuskával', price: 2390 },
    { name: 'Töltött káposzta', price: 2590 },
  ],
  dessert: 'Túró rudi szelet',
  dessertPrice: 490,
  note: '',
  closed: false,
}

describe('normalizeMenu', () => {
  it('rejects a price that is not a forint amount', () => {
    assert.equal(normalizeMenu({ ...tuesday, soupPrice: 'abc' }), null)
    assert.equal(normalizeMenu({ ...tuesday, soup: '  ' }), null)
  })
})

describe('saveDay', () => {
  it('keeps the previous Tuesday when the new price is not a number', () => {
    const bad = saveDay(2, { ...tuesday, dessertPrice: 'sok' })
    assert.equal(bad.ok, false)
    assert.equal(bad.week[2].dessertPrice, 490)
    assert.equal(loadWeek()[2].dessert, 'Túró rudi szelet')
  })

  it('stores a valid day and ignores a broken saved record on the next load', () => {
    const saved = saveDay(2, { ...tuesday, note: 'Kifogyott a galuska.' })
    assert.equal(saved.ok, true)
    assert.equal(loadWeek()[2].note, 'Kifogyott a galuska.')

    const raw = JSON.parse(localStorage.getItem('kispipa-week-v2'))
    raw[1] = { soup: 'hiányos' }
    localStorage.setItem('kispipa-week-v2', JSON.stringify(raw))
    assert.equal(loadWeek()[1].soup, 'Újházi tyúkhúsleves')
    assert.equal(loadWeek()[2].note, 'Kifogyott a galuska.')
  })
})

describe('allergens', () => {
  it('keeps known codes once, in legend order, and drops the rest', () => {
    assert.deepEqual(normalizeAllergens(['l', 'G', 'x', 'G']), ['G', 'L'])
    assert.deepEqual(normalizeMenu({ ...tuesday, soupAllergens: ['Z', 'q'] }).soupAllergens, ['Z'])
    assert.deepEqual(loadWeek()[5].mains[0].allergens, ['H'])
  })
})

describe('orders', () => {
  const order = { lines: [{ id: 'soup', name: 'Gulyásleves', price: 990, qty: 1 }], slot: '12:00', name: 'Kiss Anna', phone: '06 30 123 4567', total: 990 }

  it('numbers the day from 1 and moves a ticket through its statuses', () => {
    assert.equal(addOrder('2026-10-13', order).no, 1)
    assert.equal(addOrder('2026-10-13', order).no, 2)
    setOrderStatus('2026-10-13', 1, 'kesz')
    assert.deepEqual(loadOrders('2026-10-13').map((o) => o.status), ['kesz', 'uj'])
    setOrderStatus('2026-10-13', 2, 'eltunt')
    assert.equal(loadOrders('2026-10-13')[1].status, 'uj')
  })

  it("does not carry yesterday's tickets into today", () => {
    addOrder('2026-10-12', order)
    assert.deepEqual(loadOrders('2026-10-13'), [])
    assert.equal(addOrder('2026-10-13', order).no, 1)
  })
})
