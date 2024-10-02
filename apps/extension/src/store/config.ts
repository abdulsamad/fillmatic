import { create } from 'zustand'
import { persist, createJSONStorage, devtools } from 'zustand/middleware'

import { DEFAULT_CONFIG } from '@/consts'
import { type formSchemaType } from '@/components/OptionsForm/formSchema'

interface ConfigStore extends formSchemaType {
  lastGeneratedPassword: string
  setLastGeneratedPassword: (password: string) => void
  saveConfig: (config: formSchemaType) => void
}

export const useConfigStore = create(
  devtools(
    persist<ConfigStore>(
      (set, get) => ({
        // State
        ...DEFAULT_CONFIG,
        lastGeneratedPassword: '',

        // Actions
        saveConfig: (config) => {
          set(() => ({ ...config }), false)
        },
        setLastGeneratedPassword: (password) => set(() => ({ lastGeneratedPassword: password }), false),
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
