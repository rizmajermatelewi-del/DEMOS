import test from 'node:test'
import assert from 'node:assert/strict'
import { BASE, haversineKm, roadKm, etaMinutes, priceRange, mapsLink, shareText, smsLink, waLink, fromKmPost, kmRange, forint } from './logic.js'

test('távolság: Cegléd–Kecskemét légvonalban kb. 30 km', () => {
  const kecskemet = { lat: 46.9062, lng: 19.6913 }
  const d = haversineKm(BASE, kecskemet)
  assert.ok(d > 28 && d < 32, String(d)) // valós légvonal ~30 km
  assert.equal(roadKm(BASE, BASE), 0)
})

test('kiérkezés: 0 km is legalább 10 perc, 5 percre kerekít', () => {
  assert.equal(etaMinutes(0), 10)
  assert.equal(etaMinutes(35), 40) // 10 + 30 perc
  for (const km of [1, 7, 23, 58, 140]) assert.equal(etaMinutes(km) % 5, 0)
})

test('díj: nappal kiszállás + km, éjjel +25%, 500-ra kerekítve, alsó <= felső', () => {
  const day = new Date(2026, 10, 10, 14, 0)
  const night = new Date(2026, 10, 10, 23, 30)
  const d = priceRange({ toCarKm: 20, towKm: 20, at: day })
  assert.equal(d.low, 18000 + 40 * 450) // 36 000
  assert.ok(d.high > d.low && d.high % 500 === 0 && d.low % 500 === 0)
  const n = priceRange({ toCarKm: 20, towKm: 20, at: night })
  assert.ok(n.night && n.low > d.low)
  assert.equal(priceRange({ toCarKm: 0, at: day }).low, 18000)
})

test('megosztás: térképlink 5 tizedessel, pontosság és megjegyzés a szövegben', () => {
  const p = { lat: 47.1, lng: 19.8 }
  assert.equal(mapsLink(p), 'https://maps.google.com/?q=47.10000,19.80000')
  const t = shareText({ ...p, accuracy: 23.4, note: '  piros Opel, defekt  ' })
  assert.match(t, /±23 m/)
  assert.match(t, /piros Opel, defekt$/)
  assert.ok(!shareText(p).includes('±'))
  assert.ok(smsLink(t).startsWith('sms:+36305550177?body='))
  assert.ok(waLink(t).startsWith('https://wa.me/36305550177?text='))
})

test('kilométerkő: pontokon pontos, köztük köztes, szakaszon kívül null', () => {
  assert.deepEqual(fromKmPost('M5', 30), { lat: 47.288, lng: 19.268 })
  const mid = fromKmPost('M5', 38)
  assert.ok(mid.lat < 47.288 && mid.lat > 47.162)
  assert.equal(fromKmPost('M5', 5), null)
  assert.equal(fromKmPost('M7', 30), null)
  assert.equal(fromKmPost('M4', Number.NaN), null)
  assert.deepEqual(kmRange('M4'), [20, 66])
})

test('forint: nem törő szóközzel', () => {
  assert.equal(forint(36000), '36\u00a0000\u00a0Ft')
})
