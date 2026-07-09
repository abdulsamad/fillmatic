import { getStoreFromStorage } from '.'
import type { FieldTarget } from './actions'

export const AI_MAPPINGS_STORAGE_KEY = 'ai-mappings'

/**
 * A saved field map for a site, produced in the side panel mapper (AI-prefilled
 * when Gemini Nano is available, heuristics-only otherwise — the saved shape is
 * identical, so snapshots fill deterministically on any machine). Consumed by
 * generateValue as a priority tier between the active Action and profile rules.
 */
export type MappingSnapshot = {
  id: string
  name: string
  /** URL substring, same semantics as Field Rules' siteMatcher. */
  siteMatcher: string
  createdAt: string
  fields: FieldTarget[]
}

export const snapshotsForUrl = (snapshots: MappingSnapshot[], url: string): MappingSnapshot[] =>
  snapshots.filter((snapshot) => snapshot.siteMatcher && url.includes(snapshot.siteMatcher))

/** Storage-side reader mirroring getActionsFromStorage, for contexts without a hydrated store. */
export const getAiMappingsFromStorage = async (): Promise<MappingSnapshot[]> => {
  try {
    const state = await getStoreFromStorage(AI_MAPPINGS_STORAGE_KEY)
    return (state?.snapshots as MappingSnapshot[]) ?? []
  } catch {
    return []
  }
}
