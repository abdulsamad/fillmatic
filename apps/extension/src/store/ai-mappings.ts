import { create } from 'zustand'
import { persist, createJSONStorage, devtools } from 'zustand/middleware'

import { AI_MAPPINGS_STORAGE_KEY, type MappingSnapshot } from '@/utils/ai-mappings'

interface AiMappingsStore {
  snapshots: MappingSnapshot[]
  addSnapshot: (snapshot: MappingSnapshot) => void
  updateSnapshot: (snapshot: MappingSnapshot) => void
  deleteSnapshot: (id: string) => void
}

export const useAiMappingsStore = create(
  devtools(
    persist<AiMappingsStore>(
      (set) => ({
        snapshots: [],

        addSnapshot: (snapshot) => set((state) => ({ snapshots: [...state.snapshots, snapshot] })),
        updateSnapshot: (snapshot) =>
          set((state) => ({ snapshots: state.snapshots.map((s) => (s.id === snapshot.id ? snapshot : s)) })),
        deleteSnapshot: (id) => set((state) => ({ snapshots: state.snapshots.filter((s) => s.id !== id) })),
      }),
      {
        name: AI_MAPPINGS_STORAGE_KEY,
        storage: createJSONStorage(() => ({
          getItem: async (name: string) => {
            const value = await chrome.storage.local.get(name)
            return (value[name] as string) || null
          },
          setItem: async (name: string, value: string) => {
            await chrome.storage.local.set({ [name]: value })
          },
          removeItem: async (name: string) => {
            await chrome.storage.local.remove(name)
          },
        })),
      },
    ),
  ),
)
