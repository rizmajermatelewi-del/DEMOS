import test from 'node:test'
import assert from 'node:assert/strict'
import { ROOMS, addDays, nightsOf, isWeekendNight, isBooked, roomFree, quote, problems, firstOpen, IFA, DOG, BREAKFAST, WEEKEND_EXTRA, EXTRA_BED } from './stay.js'

const [padlas, kandallo, kert] = ROOMS

test('dátumok: hónap- és évváltás, hétvégi éj', () => {
  assert.equal(addDays('2026-12-31', 1), '2027-01-01')
  assert.equal(addDays('2026-03-28', 2), '2026-03-30') // óraátállítás nem csúsztat
  assert.deepEqual(nightsOf('2026-10-16', 3), ['2026-10-16', '2026-10-17', '2026-10-18'])
  assert.equal(isWeekendNight('2026-10-16'), true) // péntek
  assert.equal(isWeekendNight('2026-10-18'), false) // vasárnap
})

test('foglaltság stabil, és egy foglalt éj elég, hogy a szoba ne legyen szabad', () => {
  const day = Array.from({ length: 60 }, (_, i) => addDays('2026-11-02', i)).find((d) => isBooked(1, d))
  assert.ok(day, 'két hónapban legalább egy foglalt éj')
  assert.equal(isBooked(1, day), isBooked(1, day))
  assert.equal(roomFree(1, addDays(day, -1), 2), false)
})

test('ár: hétköznap, két felnőtt', () => {
  const q = quote(kert, { arrival: '2026-11-02', nights: 2, adults: 2 }) // hétfő, kedd
  assert.equal(q.stay, 2 * kert.nightly)
  assert.equal(q.ifa, 2 * 2 * IFA)
  assert.equal(q.total, q.stay + q.ifa)
  assert.equal(q.portal, Math.round(q.stay * 1.15 / 100) * 100 + q.ifa)
  assert.ok(q.saving > 0)
})

test('ár: hétvége, pótágy, gyerek IFA nélkül, kutya, reggeli', () => {
  const q = quote(padlas, { arrival: '2026-10-16', nights: 2, adults: 2, kids: 1, breakfast: true })
  assert.equal(q.stay, 2 * padlas.nightly + 2 * WEEKEND_EXTRA + 2 * EXTRA_BED + 3 * 2 * BREAKFAST)
  assert.equal(q.ifa, 2 * 2 * IFA)
  const d = quote(kert, { arrival: '2026-11-02', nights: 3, adults: 1, dog: true })
  assert.equal(d.stay, 3 * kert.nightly + 3 * DOG)
})

test('akadályok: létszám, kutya, minimum éj, múlt, foglalt', () => {
  const ok = { arrival: '2026-11-02', nights: 2, adults: 2 }
  assert.match(problems(kandallo, { ...ok, kids: 1 }, '2026-10-16').join(), /legfeljebb 2 főt/)
  assert.match(problems(kandallo, { ...ok, dog: true }, '2026-10-16').join(), /Kertre néző/)
  assert.match(problems(kert, { ...ok, nights: 1 }, '2026-10-16').join(), /Legalább 2 éjszakára/)
  assert.match(problems(kert, { ...ok, arrival: '2026-10-01' }, '2026-10-16').join(), /múltban/)
  const busy = Array.from({ length: 90 }, (_, i) => addDays('2026-11-02', i)).find((d) => isBooked(3, d))
  assert.match(problems(kert, { ...ok, arrival: busy }, '2026-10-16').join(), /foglalt/)
})

test('firstOpen: olyan napot ad, ahol tényleg van szabad szoba', () => {
  const day = firstOpen('2026-10-16', 2, 2)
  assert.ok(ROOMS.filter((r) => roomFree(r.id, day, 2)).length >= 2)
})
