// Csörlő Autómentés: minden szám ebből a modulból jön, így tesztelhető.
// A díjak és a kilométerkövek koordinátái mintaadatok (bemutató projekt).

export const BASE = { name: 'Cegléd, telephely', lat: 47.1749, lng: 19.7997 }
export const PHONE = '+36305550177'
export const PRICES = { callout: 18000, perKm: 450, nightPct: 25 }

const R = 6371 // km
const rad = (d) => (d * Math.PI) / 180

/** Légvonalbeli távolság km-ben. Útvonalra 1,25-ös szorzóval becsülünk. */
export function haversineKm(a, b) {
  const dLat = rad(b.lat - a.lat)
  const dLng = rad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

export const roadKm = (a, b) => Math.round(haversineKm(a, b) * 1.25)

/** Kiérkezés: 10 perc indulás + 70 km/h átlag, felfelé 5 percre kerekítve. */
export function etaMinutes(km) {
  return Math.ceil((10 + (km / 70) * 60) / 5) * 5
}

const isNight = (d) => d.getHours() >= 22 || d.getHours() < 6

/** Díjsáv: kiszállás + (odaút + vontatás) km-díj, éjjel +25%, felfelé 500-ra. */
export function priceRange({ toCarKm, towKm = 0, at = new Date() }) {
  let sum = PRICES.callout + (toCarKm + towKm) * PRICES.perKm
  if (isNight(at)) sum *= 1 + PRICES.nightPct / 100
  const low = Math.ceil(sum / 500) * 500
  const high = Math.ceil((sum * 1.15) / 500) * 500
  return { low, high, night: isNight(at) }
}

export const mapsLink = ({ lat, lng }) => `https://maps.google.com/?q=${lat.toFixed(5)},${lng.toFixed(5)}`

export function shareText({ lat, lng, accuracy, note }) {
  const acc = accuracy ? ` (pontosság ±${Math.round(accuracy)} m)` : ''
  const extra = note?.trim() ? ` ${note.trim()}` : ''
  return `Autómentést kérek. Itt állok: ${mapsLink({ lat, lng })}${acc}.${extra}`
}

export const smsLink = (text) => `sms:${PHONE}?body=${encodeURIComponent(text)}`
export const waLink = (text) => `https://wa.me/${PHONE.replace('+', '')}?text=${encodeURIComponent(text)}`

// Kilométerkövek: néhány ismert pont autópályánként, köztük lineárisan becsülünk.
// Nagyjából valós helyek, de bemutató pontosságúak.
export const MOTORWAYS = {
  M5: [[15, 47.395, 19.196], [30, 47.288, 19.268], [46, 47.162, 19.394], [62, 47.03, 19.53], [86, 46.935, 19.72], [120, 46.73, 19.88]],
  M4: [[20, 47.388, 19.343], [30, 47.343, 19.468], [50, 47.244, 19.63], [66, 47.183, 19.818]],
}

/** Kilométerkőből koordináta. A szakaszon kívüli km-re null. */
export function fromKmPost(road, km) {
  const pts = MOTORWAYS[road]
  if (!pts || !Number.isFinite(km)) return null
  if (km < pts[0][0] || km > pts.at(-1)[0]) return null
  for (let i = 0; i < pts.length - 1; i++) {
    const [k1, la1, lo1] = pts[i]
    const [k2, la2, lo2] = pts[i + 1]
    if (km >= k1 && km <= k2) {
      const t = (km - k1) / (k2 - k1)
      return { lat: la1 + (la2 - la1) * t, lng: lo1 + (lo2 - lo1) * t }
    }
  }
  return null
}

export const kmRange = (road) => [MOTORWAYS[road][0][0], MOTORWAYS[road].at(-1)[0]]

export const forint = (n) => `${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0')}\u00a0Ft`
