import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { problems } from './validate.js'

describe('problems', () => {
  it('asks for every missing field', () => {
    const found = problems({ name: ' ', phone: '123', city: '', job: 'rövid' })
    assert.equal(found.name, 'Írd be a neved.')
    assert.equal(found.phone, 'Egy hívható szám kell.')
    assert.equal(found.city, 'Melyik település?')
    assert.equal(found.job, 'Egy mondat a munkáról elég.')
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
})
