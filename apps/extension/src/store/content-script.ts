import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface ContentScriptStore {
  firstName?: string
  lastName?: string
  lastGeneratedPassword: string
}

export const useContentScriptStore = create(
  devtools<ContentScriptStore>((set, get) => ({
    // State
    firstName: undefined,
    lastName: undefined,
    lastGeneratedPassword: '',

    // Actions
    //
  })),
)
