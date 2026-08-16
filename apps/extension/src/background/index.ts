import { DEMO_URL } from '@fillmatic/config'

import { log } from '@/utils'
import { sendMessageToAllFrames } from '@/utils/tab-messaging'
import { MESSAGES } from '@/consts'
import { ExtensionCommands } from '@/types'

log('BACKGROUND SCRIPT is running...')

if (import.meta.env.DEV) {
  chrome.action.setBadgeText({ text: 'DEV' })
  chrome.action.setBadgeBackgroundColor({ color: '#FF3B30' })
}

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    chrome.tabs.create({ url: DEMO_URL })
  }
})

// chrome.action.onClicked.addListener(async () => {
//
// })

// chrome.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
//   ;(async () => {
//     const {} = MESSAGES
//
//     switch (msg) {
//       case '':
//         const tab = await getCurrentTab()
//         await sendResponse(tab)
//         break
//     }
//   })()
//
//   return true
// })

chrome.commands.onCommand.addListener(async (command: string, tab) => {
  if (!tab || !tab.id) return

  const { INIT_AUTOFILL_ALL, INIT_AUTOFILL_FORM, INIT_AUTOFILL_INPUT, GET_FORMS } = MESSAGES

  switch (command as ExtensionCommands) {
    case 'AUTOFILL_ALL':
      {
        await sendMessageToAllFrames(tab.id, { type: INIT_AUTOFILL_ALL })
      }
      break

    case 'AUTOFILL_CURRENT_FORM':
      {
        // Get form
        const forms = (await chrome.tabs.sendMessage(tab.id, { type: GET_FORMS })).forms as { focused: boolean }[]
        const focusedForm = forms.find((elem) => elem.focused)

        if (focusedForm) {
          await chrome.tabs.sendMessage(tab.id, { type: INIT_AUTOFILL_FORM, form: focusedForm })
        }
      }
      break
    case 'AUTOFILL_CURRENT_INPUT':
      {
        await sendMessageToAllFrames(tab.id, { type: INIT_AUTOFILL_INPUT })
      }
      break

    default: {
      log(`Unhandled background command: ${command}`)
      return
    }
  }
})
