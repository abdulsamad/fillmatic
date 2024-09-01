import { log } from '@/utils'
import { initiateAutofill } from '@/autofill'
import { MESSAGES } from '@/consts'

// Init Log
log('CONTENT SCRIPT is running...')

chrome.runtime.onMessage.addListener((request: MESSAGES, sender, sendResponse) => {
  ;(async () => {
    try {
      sender.tab ? log(`Tab Message`) : log(`Extension Message`)

      const { INIT_AUTOFILL_ALL, AUTOFILL_COMPLETE } = MESSAGES

      switch (request) {
        case INIT_AUTOFILL_ALL:
          await initiateAutofill()

          sendResponse(AUTOFILL_COMPLETE)
          break
        default:
          return null
      }
    } catch (err) {
      log(`Error during autofill: ${err}`)
    }
  })()

  // Return true to keep the message channel open for async responses
  return true
})
