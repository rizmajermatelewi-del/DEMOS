import { describe, expect, it } from 'vitest'
import { normalizePlate } from './data.js'

describe('normalizePlate', () => {
  it('accepts the old three-letter plate with or without a dash', () => {
    expect(normalizePlate('abc123')).toBe('ABC-123')
    expect(normalizePlate(' KRM-418 ')).toBe('KRM-418')
  })

  it('accepts the new four-letter plate in any spacing', () => {
    expect(normalizePlate('aa bb-123')).toBe('AA BB-123')
    expect(normalizePlate('AABB123')).toBe('AA BB-123')
  })

  it('rejects anything else', () => {
    expect(normalizePlate('')).toBeNull()
    expect(normalizePlate('AB-12')).toBeNull()
    expect(normalizePlate('ABCDE-123')).toBeNull()
    expect(normalizePlate(null)).toBeNull()
  })
})
