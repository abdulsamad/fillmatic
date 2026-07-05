import { afterEach, describe, expect, it } from 'vitest'

import { can, currentPlan, withinLimit } from '@/utils/entitlements'

const originalFeatures = currentPlan.features
const originalLimits = { ...currentPlan.limits }

afterEach(() => {
  currentPlan.features = originalFeatures
  currentPlan.limits = { ...originalLimits }
})

describe('can', () => {
  it('unlocks every feature when the plan features are "*"', () => {
    currentPlan.features = '*'

    expect(can('profiles')).toBe(true)
    expect(can('actions')).toBe(true)
  })

  it('unlocks only the features listed when the plan features are an array', () => {
    currentPlan.features = ['profiles']

    expect(can('profiles')).toBe(true)
    expect(can('actions')).toBe(false)
  })
})

describe('withinLimit', () => {
  it('is always within limit when the resource has no configured cap', () => {
    currentPlan.limits = {}

    expect(withinLimit('profiles', 0)).toBe(true)
    expect(withinLimit('profiles', 1000)).toBe(true)
  })

  it('stays within limit strictly below the configured cap', () => {
    currentPlan.limits = { profiles: 2 }

    expect(withinLimit('profiles', 1)).toBe(true)
  })

  it('is not within limit at or above the configured cap', () => {
    currentPlan.limits = { profiles: 2 }

    expect(withinLimit('profiles', 2)).toBe(false)
    expect(withinLimit('profiles', 3)).toBe(false)
  })
})
