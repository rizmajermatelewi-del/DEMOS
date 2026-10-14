import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { compare, crowd, freeByZone, level, openHours, quietest, trialProblems, ZONES } from './crowd.js'

describe('crowd', () => {
  it('is null outside opening hours', () => {
    assert.equal(crowd(2, 5), null)
    assert.equal(crowd(2, 22), null)
    assert.equal(crowd(6, 7), null)
  })
  it('stays between 3 and 98 and peaks after work on weekdays', () => {
    for (let d = 0; d < 7; d++) {
      const [o, c] = openHours(d)
      for (let h = o; h < c; h++) assert.ok(crowd(d, h) >= 3 && crowd(d, h) <= 98)
    }
    assert.ok(crowd(2, 18) > crowd(2, 14))
  })
  it('names the level', () => {
    assert.equal(level(10), 'Szinte üres')
    assert.equal(level(50), 'Közepes')
    assert.equal(level(80), 'Tele')
    assert.equal(level(null), 'Zárva')
  })
})

describe('freeByZone', () => {
  it('never goes below zero or above capacity', () => {
    for (const h of [6, 12, 18, 21]) {
      for (const z of freeByZone(1, h)) assert.ok(z.free >= 0 && z.free <= z.cap)
    }
    assert.equal(freeByZone(1, 18).length, ZONES.length)
    assert.deepEqual(freeByZone(0, 6), [])
  })
})

describe('quietest', () => {
  it('finds a window inside opening hours that is quieter than the evening peak', () => {
    const h = quietest(3)
    assert.ok(h >= 6 && h < 21)
    assert.ok(crowd(3, h) < crowd(3, 18))
  })
})

describe('compare', () => {
  it('picks the 10-visit pass for once a week and the monthly pass for three times', () => {
    assert.equal(compare(1).rows.find((r) => r.best).id, 'tiz')
    assert.equal(compare(3).rows.find((r) => r.best).id, 'havi')
  })
  it('works out the cost per visit', () => {
    const havi = compare(3).rows.find((r) => r.id === 'havi')
    assert.equal(havi.perVisit, Math.round(12900 / 13))
  })
})

it('a trial needs a name and a phone', () => {
  assert.deepEqual(Object.keys(trialProblems({})).sort(), ['name', 'phone'])
})
