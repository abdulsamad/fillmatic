import { describe, expect, it, vi } from 'vitest'

import {
  getAiMappingsFromStorage,
  snapshotsForUrl,
  type MappingSnapshot,
} from '@/utils/ai-mappings'
import { useAiMappingsStore } from '@/store/ai-mappings'

const snapshot = (overrides: Partial<MappingSnapshot> = {}): MappingSnapshot => ({
  id: 'snap-1',
  name: 'Checkout',
  siteMatcher: 'example.com',
  createdAt: '2026-07-09T00:00:00.000Z',
  fields: [{ attribute: 'id', operator: 'exact', match: 'email', value: '', valueStrategy: 'random', valueType: 'email' }],
  ...overrides,
})

describe('snapshotsForUrl', () => {
  it('matches by URL substring and ignores snapshots with an empty matcher', () => {
    const match = snapshot()
    const other = snapshot({ id: 'snap-2', siteMatcher: 'other.dev' })
    const empty = snapshot({ id: 'snap-3', siteMatcher: '' })

    expect(snapshotsForUrl([match, other, empty], 'https://app.example.com/checkout')).toEqual([match])
  })
})

describe('useAiMappingsStore', () => {
  it('adds, updates and deletes snapshots', () => {
    useAiMappingsStore.setState({ snapshots: [] })
    const { addSnapshot, updateSnapshot, deleteSnapshot } = useAiMappingsStore.getState()

    addSnapshot(snapshot())
    expect(useAiMappingsStore.getState().snapshots).toHaveLength(1)

    updateSnapshot(snapshot({ name: 'Renamed' }))
    expect(useAiMappingsStore.getState().snapshots[0].name).toBe('Renamed')

    deleteSnapshot('snap-1')
    expect(useAiMappingsStore.getState().snapshots).toEqual([])
  })
})

// chrome.storage.local.get is overloaded (callback vs. Promise forms); cast to the
// Promise shape we use, mirroring the asAsyncMock pattern in Popup.test.tsx.
type AsyncMock<T> = { mockResolvedValueOnce: (value: T) => void }
const asAsyncMock = <T,>(fn: unknown) => fn as AsyncMock<T>

describe('getAiMappingsFromStorage', () => {
  it('reads persisted snapshots from chrome.storage.local', async () => {
    asAsyncMock<Record<string, string>>(chrome.storage.local.get).mockResolvedValueOnce({
      'ai-mappings': JSON.stringify({ state: { snapshots: [snapshot()] }, version: 0 }),
    })

    await expect(getAiMappingsFromStorage()).resolves.toEqual([snapshot()])
  })

  it('returns [] when nothing is stored or the payload is malformed', async () => {
    asAsyncMock<Record<string, string>>(chrome.storage.local.get).mockResolvedValueOnce({})
    await expect(getAiMappingsFromStorage()).resolves.toEqual([])

    asAsyncMock<Record<string, string>>(chrome.storage.local.get).mockResolvedValueOnce({ 'ai-mappings': 'not json' })
    await expect(getAiMappingsFromStorage()).resolves.toEqual([])
  })
})
