import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { phoneStatus } from './status.js'
import { problems } from './validate.js'

describe('problems', () => {
  it('asks for every missing field', () => {
    const found = problems({ name: ' ', phone: '123', city: '', job: 'rövid' })
    assert.equal(found.name, 'Írd be a neved.')
    assert.equal(found.phone, 'Egy hívható szám kell.')
    assert.equal(found.city, 'Melyik település?')
    assert.equal(found.job, 'Kapcsolj fel egy munkát a táblán, vagy írj róla egy mondatot.')
  })

  it('accepts a complete job request', () => {
    const found = problems({
      name: 'Nagy Béla',
      phone: '+36 30 555 0188',
      city: 'Debrecen',
      job: 'A konyhában nincs áram a konnektorban.',
    })
    assert.deepEqual(found, {})
  })

  it('lets a flipped breaker stand in for the job text', () => {
    const found = problems({ name: 'Nagy Béla', phone: '+36 30 555 0188', city: 'Debrecen', job: '' }, ['tabla'])
    assert.deepEqual(found, {})
  })
})

describe('phoneStatus', () => {
  it('is open on a weekday afternoon', () => {
    assert.equal(phoneStatus(new Date('2026-09-22T16:59:00')).open, true)
  })

  it('closes at 17:00 and names tomorrow', () => {
    assert.deepEqual(phoneStatus(new Date('2026-09-22T17:00:00')), { open: false, label: 'Most nem, holnap 8:00-tól' })
  })

  it('says later today before opening', () => {
    assert.equal(phoneStatus(new Date('2026-09-22T07:30:00')).label, 'Ma 8:00-tól hívható')
  })

  it('points to Monday from Friday evening and the weekend', () => {
    assert.equal(phoneStatus(new Date('2026-09-25T18:00:00')).label, 'Most nem, hétfő 8:00-tól')
    assert.equal(phoneStatus(new Date('2026-09-26T10:00:00')).label, 'Most nem, hétfő 8:00-tól')
    assert.equal(phoneStatus(new Date('2026-09-27T10:00:00')).label, 'Most nem, holnap 8:00-tól')
  })
})
