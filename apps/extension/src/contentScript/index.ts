import { log } from '@/utils'
import { initiateAutofill } from '@/autofill'
import { MESSAGES } from '@/consts'
import { Form } from '@/types'

// Init Log
log('CONTENT SCRIPT is running...')

interface RequestPayload {
  type: MESSAGES
  form?: Form
}

chrome.runtime.onMessage.addListener((request: RequestPayload, sender, sendResponse) => {
  ;(async () => {
    try {
      sender.tab ? log(`Tab Message`) : log(`Extension Message`)

      const { INIT_AUTOFILL_ALL, AUTOFILL_COMPLETE, POPUP_OPENED, SCROLL_FORM_INTO_VIEW } = MESSAGES

      switch (request.type) {
        case POPUP_OPENED:
          // Get all forms from page
          const forms = document.querySelectorAll('form')

          const formsCollection = Array.from(forms).map((form, index) => ({
            name: form.name,
            class: form.className,
            id: form.id,
            index,
          }))

          sendResponse({
            forms: formsCollection,
          })
          break

        case INIT_AUTOFILL_ALL:
          await initiateAutofill()

          sendResponse(AUTOFILL_COMPLETE)
          break

        case SCROLL_FORM_INTO_VIEW:
          if (request?.form) {
            const elem = document.querySelectorAll('form')[request.form.index]

            elem?.scrollIntoView({
              behavior: 'smooth',
              block: 'start',
            })
          }

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
