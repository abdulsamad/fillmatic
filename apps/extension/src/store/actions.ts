import { create } from 'zustand'
import { persist, createJSONStorage, devtools } from 'zustand/middleware'

import { type Action, DEFAULT_ACTIONS, STORAGE_KEY } from '@/utils/actions'

interface ActionsStore {
  actions: Action[]
  addAction: (action: Action) => void
  updateAction: (action: Action) => void
  deleteAction: (id: string) => void
}

export const useActionsStore = create(
  devtools(
    persist<ActionsStore>(
      (set) => ({
        actions: DEFAULT_ACTIONS,

        addAction: (action) => set((state) => ({ actions: [...state.actions, action] })),
        updateAction: (action) =>
          set((state) => ({ actions: state.actions.map((a) => (a.id === action.id ? action : a)) })),
        deleteAction: (id) => set((state) => ({ actions: state.actions.filter((a) => a.id !== id) })),
      }),
      {
        name: STORAGE_KEY,
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
