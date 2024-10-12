import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

import { SiteRule } from '@/utils/site-rules'

interface ContentScriptStore {
  firstName?: string
  lastName?: string
  lastGeneratedPassword: string
  siteRules?: SiteRule
  message?: string
}

export const useContentScriptStore = create(
  devtools<ContentScriptStore>((set, get) => ({
    // State
    firstName: undefined,
    lastName: undefined,
    lastGeneratedPassword: '',
    siteRules: undefined,
    message: '',

    // Actions
    //
  })),
)
