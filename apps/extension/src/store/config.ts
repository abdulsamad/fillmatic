import { create } from 'zustand'
import { persist, createJSONStorage, devtools } from 'zustand/middleware'

interface ConfigStore {
  lastGeneratedPassword: string
  setLastGeneratedPassword: (bool: boolean) => void
  uniquePassword: boolean
  setUniquePassword: (bool: boolean) => void
}

export const useConfigStore = create(
  devtools(
    persist<ConfigStore>(
      (set, get) => ({
        // State
        lastGeneratedPassword: '',
        uniquePassword: false,

        // Actions
        setLastGeneratedPassword: (bool: boolean) => set(() => ({ uniquePassword: bool }), false),
        setUniquePassword: (bool: boolean) => set(() => ({ uniquePassword: bool }), false),
      }),
      {
        name: 'config',
        storage: createJSONStorage(() => ({
          getItem: async (name: string) => {
            const value = await chrome.storage.local.get(name)
            return value[name] || null
          },
          setItem: async (name: string, value: string) => {
            await chrome.storage.local.set({ [name]: value })
            return { [name]: value }
          },
          removeItem: async (name: string) => {
            await chrome.storage.local.remove(name)
            return null
          },
        })),
        version: 0,
      },
    ),
  ),
)
