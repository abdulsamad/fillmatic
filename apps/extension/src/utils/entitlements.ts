/**
 * Feature gating seam.
 *
 * For now everything is unlocked via a single hardcoded Premium plan. When auth/billing
 * lands, replace `currentPlan` with a value resolved from server-side entitlements
 * (e.g. an `entitlements` store hydrated in the background worker). Consumers should
 * only ever call `can()` / `withinLimit()` so the swap stays a one-liner here.
 */

/** Gateable feature keys. Add a key here when a feature should be plan-gated. */
export type Feature = 'profiles' | 'fieldRules' | 'actions' | 'aiMapping' | 'recipes'

/** Resources that can have a per-plan count cap. */
export type LimitKey = 'profiles' | 'fieldRules' | 'actions' | 'aiMapping' | 'recipes'

export type Plan = {
  id: string
  name: string
  /** Features this plan unlocks. '*' unlocks everything. */
  features: Feature[] | '*'
  /** Per-resource caps. A missing key means unlimited. */
  limits: Partial<Record<LimitKey, number>>
}

export const PREMIUM_PLAN: Plan = {
  id: 'premium',
  name: 'Premium',
  features: '*',
  limits: {}, // unlimited
}

/** The user's current plan. Hardcoded to Premium (all features) until billing exists. */
export const currentPlan: Plan = PREMIUM_PLAN

/** Returns true when the current plan unlocks the given feature. */
export const can = (feature: Feature): boolean => currentPlan.features === '*' || currentPlan.features.includes(feature)

/** Returns true when adding one more `resource` stays within the current plan's limit. */
export const withinLimit = (resource: LimitKey, currentCount: number): boolean => {
  const limit = currentPlan.limits[resource]
  return limit === undefined || currentCount < limit
}
