import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { clampQty, fitsDiet, menuItems, orderLines, orderTotal, phoneOk, pickupSlots, shopStatus, validateOrder } from './order.js'
import { SEED } from './data.js'

// 2026-10-13 is a Tuesday.
const at = (h, m, day = 13) => new Date(2026, 9, day, h, m)

describe('pickupSlots', () => {
  it('offers the whole day before opening, every quarter hour up to 14:45', () => {
    const slots = pickupSlots(at(8, 0))
    assert.equal(slots[0], '11:00')
    assert.equal(slots.at(-1), '14:45')
    assert.equal(slots.length, 16)
  })

  it('never offers a time sooner than the kitchen can cook', () => {
    // 12:31 + 20 minutes = 12:51, so the first quarter is 13:00
    assert.equal(pickupSlots(at(12, 31))[0], '13:00')
    assert.equal(pickupSlots(at(12, 25))[0], '12:45')
  })

  it('offers nothing after the last pickup and nothing at the weekend', () => {
    assert.deepEqual(pickupSlots(at(14, 40)), [])
    assert.deepEqual(pickupSlots(at(9, 0, 17)), []) // Saturday
  })
})

describe('order lines and total', () => {
  it('turns the board into lines and sums only what was picked', () => {
    const items = menuItems(SEED[2])
    assert.deepEqual(items.map((i) => i.id), ['soup', 'main-0', 'main-1', 'dessert'])
    const lines = orderLines(items, { soup: 2, 'main-1': 1, dessert: 0 })
    assert.equal(lines.length, 2)
    assert.equal(orderTotal(lines), 2 * 990 + 2590)
    assert.deepEqual(menuItems({ closed: true }), [])
  })

  it('keeps quantities between 0 and 9', () => {
    assert.equal(clampQty(-3), 0)
    assert.equal(clampQty(14), 9)
    assert.equal(clampQty('abc'), 0)
  })
})

describe('validateOrder', () => {
  it('accepts Hungarian numbers with or without spaces', () => {
    assert.equal(phoneOk('06 30 123 4567'), true)
    assert.equal(phoneOk('+36301234567'), true)
    assert.equal(phoneOk('06 62 555 0142'), true)
    assert.equal(phoneOk('123'), false)
  })

  it('names every missing field', () => {
    const errors = validateOrder({ lines: [], slot: '09:00', name: ' ', phone: 'x' }, ['11:00'])
    assert.deepEqual(Object.keys(errors).sort(), ['items', 'name', 'phone', 'slot'])
    const ok = validateOrder({ lines: [{ qty: 1 }], slot: '11:00', name: 'Kiss Anna', phone: '06 30 123 4567' }, ['11:00'])
    assert.deepEqual(ok, {})
  })
})

describe('shopStatus', () => {
  const at = (iso) => new Date(iso)
  it('is open on a weekday between 11 and 15', () => {
    assert.deepEqual(shopStatus(at('2026-10-13T12:30:00')), { open: true, text: 'Nyitva, 15:00-ig' })
  })
  it('says when it opens later today, tomorrow, or on Monday', () => {
    assert.equal(shopStatus(at('2026-10-13T08:00:00')).text, 'Ma 11:00-kor nyitunk')
    assert.equal(shopStatus(at('2026-10-13T16:00:00')).text, 'Zárva, holnap 11:00-kor nyitunk')
    assert.equal(shopStatus(at('2026-10-16T16:00:00')).text, 'Zárva, hétfőn 11:00-kor nyitunk')
    assert.equal(shopStatus(at('2026-10-18T12:00:00')).open, false)
  })
})

describe('fitsDiet', () => {
  it('rules out a dish with an avoided allergen', () => {
    assert.equal(fitsDiet(['G', 'T'], ['G']), false)
    assert.equal(fitsDiet(['L'], ['G']), true)
    assert.equal(fitsDiet(undefined, ['G']), true)
  })
})
