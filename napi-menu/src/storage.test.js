import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import { loadWeek, normalizeMenu, saveDay } from './storage.js'

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
