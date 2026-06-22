import { create } from 'zustand'
import { persist, createJSONStorage, devtools } from 'zustand/middleware'

import { type UserRule } from '@/utils/user-rules'

interface UserRulesStore {
  userRules: UserRule[]
  addUserRule: (rule: UserRule) => void
  updateUserRule: (rule: UserRule) => void
  deleteUserRule: (id: string) => void
}

export const useUserRulesStore = create(
  devtools(
    persist<UserRulesStore>(
      (set) => ({
        userRules: [],

        addUserRule: (rule) => set((state) => ({ userRules: [...state.userRules, rule] })),
        updateUserRule: (rule) =>
          set((state) => ({ userRules: state.userRules.map((r) => (r.id === rule.id ? rule : r)) })),
        deleteUserRule: (id) => set((state) => ({ userRules: state.userRules.filter((r) => r.id !== id) })),
      }),
      {
        name: 'user-rules',
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
