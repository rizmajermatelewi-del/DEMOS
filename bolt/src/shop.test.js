import { beforeEach, describe, expect, it } from 'vitest'
import { PRODUCTS, filterProducts, fold, holdUntil, openLabel, openState, stockLevel } from './shop.js'
import { closeHold, createHold, freeOf, loadHolds, loadStock, setStock } from './storage.js'

// Friday 2026-09-25, Saturday 26 (7-13), Sunday 27 closed, Monday 28.
const at = (s) => new Date(`2026-09-${s}`)

describe('openState', () => {
  it('is open during hours and says when it closes', () => {
    expect(openLabel(openState(at('25T10:15:00')))).toBe('Nyitva · 18:00-ig')
    expect(openLabel(openState(at('26T12:59:00')))).toBe('Nyitva · 13:00-ig')
  })

  it('before opening points to later today', () => {
    expect(openLabel(openState(at('25T06:30:00')))).toBe('Zárva · ma 7:00-kor nyit')
  })

  it('after Saturday closing skips Sunday', () => {
    expect(openLabel(openState(at('26T13:00:00')))).toBe('Zárva · hétfő 7:00-kor nyit')
    expect(openLabel(openState(at('25T18:00:00')))).toBe('Zárva · holnap 7:00-kor nyit')
  })
})

describe('holdUntil', () => {
  it('keeps it until the next open day closes', () => {
    expect(holdUntil(at('25T10:00:00'))).toMatchObject({ iso: '2026-09-26', closesAt: 13 * 60 })
    expect(holdUntil(at('26T09:00:00'))).toMatchObject({ iso: '2026-09-28', closesAt: 18 * 60 })
  })
})

describe('search', () => {
  const all = { available: () => 1 }
  it('ignores accents and case, and needs every word', () => {
    expect(fold('Csavarhúzó ŐŰ')).toBe('csavarhuzo ou')
    expect(filterProducts(PRODUCTS, { ...all, query: 'csavarhuzo' }).map((p) => p.id)).toEqual(['csavarhuzo'])
    expect(filterProducts(PRODUCTS, { ...all, query: 'led e27' }).map((p) => p.id)).toEqual(['izzo'])
    expect(filterProducts(PRODUCTS, { ...all, query: 'led fűrész' })).toEqual([])
  })

  it('filters by category and by stock', () => {
    const festek = filterProducts(PRODUCTS, { ...all, cat: 'festek' })
    expect(festek.every((p) => p.cat === 'festek')).toBe(true)
    const onShelf = filterProducts(PRODUCTS, { available: (p) => p.stock, inStockOnly: true })
    expect(onShelf.some((p) => p.stock === 0)).toBe(false)
  })

  it('grades stock', () => {
    expect([0, 1, 5, 6].map(stockLevel)).toEqual(['none', 'low', 'low', 'ok'])
  })
})

describe('holds', () => {
  const memory = new Map()
  beforeEach(() => {
    memory.clear()
    globalThis.localStorage = { getItem: (k) => (memory.has(k) ? memory.get(k) : null), setItem: (k, v) => memory.set(k, String(v)) }
  })
  const dubel = PRODUCTS.find((p) => p.id === 'dubel') // 3 on the shelf
  const draft = (qty) => ({ productId: 'dubel', qty, name: 'Béla', phone: '+36301112233' })

  it('puts aside what is free and refuses more than is left', () => {
    expect(createHold(draft(2), at('25T10:00:00')).ok).toBe(true)
    expect(freeOf(dubel, loadStock(), loadHolds())).toBe(1)
    expect(createHold(draft(2), at('25T10:00:00'))).toMatchObject({ ok: false, free: 1 })
    expect(createHold(draft(0)).ok).toBe(false)
  })

  it('takes a picked-up hold off the shelf, a cancelled one back', () => {
    const a = createHold(draft(2)).hold
    const b = createHold(draft(1)).hold
    closeHold(a.id, true)
    expect(loadStock().dubel).toBe(1)
    closeHold(b.id, false)
    expect(freeOf(dubel, loadStock(), loadHolds())).toBe(1)
  })

  it('never lets stock go negative and survives bad storage', () => {
    expect(setStock('dubel', -4).dubel).toBe(0)
    memory.set('barany-holds-v1', '{')
    expect(loadHolds()).toEqual([])
  })
})
