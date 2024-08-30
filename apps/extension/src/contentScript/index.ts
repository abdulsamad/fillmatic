import { log } from '@/utils'
import { initiateAutofill } from '@/autofill'
import { MESSAGES } from '@/consts'

// Init Log
log('CONTENT SCRIPT is running...')

chrome.runtime.onMessage.addListener(async (request: MESSAGES, sender, sendResponse) => {
  try {
    sender.tab ? log(`Tab Message`) : log(`Extension Message`)

    const { INIT_AUTOFILL_ALL } = MESSAGES

    switch (request) {
      case INIT_AUTOFILL_ALL:
        await initiateAutofill()
        break
      default:
        return null
    }
  } catch (err) {
    log(`Error during autofill: ${err}`)
  }
})
