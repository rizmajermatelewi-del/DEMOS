import test from 'node:test'
import assert from 'node:assert/strict'
import { STOCK, suggest, total, wrapOf, reserveProblems, holdUntil, holdCode, CARD_MAX } from './logic.js'

test('ajánló: keret, címzett, alkalom; az elfogyott a végére kerül', () => {
  const r = suggest({ who: 'kollega', occ: 'koszonet', budget: 5000 })
  assert.ok(r.length >= 3)
  for (const p of r) {
    assert.ok(p.price <= 5000 && p.who.includes('kollega') && p.occ.includes('koszonet'), p.name)
  }
  assert.equal(r.at(-1).stock, 0) // a keksz elfogyott, a végén
  assert.deepEqual(suggest({ who: 'gyerek', occ: 'koszonet', budget: 2000 }), [])
  assert.equal(suggest({ budget: 99999 }).length, STOCK.length)
})

test('ár: csomagolással, ismeretlen csomagolás = kraft', () => {
  const bogre = STOCK[0]
  assert.equal(total(bogre, 'kraft'), 4900)
  assert.equal(total(bogre, 'doboz'), 6400)
  assert.equal(wrapOf('nincs').id, 'kraft')
})

test('félretétel: elfogyott, hosszú kártya, hiányzó adat', () => {
  const bogre = STOCK[0]
  assert.deepEqual(reserveProblems(bogre, 'Boldog névnapot!', 'Anna', '06 30 111 2222'), [])
  assert.match(reserveProblems(STOCK[7], '', 'Anna', '06301112222').join(), /elfogyott/)
  assert.match(reserveProblems(bogre, 'x'.repeat(CARD_MAX + 1), 'Anna', '06301112222').join(), /legfeljebb/)
  assert.equal(reserveProblems(null, '', '', '').length, 3)
})

test('meddig tesszük félre: másnap zárásig, szombaton 13-ig, vasárnapot átugorja', () => {
  const fri = holdUntil(new Date(2026, 9, 16, 15, 0)) // péntek
  assert.equal(fri.date.getDay(), 6)
  assert.equal(fri.close, 780)
  const sat = holdUntil(new Date(2026, 9, 17, 11, 0)) // szombat -> hétfő
  assert.equal(sat.date.getDay(), 1)
  assert.equal(sat.close, 1080)
})

test('kód: stabil, formátum AB-123', () => {
  const d = new Date(2026, 9, 16)
  assert.equal(holdCode(STOCK[0], 'Anna', d), holdCode(STOCK[0], 'Anna', d))
  assert.match(holdCode(STOCK[0], 'Anna', d), /^[A-Z]{2}-\d{3}$/)
  assert.notEqual(holdCode(STOCK[0], 'Anna', d), holdCode(STOCK[1], 'Anna', d))
})
