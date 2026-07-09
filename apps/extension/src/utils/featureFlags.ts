/**
 * In-repo feature flags — no third-party service, no remote config. Flip a value
 * here to turn a feature on/off everywhere it's checked, e.g. as a kill-switch
 * for something still settling in, without shipping a new build path.
 *
 * Distinct from `entitlements.ts`: a flag gates whether a feature exists *at all*
 * in this build, regardless of plan; an entitlement gates whether the current
 * plan unlocks a feature that does exist. Check a flag first — a disabled
 * feature has no entitlement to speak of.
 */

export const FEATURE_FLAGS = {
  /** Side panel field mapper (page scan, AI-assisted mapping, snapshots). */
  aiMapping: true,
  /** User-defined interaction recipes (Options tab + the fill engine's recipe pass). */
  recipes: true,
} as const

export type FeatureFlag = keyof typeof FEATURE_FLAGS

/** Returns true when `flag` is turned on. */
export const isFeatureEnabled = (flag: FeatureFlag): boolean => FEATURE_FLAGS[flag]
