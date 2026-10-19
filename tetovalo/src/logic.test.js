import test from 'node:test'
import assert from 'node:assert/strict'
import { estimate, claimProblems, FLASH, MIN_PRICE, PLACEMENTS, STYLES } from './logic.js'

test('becslés: minimum ár, nagyobb és színesebb drágább, borda drágább az alkarnál', () => {
  const small = estimate('alkar', 3, 'vonal')
  assert.equal(small.low, Math.round(MIN_PRICE * 0.85 / 1000) * 1000)
  assert.ok(estimate('alkar', 15, 'vonal').high > estimate('alkar', 8, 'vonal').high)
  assert.ok(estimate('alkar', 10, 'szines').low > estimate('alkar', 10, 'vonal').low)
  assert.ok(estimate('borda', 10, 'arnyek').low > estimate('alkar', 10, 'arnyek').low)
})

test('becslés: idő és alkalmak, egy alkalom legfeljebb 4 óra', () => {
  const big = estimate('hat', 30, 'szines')
  assert.ok(big.sessions >= 2)
  assert.equal(big.sessions, Math.ceil(big.hours / 4))
  assert.equal(estimate('alkar', 5, 'vonal').sessions, 1)
  assert.equal(estimate('borda', 10, 'vonal').pain, 5)
})

test('becslés: érvénytelen méret vagy hely', () => {
  assert.equal(estimate('alkar', 2, 'vonal'), null)
  assert.equal(estimate('alkar', 41, 'vonal'), null)
  assert.equal(estimate('alkar', 'x', 'vonal'), null)
  assert.equal(estimate('fej', 10, 'vonal'), null)
  for (const p of Object.keys(PLACEMENTS)) for (const s of Object.keys(STYLES)) assert.ok(estimate(p, 10, s), `${p} ${s}`)
})

test('flash: foglalt nem kérhető, 18 év alatt nem, hiányzó adat', () => {
  const free = FLASH.find((f) => !f.taken), taken = FLASH.find((f) => f.taken)
  assert.deepEqual(claimProblems(free, 'Anna', '06301234567', true), [])
  assert.match(claimProblems(taken, 'Anna', '06301234567', true).join(), /lefoglalta/)
  assert.match(claimProblems(free, 'Anna', '06301234567', false).join(), /18 év/)
  assert.equal(claimProblems(null, '', '', false).length, 4)
})
