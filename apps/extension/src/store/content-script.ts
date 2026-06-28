import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

import { Action } from '@/utils/actions'

interface ContentScriptStore {
  firstName?: string
  lastName?: string
  lastGeneratedPassword: string
  activeAction?: Action
}

export const useContentScriptStore = create(
  devtools<ContentScriptStore>((_set, _get) => ({
    // State
    firstName: undefined, // Initialize as undefined to allow dynamic generation when needed
    lastName: undefined, // Initialize as undefined to allow dynamic generation when needed
    lastGeneratedPassword: '',
    activeAction: undefined,
  })),
)
