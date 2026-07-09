import { describe, expect, it } from 'vitest'

import { FEATURE_FLAGS, isFeatureEnabled } from '@/utils/featureFlags'

describe('isFeatureEnabled', () => {
  it('reflects the value in FEATURE_FLAGS for each known flag', () => {
    for (const flag of Object.keys(FEATURE_FLAGS) as (keyof typeof FEATURE_FLAGS)[]) {
      expect(isFeatureEnabled(flag)).toBe(FEATURE_FLAGS[flag])
    }
  })
})
