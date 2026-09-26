import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { arrange, MAX_STEMS, orderProblems, price, setCount } from './bouquet.js'

describe('setCount', () => {
  it('stops at the stock left today', () => {
    assert.equal(setCount({}, 'liziantusz', 50).liziantusz, 9)
  })
  it('never goes below zero', () => {
    assert.equal(setCount({ rozsa: 1 }, 'rozsa', -1).rozsa, 0)
  })
  it('keeps the whole bouquet under the stem limit', () => {
    const full = { tulipan: 25, eukaliptusz: 8 }
    assert.equal(setCount(full, 'rozsa', 10).rozsa, MAX_STEMS - 33)
  })
})

describe('price', () => {
  it('is zero for an empty bouquet, even with a paid wrap', () => {
    assert.equal(price({}, 'doboz').total, 0)
  })
  it('adds stems, wrap and binding', () => {
    const p = price({ rozsa: 3, eukaliptusz: 2 }, 'selyem')
    assert.deepEqual(p, { stems: 3 * 890 + 2 * 390, wrap: 400, binding: 1200, total: 3 * 890 + 2 * 390 + 400 + 1200 })
  })
})

describe('arrange', () => {
  it('puts the first focal flower in the middle and greens outside', () => {
    const stems = arrange({ eukaliptusz: 2, rozsa: 3 })
    assert.equal(stems[0].id, 'rozsa')
    assert.equal(stems[0].angle, 0)
    const maxRose = Math.max(...stems.filter((s) => s.id === 'rozsa').map((s) => Math.abs(s.angle)))
    const minGreen = Math.min(...stems.filter((s) => s.id === 'eukaliptusz').map((s) => Math.abs(s.angle)))
    assert.ok(minGreen >= maxRose)
  })
  it('alternates sides and stays inside the fan', () => {
    const stems = arrange({ tulipan: 20, fatyolvirag: 15 })
    assert.equal(stems.length, 35)
    assert.ok(stems.every((s) => Math.abs(s.angle) <= 56))
    assert.ok(stems[1].angle > 0 && stems[2].angle < 0)
  })
})

describe('orderProblems', () => {
  it('asks for stems, name, phone and day', () => {
    assert.deepEqual(Object.keys(orderProblems({}, {})).sort(), ['day', 'name', 'phone', 'stems'])
  })
  it('accepts a complete order', () => {
    assert.deepEqual(orderProblems({ name: 'Tóth Réka', phone: '+36 70 318 2249', day: '2026-09-28', card: 'Boldog szülinapot!' }, { rozsa: 5 }), {})
  })
  it('limits the card text', () => {
    assert.ok(orderProblems({ card: 'x'.repeat(81) }, {}).card)
  })
})

import { pickupDays } from './bouquet.js'

describe('pickupDays', () => {
  it('offers today before 16:00 and skips Sunday', () => {
    // 2026-09-26 is a Saturday
    const days = pickupDays(new Date('2026-09-26T10:00:00'), 3).map((d) => d.iso)
    assert.deepEqual(days, ['2026-09-26', '2026-09-28', '2026-09-29'])
  })
  it('starts tomorrow after 16:00', () => {
    assert.equal(pickupDays(new Date('2026-09-29T16:30:00'), 1)[0].iso, '2026-09-30')
  })
  it('marks Saturdays for the short opening', () => {
    assert.equal(pickupDays(new Date('2026-09-26T09:00:00'), 1)[0].saturday, true)
  })
})
