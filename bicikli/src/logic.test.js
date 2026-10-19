import test from 'node:test'
import assert from 'node:assert/strict'
import { PARTS, workOrder, dropDays, fits, service, DAY_CAPACITY } from './logic.js'

test('minden alkatrésznek van szolgáltatása, ára és ideje', () => {
  for (const [id, p] of Object.entries(PARTS)) {
    assert.ok(p.services.length >= 2, id)
    for (const [sid] of p.services) assert.ok(service(sid).price > 0 && service(sid).minutes > 0, sid)
  }
})

test('munkalap: összeg, idő, duplikátum egyszer számít', () => {
  const w = workOrder(['defekt', 'fekall', 'defekt'])
  assert.equal(w.items.length, 2)
  assert.equal(w.price, 3500 + 2500)
  assert.equal(w.minutes, 20 + 15)
  assert.deepEqual(workOrder([]), { items: [], price: 0, minutes: 0 })
})

test('csomag mellett a beállítás benne van, a csere külön; két csomagból a nagyobb', () => {
  const w = workOrder(['atnezes', 'fekall', 'lanccsere'])
  assert.deepEqual(w.items.map((i) => i.id), ['atnezes', 'lanccsere'])
  assert.equal(w.price, 9900 + 3000)
  assert.deepEqual(workOrder(['atnezes', 'nagy']).items.map((i) => i.id), ['nagy'])
})

test('leadási napok: vasárnap nincs, stabil, a szabad idő 0 és a kapacitás között', () => {
  const d = dropDays('2026-10-16', 6)
  assert.equal(d.length, 6)
  for (const x of d) {
    assert.notEqual(new Date(`${x.date}T12:00:00Z`).getUTCDay(), 0)
    assert.ok(x.free >= 0 && x.free <= DAY_CAPACITY)
  }
  assert.deepEqual(dropDays('2026-10-16', 6), d)
  assert.ok(d.at(-1).free > d[0].free) // a későbbi napokon több a hely
})

test('belefér: üres munkalap nem, szombatra csak rövid munka', () => {
  assert.equal(fits({ free: 200, saturday: false }, 0), false)
  assert.equal(fits({ free: 200, saturday: false }, 180), true)
  assert.equal(fits({ free: 100, saturday: false }, 180), false)
  assert.equal(fits({ free: 300, saturday: true }, 90), false)
  assert.equal(fits({ free: 300, saturday: true }, 45), true)
})
