import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { barWeight, classesFor, loadOrder, monthly, trialProblems } from './plates.js'

describe('monthly', () => {
  it('is the base membership with nothing loaded', () => {
    assert.equal(monthly([]), 12900)
  })
  it('adds plates and applies the commitment discount', () => {
    assert.equal(monthly(['csoport', 'szauna']), 12900 + 4900 + 3500)
    assert.equal(monthly(['csoport', 'szauna'], 'ev'), Math.round((21300 * 0.8) / 100) * 100)
  })
  it('ignores unknown add-ons and terms', () => {
    assert.equal(monthly(['x'], 'y'), 12900)
  })
})

describe('barWeight', () => {
  it('counts each plate twice, one per side, on a 20 kg bar', () => {
    assert.equal(barWeight([]), 20)
    assert.equal(barWeight(['szemelyi', 'torolkozo']), 20 + 2 * 25 + 2 * 5)
  })
})

describe('loadOrder', () => {
  it('puts the heaviest plate next to the collar', () => {
    assert.deepEqual(loadOrder(['torolkozo', 'szemelyi', 'szauna']).map((a) => a.id), ['szemelyi', 'szauna', 'torolkozo'])
  })
})

describe('classesFor', () => {
  it('never shows more free spots than the class holds', () => {
    for (let d = 1; d <= 28; d++) {
      for (const c of classesFor(new Date(2026, 9, d))) {
        assert.ok(c.free >= 0 && c.free <= c.cap)
      }
    }
  })
  it('has one class on Sunday and three on Monday', () => {
    assert.equal(classesFor(new Date('2026-09-27T10:00')).length, 1)
    assert.equal(classesFor(new Date('2026-09-28T10:00')).length, 3)
  })
})

describe('trialProblems', () => {
  it('needs a name and a phone', () => {
    assert.deepEqual(Object.keys(trialProblems({})).sort(), ['name', 'phone'])
    assert.deepEqual(trialProblems({ name: 'Fekete Bence', phone: '06 70 219 4480' }), {})
  })
})
