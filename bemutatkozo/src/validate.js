/** Field errors for the quote form. A flipped breaker counts as describing the job. */
export function problems(data, services = []) {
  const next = {}
  if (String(data.name ?? '').trim().length < 2) next.name = 'Írd be a neved.'
  const digits = String(data.phone ?? '').replace(/\D/g, '')
  if (digits.length < 8) next.phone = 'Egy hívható szám kell.'
  if (String(data.city ?? '').trim().length < 2) next.city = 'Melyik település?'
  if (services.length === 0 && String(data.job ?? '').trim().length < 8)
    next.job = 'Kapcsolj fel egy munkát a táblán, vagy írj róla egy mondatot.'
  return next
}
