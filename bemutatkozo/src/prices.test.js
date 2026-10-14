import { test } from 'node:test'
import assert from 'node:assert/strict'
import { JOBS, forint, readout, angle } from './prices.js'

test('forint groups thousands with a non-breaking space', () => {
  assert.equal(forint(6000), '6\u00a0000')
  assert.equal(forint(120000), '120\u00a0000')
  assert.equal(forint(950), '950')
})

test('readout names the unit only when the price is per item', () => {
  assert.deepEqual(readout('konnektor'), { value: '6\u00a0000', unit: 'Ft-tól / db', time: 'kb. 20 perc darabja' })
  assert.equal(readout('tabla').unit, 'Ft-tól')
})

test('an unknown position reads OFF', () => {
  assert.equal(readout('nincs').value, 'OFF')
  assert.equal(readout(undefined).value, 'OFF')
})

test('the dial spans -120 to 120 degrees', () => {
  assert.equal(angle(0), -120)
  assert.equal(angle(JOBS.length - 1), 120)
})
