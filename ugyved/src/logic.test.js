import test from 'node:test'
import assert from 'node:assert/strict'
import { CASES, feeFor, docsProgress, consultSlots } from './logic.js'

test('minden ügytípusnak van leírása, ideje, díja és iratlistája', () => {
  for (const [id, c] of Object.entries(CASES)) {
    assert.ok(c.name && c.what && c.time && c.fee.label, id)
    assert.ok(c.docs.length >= 3, id)
  }
})

test('díj: ingatlannál a vételár 0,8%-a, legalább 80 000; fix díjnál az összeg', () => {
  assert.equal(feeFor('ingatlan', 45000000), 360000)
  assert.equal(feeFor('ingatlan', 5000000), 80000)
  assert.equal(feeFor('ingatlan', ''), null)
  assert.equal(feeFor('ingatlan', -5), null)
  assert.equal(feeFor('ceg'), 70000)
  assert.equal(feeFor('nincs'), null)
})

test('iratok: haladás és kész állapot', () => {
  const docs = CASES.szerzodes.docs
  assert.deepEqual(docsProgress('szerzodes', new Set([docs[0]])), { have: 1, total: 3, ready: false })
  assert.equal(docsProgress('szerzodes', new Set(docs)).ready, true)
  assert.equal(docsProgress('nincs', new Set()).ready, false)
})

test('konzultáció: hétvégén nincs, kedden és csütörtökön 18 óráig', () => {
  const s = consultSlots(new Date(2026, 9, 16), 6)
  assert.equal(s.length, 6)
  for (const d of s) {
    assert.ok(d.date.getDay() >= 1 && d.date.getDay() <= 5)
    const end = [2, 4].includes(d.date.getDay()) ? 1080 : 960
    for (const m of d.times) assert.ok(m >= 540 && m + 30 <= end)
  }
})
