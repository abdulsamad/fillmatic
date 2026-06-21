import { create } from 'zustand'
import { persist, createJSONStorage, devtools } from 'zustand/middleware'

import { DEFAULT_CONFIG } from '@/consts'
import { type formSchemaType } from '@/components/Options/formSchema'

interface ConfigStore extends formSchemaType {
  saveConfig: (config: formSchemaType) => void
}

export const useConfigStore = create(
  devtools(
    persist<ConfigStore>(
      (set, get) => ({
        // State
        ...DEFAULT_CONFIG,

        // Actions
        saveConfig: (config) => {
          set(() => ({ ...config }), false)
        },
      }),
      {
        name: 'config',
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
        version: 0,
      },
    ),
  ),
)
