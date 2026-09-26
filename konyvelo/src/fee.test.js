import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { feeLines, ft, nextDeadlines } from './fee.js'

describe('feeLines', () => {
  it('charges only the base under the included documents', () => {
    assert.deepEqual(feeLines({ form: 'atalany', docs: 20 }).total, 16000)
  })

  it('adds documents over 20, payroll and the VAT return', () => {
    const { lines, total } = feeLines({ form: 'kft', docs: 60, employees: 3, vat: true })
    assert.deepEqual(lines.map((l) => l.key), ['base', 'docs', 'emp', 'vat'])
    assert.equal(total, 42000 + 40 * 250 + 3 * 6000 + 8000)
  })

  it('falls back to the first form for an unknown one', () => {
    assert.equal(feeLines({ form: 'x' }).total, 16000)
  })
})

describe('ft', () => {
  it('groups thousands', () => assert.equal(ft(1234567), '1 234 567'))
})

describe('nextDeadlines', () => {
  it('lists the 12th before the 20th', () => {
    const [a, b] = nextDeadlines(new Date('2026-10-01T09:00:00'))
    assert.equal(a.label, 'Járulékbevallás és befizetés')
    assert.equal(a.date.getDate(), 12)
    assert.equal(a.days, 11)
    assert.equal(b.date.getDate(), 20)
  })

  it('moves a weekend due date to Monday', () => {
    // 2026-09-12 is a Saturday
    const [a] = nextDeadlines(new Date('2026-09-10T09:00:00'))
    assert.equal(a.date.getDate(), 14)
  })

  it('counts today as zero days', () => {
    const [a] = nextDeadlines(new Date('2026-10-12T15:00:00'))
    assert.equal(a.days, 0)
  })

  it('includes the May annual returns', () => {
    const labels = nextDeadlines(new Date('2026-05-15T09:00:00'), 4).map((d) => d.label)
    assert.ok(labels.includes('Egyéni vállalkozók szja-bevallása'))
    assert.ok(labels.includes('Beszámoló és társasági adó'))
  })
})

import { contactProblems } from './fee.js'

describe('contactProblems', () => {
  it('needs a name and a way to reply', () => {
    assert.deepEqual(Object.keys(contactProblems({ name: '', contact: 'abc' })), ['name', 'contact'])
  })
  it('accepts an e-mail or a phone number', () => {
    assert.deepEqual(contactProblems({ name: 'Varga Edit', contact: 'edit@pelda.hu' }), {})
    assert.deepEqual(contactProblems({ name: 'Varga Edit', contact: '+36 20 431 7702' }), {})
  })
})
