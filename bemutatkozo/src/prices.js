/** The multimeter dial: one position per job, read out on the LCD. Prices are invented. */
export const JOBS = [
  { id: 'konnektor', label: 'Konnektor', price: 6000, unit: 'db', time: 'kb. 20 perc darabja' },
  { id: 'lampa', label: 'Lámpa', price: 8000, unit: 'db', time: 'kb. fél óra darabja' },
  { id: 'fi', label: 'FI-relé', price: 28000, unit: null, time: 'kb. egy óra, anyaggal' },
  { id: 'hiba', label: 'Hiba', price: 15000, unit: null, time: 'kiszállás és az első óra' },
  { id: 'tabla', label: 'Tábla', price: 120000, unit: null, time: 'egy nap, a régi elszállításával' },
  { id: 'felujitas', label: 'Felújítás', price: 12000, unit: 'm²', time: 'egy 50 m²-es lakás 4-5 nap' },
]

/** 6000 -> "6 000" with a non-breaking space, the way a price is printed in Hungarian. */
export function forint(n) {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0')
}

/** What the LCD shows for a dial position. Unknown or empty means the meter is off. */
export function readout(id) {
  const job = JOBS.find((j) => j.id === id)
  if (!job) return { value: 'OFF', unit: 'Tekerd a gombot egy munkára', time: '' }
  return { value: forint(job.price), unit: job.unit ? `Ft-tól / ${job.unit}` : 'Ft-tól', time: job.time }
}

/** Knob angle for position i of n, spread over the top 240 degrees of the dial. */
export function angle(i, n = JOBS.length) {
  return -120 + (240 / (n - 1)) * i
}
