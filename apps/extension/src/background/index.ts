import { log } from '@/utils'
import { MESSAGES } from '@/consts'
import { ExtensionCommands } from '@/types'

log('BACKGROUND SCRIPT is running...')

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    chrome.tabs.create({ url: `https://fillmatic.pages.dev/demo/` })
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
        await chrome.tabs.sendMessage(tab.id, { type: INIT_AUTOFILL_ALL })
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
        await chrome.tabs.sendMessage(tab.id, { type: INIT_AUTOFILL_INPUT })
      }
      break

    default: {
      return
    }
  }
})
