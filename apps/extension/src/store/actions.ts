import { create } from 'zustand'
import { persist, createJSONStorage, devtools } from 'zustand/middleware'

import { type Action, DEFAULT_ACTIONS, STORAGE_KEY } from '@/utils/actions'

interface ActionsStore {
  actions: Action[]
  addAction: (action: Action) => void
  updateAction: (action: Action) => void
  deleteAction: (id: string) => void
}

const defaultsById = new Map(DEFAULT_ACTIONS.map((a) => [a.id, a]))

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
        version: 2,
        migrate: (persisted: unknown, version: number) => {
          const state = persisted as ActionsStore
          if (version < 2) {
            // Re-merge built-in action definitions so new fields (group, fields, matcher)
            // are always up-to-date. Only the user's `active` toggle is preserved.
            state.actions = state.actions.map((a) => {
              const def = defaultsById.get(a.id)
              return def ? { ...def, active: a.active } : a
            })
          }
          return state
        },
      },
    ),
  ),
)
