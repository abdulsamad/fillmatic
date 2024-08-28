import { log, initiateAutofill } from '@/utils'

// Init Log
log('CONTENT SCRIPT is running...')

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  try {
    sender.tab ? log(`Tab Message`) : log(`Extension Message`)

    await initiateAutofill()

    if (request.greeting === 'hello') {
      sendResponse({ farewell: 'goodbye' })
    }
  } catch (err) {
    log(`Error during autofill: ${err}`)
  }
})
