import { describe, expect, it } from 'vitest'

import { EMPTY_FIELD_TARGET, fieldTargetSchema, fieldTargetsSchema } from '@/components/Options/fieldTargets'

describe('fieldTargetSchema', () => {
  const valid = { attribute: 'id', operator: 'exact', match: 'email', value: 'test@example.com' }

  it('accepts a well-formed field target', () => {
    expect(fieldTargetSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects an attribute outside the allowed enum', () => {
    const result = fieldTargetSchema.safeParse({ ...valid, attribute: 'not-a-real-attribute' })
    expect(result.success).toBe(false)
  })

  it('rejects an operator outside the allowed enum', () => {
    const result = fieldTargetSchema.safeParse({ ...valid, operator: 'not-a-real-operator' })
    expect(result.success).toBe(false)
  })

  it('rejects an empty match or value', () => {
    expect(fieldTargetSchema.safeParse({ ...valid, match: '' }).success).toBe(false)
    expect(fieldTargetSchema.safeParse({ ...valid, value: '' }).success).toBe(false)
  })

  it('allows an empty value when the strategy is random', () => {
    expect(fieldTargetSchema.safeParse({ ...valid, value: '', valueStrategy: 'random' }).success).toBe(true)
    expect(
      fieldTargetSchema.safeParse({ ...valid, value: '', valueStrategy: 'random', valueType: 'email' }).success,
    ).toBe(true)
  })

  it('still requires a value for the explicit exact strategy', () => {
    expect(fieldTargetSchema.safeParse({ ...valid, value: '', valueStrategy: 'exact' }).success).toBe(false)
  })

  it('rejects an unknown strategy or value type', () => {
    expect(fieldTargetSchema.safeParse({ ...valid, valueStrategy: 'nope' }).success).toBe(false)
    expect(fieldTargetSchema.safeParse({ ...valid, valueStrategy: 'random', valueType: 'nope' }).success).toBe(false)
  })
})

describe('fieldTargetsSchema', () => {
  it('requires at least one field target', () => {
    expect(fieldTargetsSchema.safeParse([]).success).toBe(false)
  })

  it('accepts a non-empty array of valid field targets', () => {
    const valid = { attribute: 'id', operator: 'exact', match: 'email', value: 'test@example.com' }
    expect(fieldTargetsSchema.safeParse([valid]).success).toBe(true)
  })
})

describe('EMPTY_FIELD_TARGET', () => {
  it('is not itself a valid field target (match/value required)', () => {
    expect(fieldTargetSchema.safeParse(EMPTY_FIELD_TARGET).success).toBe(false)
  })
})
