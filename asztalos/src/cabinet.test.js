import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { clampSize, cutList, doorsFor, quote, quoteProblems } from './cabinet.js'

describe('clampSize', () => {
  it('keeps sizes between 40 and 240 cm, in whole centimetres', () => {
    assert.equal(clampSize(12), 40)
    assert.equal(clampSize(300), 240)
    assert.equal(clampSize(99.6), 100)
    assert.equal(clampSize('abc'), 40)
  })
})

describe('doorsFor', () => {
  it('uses one door per started 60 cm', () => {
    assert.equal(doorsFor(60), 1)
    assert.equal(doorsFor(61), 2)
    assert.equal(doorsFor(180), 3)
  })
})

describe('cutList', () => {
  it('lists sides, top and bottom, shelves, back and doors in mm', () => {
    const parts = cutList({ w: 100, h: 200, d: 60, shelves: 4, doors: 2 })
    assert.deepEqual(parts.map((p) => [p.name, p.qty, p.a, p.b]), [
      ['Oldallap', 2, 2000, 600],
      ['Tető és fenék', 2, 964, 600],
      ['Polc', 4, 962, 580],
      ['Hátfal (HDF)', 1, 1000, 2000],
      ['Ajtó', 2, 1996, 496],
    ])
  })
  it('leaves out shelves and doors when there are none', () => {
    assert.deepEqual(cutList({ w: 80, h: 80, d: 30 }).map((p) => p.name), ['Oldallap', 'Tető és fenék', 'Hátfal (HDF)'])
  })
})

describe('quote', () => {
  it('costs more in walnut than in birch ply', () => {
    const spec = { w: 100, h: 200, d: 60, shelves: 4, doors: 2 }
    assert.ok(quote(spec, 'dio').total > quote(spec, 'nyir').total)
  })
  it('rounds to a thousand forints', () => {
    assert.equal(quote({ w: 57, h: 91, d: 45, shelves: 1, doors: 1 }).total % 1000, 0)
  })
})

describe('quoteProblems', () => {
  it('asks for name, phone and place', () => {
    assert.deepEqual(Object.keys(quoteProblems({})).sort(), ['city', 'name', 'phone'])
  })
})
