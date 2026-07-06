import { describe, expect, it } from 'vitest'

import { formSchema, TYPING_SPEED_MAX, TYPING_SPEED_MIN } from '@/components/Options/formSchema'

const valid = {
  typingEffect: true,
  typingSpeed: 400,
  forceAutofill: false,
  samePasswordEverytime: false,
  commonPassword: 'pass@1234',
  ignoredFields: 'captcha',
  tempEmailProvider: 'mailinator.com' as const,
  alwaysCheckFields: 'terms, conditions',
}

describe('formSchema', () => {
  it('accepts a well-formed config', () => {
    expect(formSchema.safeParse(valid).success).toBe(true)
  })

  it('enforces the typingSpeed lower bound', () => {
    expect(formSchema.safeParse({ ...valid, typingSpeed: TYPING_SPEED_MIN }).success).toBe(true)
    expect(formSchema.safeParse({ ...valid, typingSpeed: TYPING_SPEED_MIN - 1 }).success).toBe(false)
  })

  it('enforces the typingSpeed upper bound', () => {
    expect(formSchema.safeParse({ ...valid, typingSpeed: TYPING_SPEED_MAX }).success).toBe(true)
    expect(formSchema.safeParse({ ...valid, typingSpeed: TYPING_SPEED_MAX + 1 }).success).toBe(false)
  })

  it('enforces commonPassword min/max length', () => {
    expect(formSchema.safeParse({ ...valid, commonPassword: '1234567' }).success).toBe(false)
    expect(formSchema.safeParse({ ...valid, commonPassword: 'a'.repeat(257) }).success).toBe(false)
    expect(formSchema.safeParse({ ...valid, commonPassword: '12345678' }).success).toBe(true)
  })

  it('rejects an unrecognized tempEmailProvider', () => {
    expect(formSchema.safeParse({ ...valid, tempEmailProvider: 'not-a-provider' }).success).toBe(false)
  })

  describe('ignoredFields refine', () => {
    it('allows an empty string', () => {
      expect(formSchema.safeParse({ ...valid, ignoredFields: '' }).success).toBe(true)
    })

    it('allows a comma-separated list of non-empty trimmed segments', () => {
      expect(formSchema.safeParse({ ...valid, ignoredFields: 'captcha, otp' }).success).toBe(true)
    })

    it('rejects a list containing an empty segment', () => {
      expect(formSchema.safeParse({ ...valid, ignoredFields: 'captcha,,otp' }).success).toBe(false)
    })

    it('rejects a segment that is only whitespace', () => {
      expect(formSchema.safeParse({ ...valid, ignoredFields: 'captcha,   ,otp' }).success).toBe(false)
    })
  })

  describe('alwaysCheckFields refine', () => {
    it('allows an empty string', () => {
      expect(formSchema.safeParse({ ...valid, alwaysCheckFields: '' }).success).toBe(true)
    })

    it('rejects a list containing an empty segment', () => {
      expect(formSchema.safeParse({ ...valid, alwaysCheckFields: 'terms,,privacy' }).success).toBe(false)
    })
  })
})
