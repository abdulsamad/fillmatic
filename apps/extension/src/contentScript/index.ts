import { log } from '@/utils'
import { fillElement, gatherVisibleInputsInOrder, initiateAutofill } from '@/autofill'
import { MESSAGES } from '@/consts'
import { Form, SupportedInputsType } from '@/types'

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

      const {
        INIT_AUTOFILL_ALL,
        INIT_AUTOFILL_FORM,
        INIT_AUTOFILL_INPUT,
        AUTOFILL_COMPLETE,
        GET_FORMS,
        SCROLL_FORM_INTO_VIEW,
      } = MESSAGES
      const activeElement = document.activeElement

      switch (request.type) {
        case GET_FORMS:
          // Get all forms from page
          const forms = Array.from(document.querySelectorAll('form'))

          const formsCollection = forms
            .map((form, index) => {
              const inputs = gatherVisibleInputsInOrder(form)

              if (inputs.length === 0) return null

              const isFocused = form === activeElement || form.contains(activeElement)

              return {
                name: form.getAttribute('name'),
                class: form.className,
                id: form.id,
                index,
                focused: isFocused,
              }
            })
            .filter(Boolean)

          sendResponse({ type: GET_FORMS, forms: formsCollection })
          break

        case INIT_AUTOFILL_ALL:
          await initiateAutofill()

          sendResponse({ type: AUTOFILL_COMPLETE })
          break

        case INIT_AUTOFILL_FORM:
          if (request?.form) {
            const elem = document.querySelectorAll('form')[request.form.index]

            await initiateAutofill(elem)

            elem.requestSubmit()

            sendResponse({ type: AUTOFILL_COMPLETE })
          }
          break

        case INIT_AUTOFILL_INPUT:
          if (
            activeElement instanceof HTMLInputElement ||
            activeElement instanceof HTMLTextAreaElement ||
            activeElement instanceof HTMLSelectElement
          ) {
            fillElement(activeElement as SupportedInputsType)
          }
          break

        case SCROLL_FORM_INTO_VIEW:
          if (request?.form) {
            const elem = document.querySelectorAll('form')[request.form.index]

            elem?.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
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
