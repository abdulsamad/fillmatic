import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

import { Form, ExtensionCommands } from '@/types'
import { MESSAGES } from '@/consts'

interface FillAllParams {
  fillType: 'all'
}

interface FillSingleParams {
  fillType: 'single'
  form: Form
}

interface FillSiteParams {
  fillType: 'site'
  messageId: string
}

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
  fillData: (fillParms: FillAllParams | FillSingleParams | FillSiteParams) => Promise<void>
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
    fillData: async ({ fillType = 'all', ...restProps }) => {
      try {
        set(() => ({ isAutofilling: true }))

        const { currentTab } = get()

        if (!currentTab?.id) return

        switch (fillType) {
          case 'single': {
            if (!('form' in restProps)) throw new Error('Form is required to fill particular form')

            const { form } = restProps

            const { INIT_AUTOFILL_FORM } = MESSAGES

            await chrome.tabs.sendMessage(currentTab.id, {
              type: INIT_AUTOFILL_FORM,
              tab: { id: currentTab.id, url: currentTab.url },
              form,
            })
            break
          }
          case 'site': {
            if (!('messageId' in restProps)) throw new Error(`messageId is required to run an action`)

            await chrome.tabs.sendMessage(currentTab.id, {
              type: `ACTION_AUTOFILL_${restProps.messageId}`,
              tab: { id: currentTab.id, url: currentTab.url },
            })
            break
          }
          default: {
            const { INIT_AUTOFILL_ALL } = MESSAGES

            await chrome.tabs.sendMessage(currentTab.id, {
              type: INIT_AUTOFILL_ALL,
              tab: { id: currentTab.id, url: currentTab.url },
            })
            break
          }
        }

        set(() => ({ isAutofilling: false }))
      } catch (err) {
        console.error(err)
        set(() => ({ isAutofilling: false }))
      }
    },
  })),
)
