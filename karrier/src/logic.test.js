import test from 'node:test'
import assert from 'node:assert/strict'
import { JOBS, SHIFTS, slot, nightHours, match, verdict, weeklyGross, validPhone, forint } from './logic.js'

const job = (id) => JOBS.find((j) => j.id === id)

test('éjszakai órák: hajnal 3–11 = 3 óra, délután 0, este 20–24 = 2', () => {
  assert.equal(nightHours(SHIFTS.hajnal.start, SHIFTS.hajnal.end), 3)
  assert.equal(nightHours(13, 20), 0)
  assert.equal(nightHours(20, 24), 2)
  assert.equal(nightHours(0, 24), 8)
})

test('egyezés: üres naptár 0, a kért napok fölött sem több 100%-nál', () => {
  assert.deepEqual(match(new Set(), job('pek')), { covered: 0, need: 5, pct: 0 })
  const all = new Set([0, 1, 2, 3, 4, 5, 6].map((d) => slot(d, 'hajnal')))
  const m = match(all, job('pek'))
  assert.equal(m.covered, 6)
  assert.equal(m.pct, 1)
})

test('egyezés: az eladónál a délután is számít, a vasárnap nem', () => {
  const a = new Set([slot(0, 'delutan'), slot(1, 'delelott'), slot(6, 'delelott')])
  assert.equal(match(a, job('elado')).covered, 2)
})

test('ítélet küszöbök', () => {
  assert.equal(verdict(1).key, 'jo')
  assert.equal(verdict(0.6).key, 'talan')
  assert.equal(verdict(0.59).key, 'nem')
})

test('heti bér: pékre 5 nap = 5 × (8 óra + 3 éjszakai óra pótléka), kerekítve', () => {
  const j = job('pek')
  const perDay = 8 * 2600 + 3 * 2600 * 0.15 // 20 800 + 1 170
  assert.equal(weeklyGross(j, 5), Math.round((5 * perDay) / 100) * 100)
  assert.equal(weeklyGross(j, 9), weeklyGross(j, 5)) // nem fizet a kért napokon túl
  assert.equal(weeklyGross(j, 0), 0)
  assert.equal(weeklyGross(job('elado'), 5) % 100, 0)
})

test('telefonszám: magyar mobil formák', () => {
  for (const ok of ['+36 30 555 0199', '06-20-123-4567', '06705551234', '+36(31)5550000']) assert.ok(validPhone(ok), ok)
  for (const bad of ['', '1234', '+36 1 234 5678', '06 30 555 01', '+44 7700 900123']) assert.ok(!validPhone(bad), bad)
})

test('forint: nem törő szóköz', () => {
  assert.equal(forint(109250), '109\u00a0250\u00a0Ft')
})
