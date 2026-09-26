import { describe, expect, it } from 'vitest'
import { atMinutes, combTeeth, isoLocal, slotsForDate } from './slots.js'

const TUE = '2026-09-22'

describe('slotsForDate', () => {
  it('drops Sunday', () => {
    expect(slotsForDate('2026-09-27', 45, [], new Date('2026-09-01T08:00:00'))).toEqual([])
  })

  it('stops a service that would run past closing', () => {
    const slots = slotsForDate(TUE, 90, [], new Date('2026-09-22T08:00:00'))
    expect(slots.at(-1)).toBe(16 * 60 + 30)
    expect(slots).not.toContain(17 * 60)
  })

  it('hides a start that has already passed', () => {
    const slots = slotsForDate(TUE, 30, [], new Date('2026-09-22T12:37:00'))
    expect(slots[0]).toBeGreaterThan(12 * 60 + 30)
    expect(slots).not.toContain(9 * 60)
  })

  it('rejects a slot that overlaps a booking, including a partial overlap', () => {
    const bookings = [{ date: TUE, startMin: 10 * 60, durationMin: 45 }]
    const slots = slotsForDate(TUE, 30, bookings, new Date('2026-09-22T08:00:00'))
    expect(slots).not.toContain(10 * 60)
    expect(slots).not.toContain(10 * 60 + 30)
    expect(slots).toContain(9 * 60 + 30)
    expect(slots).toContain(11 * 60)
  })

  it('keeps a slot that starts the minute a booking ends', () => {
    const bookings = [{ date: TUE, startMin: 9 * 60, durationMin: 30 }]
    const slots = slotsForDate(TUE, 30, bookings, new Date('2026-09-22T08:00:00'))
    expect(slots).toContain(9 * 60 + 30)
  })

  it('lets a service end exactly at Saturday closing, and not a step later', () => {
    const saturday = '2026-09-26'
    const slots = slotsForDate(saturday, 60, [], new Date('2026-09-26T08:00:00'))
    expect(slots.at(-1)).toBe(13 * 60)
    expect(slots).not.toContain(13 * 60 + 30)
  })

  it('ignores a broken booking instead of throwing', () => {
    const now = new Date('2026-09-22T08:00:00')
    expect(() => slotsForDate(TUE, 30, [null, { date: TUE }, 'rossz'], now)).not.toThrow()
    expect(slotsForDate(TUE, 30, [null, { date: TUE }], now)).toContain(9 * 60)
  })

  it('does not let another day block this one', () => {
    const bookings = [{ date: '2026-09-23', startMin: 9 * 60, durationMin: 480 }]
    const slots = slotsForDate(TUE, 30, bookings, new Date('2026-09-22T08:00:00'))
    expect(slots).toContain(9 * 60)
  })
})

describe('isoLocal', () => {
  it('uses the local calendar day, not UTC', () => {
    const late = new Date(2026, 8, 22, 23, 30, 0)
    expect(isoLocal(late)).toBe('2026-09-22')
    expect(atMinutes('2026-09-22', 9 * 60).getHours()).toBe(9)
  })
})

describe('combTeeth', () => {
  it('marks each half hour as past, taken, start or free', () => {
    const now = new Date('2026-09-22T09:10:00')
    const bookings = [{ id: 'a', date: TUE, startMin: 11 * 60, durationMin: 60 }]
    const slots = slotsForDate(TUE, 90, bookings, now)
    const teeth = combTeeth(TUE, slots, bookings, now)
    const at = (h, m = 0) => teeth.find((t) => t.min === h * 60 + m).state
    expect(teeth).toHaveLength(18)
    expect(at(9)).toBe('past')
    expect(at(9, 30)).toBe('start')
    expect(at(10)).toBe('free') // 90 min from 10:00 would hit the 11:00 booking
    expect(at(11)).toBe('taken')
    expect(at(11, 30)).toBe('taken')
    expect(at(12)).toBe('start')
    expect(at(17)).toBe('free') // 90 min would run past 18:00
  })

  it('has no teeth on Sunday', () => {
    expect(combTeeth('2026-09-27', [], [])).toEqual([])
  })
})
