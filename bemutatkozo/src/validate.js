export function problems(data) {
  const next = {}
  if (String(data.name ?? '').trim().length < 2) next.name = 'Írd be a neved.'
  const digits = String(data.phone ?? '').replace(/\D/g, '')
  if (digits.length < 8) next.phone = 'Egy hívható szám kell.'
  if (String(data.city ?? '').trim().length < 2) next.city = 'Melyik település?'
  if (String(data.job ?? '').trim().length < 8) next.job = 'Egy mondat a munkáról elég.'
  return next
}
