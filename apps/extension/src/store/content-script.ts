import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

import { AutoFillMessage } from '@/types'
import { SiteRule } from '@/utils/site-rules'

interface ContentScriptStore {
  firstName?: string
  lastName?: string
  lastGeneratedPassword: string
  siteRule?: SiteRule
  message?: AutoFillMessage
}

export const useContentScriptStore = create(
  devtools<ContentScriptStore>((_set, _get) => ({
    // State
    firstName: undefined, // Initialize as undefined to allow dynamic generation when needed
    lastName: undefined, // Initialize as undefined to allow dynamic generation when needed
    lastGeneratedPassword: '',
    siteRule: undefined,
    message: undefined,
  })),
)
