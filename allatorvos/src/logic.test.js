import test from 'node:test'
import assert from 'node:assert/strict'
import { schedule, ageText, clinicState, addDays } from './logic.js'

test('kölyökkutya: időrend, kötelező chip és veszettség, esedékes 30 napon belül', () => {
  const s = schedule('kutya', '2026-08-20', '2026-10-16')
  assert.equal(s[0].id, 'komb1')
  assert.equal(s[0].date, '2026-10-01')
  assert.equal(s[0].status, 'kesik') // nincs bejelölve, a dátum elmúlt
  const chip = s.find((v) => v.id === 'chip')
  assert.equal(chip.mandatory, true)
  assert.equal(chip.status, 'esedekes') // 84. nap: nov. 12., 27 nap múlva
  assert.equal(s.find((v) => v.id === 'kombev').status, 'kesobb')
  for (let i = 1; i < s.length; i++) assert.ok(s[i - 1].date <= s[i].date)
})

test('kész tételek; az évenkénti a következő esedékességre ugrik', () => {
  const s = schedule('kutya', '2024-03-01', '2026-10-16', ['komb1', 'komb2', 'komb3', 'chip', 'veszettseg', 'kombev'])
  assert.equal(s.find((v) => v.id === 'chip').status, 'kesz')
  const rabies = s.find((v) => v.id === 'veszettseg')
  assert.ok(rabies.date > '2026-10-16')
  assert.ok(rabies.inDays <= 365)
})

test('macska: nincs kötelező chip, a veszettség ajánlott', () => {
  const s = schedule('macska', '2026-09-01', '2026-10-16')
  assert.equal(s.some((v) => v.id === 'chip'), false)
  assert.equal(s.find((v) => v.id === 'veszettseg').mandatory, undefined)
})

test('érvénytelen: jövőbeli születés, ismeretlen faj', () => {
  assert.deepEqual(schedule('kutya', '2026-12-01', '2026-10-16'), [])
  assert.deepEqual(schedule('papagaj', '2026-01-01', '2026-10-16'), [])
})

test('életkor és dátum', () => {
  assert.equal(ageText('2026-09-01', '2026-10-16'), '6 hetes')
  assert.equal(ageText('2026-03-01', '2026-10-16'), '7 hónapos')
  assert.equal(ageText('2020-03-01', '2026-10-16'), '6 éves')
  assert.equal(addDays('2026-12-31', 1), '2027-01-01')
})

test('rendelés: délelőtt nyitva, ebédszünetben délután nyit, vasárnap hétfőn', () => {
  assert.deepEqual(clinicState(new Date(2026, 9, 14, 10, 0)), { open: true, until: 720 })
  assert.deepEqual(clinicState(new Date(2026, 9, 14, 13, 0)), { open: false, inDays: 0, opens: 900 })
  assert.deepEqual(clinicState(new Date(2026, 9, 18, 10, 0)), { open: false, inDays: 1, opens: 480 })
})
