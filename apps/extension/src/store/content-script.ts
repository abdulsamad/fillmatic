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
  devtools<ContentScriptStore>((set, get) => ({
    // State
    firstName: '',
    lastName: '',
    lastGeneratedPassword: '',
    siteRule: undefined,
    message: undefined,

    // Actions
  })),
)
