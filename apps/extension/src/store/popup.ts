import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

import { Form, ExtensionCommands } from '@/types'

interface PopupStore {
  isAutofilling: boolean
  isDisabled: boolean
  currentTab: chrome.tabs.Tab | null
  forms: Form[]
  commands: Record<ExtensionCommands, string>
  setIsAutofilling: (bool: boolean) => void
  setIsDisabled: (bool: boolean) => void
  setCurrentTab: (tab: chrome.tabs.Tab | null) => void
  setForms: (forms: Form[]) => void
  setCommands: (commands: Record<ExtensionCommands, string>) => void
}

export const usePopupStore = create(
  devtools<PopupStore>((set, get) => ({
    // State
    isAutofilling: false,
    isDisabled: false,
    currentTab: null,
    forms: [],
    commands: {} as Record<ExtensionCommands, string>,

    // Actions
    setIsAutofilling: (isAutofilling) => {
      set(() => ({ isAutofilling }), false)
    },
    setIsDisabled: (isDisabled) => {
      set(() => ({ isDisabled }), false)
    },
    setCurrentTab: (currentTab) => {
      set(() => ({ currentTab }))
    },
    setForms: (forms) => {
      set(() => ({ forms }))
    },
    setCommands: (commands) => {
      set(() => ({ commands }))
    },
  })),
)
