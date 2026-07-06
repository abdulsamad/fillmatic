import { beforeEach, describe, expect, it } from 'vitest'

import { useUserRulesStore } from '@/store/user-rules'
import { type UserRule } from '@/utils/user-rules'

const makeRule = (overrides: Partial<UserRule> = {}): UserRule => ({
  id: 'r1',
  siteMatcher: 'example.com',
  rules: [],
  ...overrides,
})

beforeEach(() => {
  useUserRulesStore.setState({ userRules: [] })
})

describe('useUserRulesStore', () => {
  it('appends a new rule via addUserRule', () => {
    const rule = makeRule()
    useUserRulesStore.getState().addUserRule(rule)

    expect(useUserRulesStore.getState().userRules).toEqual([rule])
  })

  it('replaces the matching rule by id via updateUserRule', () => {
    const r1 = makeRule({ id: 'r1', siteMatcher: 'a.com' })
    const r2 = makeRule({ id: 'r2', siteMatcher: 'b.com' })
    useUserRulesStore.setState({ userRules: [r1, r2] })

    const updated = { ...r1, siteMatcher: 'updated.com' }
    useUserRulesStore.getState().updateUserRule(updated)

    expect(useUserRulesStore.getState().userRules).toEqual([updated, r2])
  })

  it('removes only the rule matching the given id via deleteUserRule', () => {
    const r1 = makeRule({ id: 'r1' })
    const r2 = makeRule({ id: 'r2' })
    useUserRulesStore.setState({ userRules: [r1, r2] })

    useUserRulesStore.getState().deleteUserRule('r1')

    expect(useUserRulesStore.getState().userRules).toEqual([r2])
  })
})
