import test from 'node:test'
import assert from 'node:assert/strict'
import { describe, recipeProblems, lensFor, FACES, FRAMES, examSlots } from './logic.js'

test('magyarázat: rövid- és távollátás, cilinder, addíció, magyar tizedesvessző', () => {
  assert.match(describe({ sph: -2.25 }).join(' '), /−2,25 dioptria rövidlátás.*enyhe/)
  assert.match(describe({ sph: -6.5 }).join(' '), /erős/)
  assert.match(describe({ sph: 1.5 }).join(' '), /\+1,50 dioptria távollátás/)
  assert.match(describe({ sph: 0, cyl: -0.75, ax: 90 }).join(' '), /−0,75 dioptria szemtengelyferdülés.*90°/)
  assert.match(describe({ sph: 0, add: 2 }).join(' '), /\+2,00/)
  assert.equal(describe({}).length, 1)
})

test('recept-ellenőrzés: negyed lépés, tartomány, tengely a cilinderhez', () => {
  assert.deepEqual(recipeProblems({ sph: -2.25, cyl: -0.5, ax: 180, add: 0 }), [])
  assert.match(recipeProblems({ sph: -2.3, cyl: 0, ax: 0, add: 0 }).join(), /SPH/)
  assert.match(recipeProblems({ sph: 0, cyl: 0.5, ax: 0, add: 0 }).join(), /CYL/)
  assert.match(recipeProblems({ sph: 0, cyl: -1, ax: 200, add: 0 }).join(), /AX/)
  assert.match(recipeProblems({ sph: 0, cyl: 0, ax: 0, add: 4 }).join(), /ADD/)
})

test('lencse: az erősebb szem dönt, határoknál a vékonyabb lép be, multifokális felár', () => {
  assert.equal(lensFor({ sph: -1 }, { sph: -2 }).index, '1.5')
  assert.equal(lensFor({ sph: -2, cyl: -0.25 }, { sph: 0 }).index, '1.6')
  assert.equal(lensFor({ sph: -5 }, { sph: -1 }).index, '1.67')
  assert.equal(lensFor({ sph: -8 }, { sph: 0 }).index, '1.74')
  const p = lensFor({ sph: 1, add: 2 }, { sph: 1 })
  assert.equal(p.progressive, true)
  assert.equal(p.pair, 9900 * 2 + 30000)
})

test('arcforma: minden ajánlott keret létezik', () => {
  for (const f of Object.values(FACES)) for (const k of f.frames) assert.ok(FRAMES[k], k)
})

test('vizsgaidőpontok: vasárnap nincs, szombaton csak délig, stabil', () => {
  const s = examSlots(new Date(2026, 9, 16), 6)
  assert.equal(s.length, 6)
  for (const d of s) {
    assert.notEqual(d.date.getDay(), 0)
    for (const m of d.times) assert.ok(m >= 540 && m + 20 <= (d.date.getDay() === 6 ? 720 : 1020))
  }
  assert.deepEqual(examSlots(new Date(2026, 9, 16), 6), s)
})
