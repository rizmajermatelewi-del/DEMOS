import test from 'node:test'
import assert from 'node:assert/strict'
import { DEVICES, FAULTS, estimate, inStock, nextWorkday, track, STAGES, printPrice } from './logic.js'

test('becslés: minden eszköz-márka-hiba ad árat, alsó <= felső, kerek 500-ra', () => {
  const now = new Date(2026, 9, 14, 10, 0) // szerda délelőtt
  for (const [d, dev] of Object.entries(DEVICES)) for (const b of dev.brands) for (const f of Object.keys(FAULTS)) {
    const e = estimate(d, b, f, now)
    assert.ok(e.low > 0 && e.low <= e.high, `${d} ${b} ${f}`)
    assert.equal(e.low % 500, 0)
  }
})

test('prémium márka drágább', () => {
  const now = new Date(2026, 9, 14, 10, 0)
  assert.ok(estimate('telefon', 'iPhone', 'kijelzo', now).low > estimate('telefon', 'Xiaomi', 'kijelzo', now).low)
})

test('elkészülés: gyors hiba raktárról ma, 14 után holnap, alkatrész nélkül 3 munkanap', () => {
  const morning = new Date(2026, 9, 14, 10, 0) // szerda
  assert.equal(estimate('telefon', 'Samsung', 'lassu', morning).ready.kind, 'ma')
  assert.equal(estimate('telefon', 'Samsung', 'lassu', new Date(2026, 9, 14, 15, 0)).ready.kind, 'kovetkezo')
  const missing = ['telefon', 'laptop', 'tablet'].flatMap((d) => DEVICES[d].brands.flatMap((b) => Object.keys(FAULTS).map((f) => [d, b, f]))).find(([d, b, f]) => !inStock(d, b, f))
  assert.ok(missing, 'van hiányzó alkatrész a mintában')
  assert.equal(estimate(...missing, morning).ready.kind, 'alkatresz')
})

test('munkanap: péntek után hétfő, a hétvégét átugorja', () => {
  assert.equal(nextWorkday(new Date(2026, 9, 16)).getDay(), 1) // péntek -> hétfő
  assert.equal(nextWorkday(new Date(2026, 9, 17), 3).getDate(), 21) // szombat -> szerda (19, 20, 21)
})

test('munkalap: formátum, kis- és nagybetű, stabil állapot', () => {
  assert.equal(track('xx'), null)
  assert.equal(track('CS-12'), null)
  const a = track(' cs-2417 ')
  assert.equal(a.code, 'CS-2417')
  assert.ok(a.stage >= 0 && a.stage < STAGES.length)
  assert.deepEqual(track('CS-2417'), a)
})

test('nyomtatás: ff és színes, 100 oldaltól kedvezmény, kétoldalas lap', () => {
  assert.deepEqual(printPrice(10, false, false), { total: 300, sheets: 10, discount: false })
  assert.equal(printPrice(10, true, false).total, 1200)
  assert.deepEqual(printPrice(100, false, true), { total: 2400, sheets: 50, discount: true })
  assert.equal(printPrice(-5, false, false).total, 0)
})
