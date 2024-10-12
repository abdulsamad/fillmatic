import { Form, SupportedInputsType } from '@/types'
import { useContentScriptStore as contentScriptStore } from '@/store/content-script'
import { fillElement, gatherVisibleInputsInOrder, initiateAutofill } from '@/autofill'
import { log } from '@/utils'
import { getSiteRule } from '@/utils/site-rules'
import { MESSAGES } from '@/consts'

// Init Log
log('CONTENT SCRIPT is running...')

interface RequestPayload {
  type: MESSAGES
  tab?: { id: number; url: string }
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
        case GET_FORMS: {
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
        }

        case INIT_AUTOFILL_ALL: {
          const tabUrl = request.tab?.url
          const siteRule = await getSiteRule(tabUrl!)

          contentScriptStore.setState({ siteRule })

          await initiateAutofill({ rootElement: null })

          sendResponse({ type: AUTOFILL_COMPLETE })
          break
        }

        case INIT_AUTOFILL_FORM: {
          if (request?.form) {
            const elem = document.querySelectorAll('form')[request.form.index]
            const tabUrl = request.tab?.url
            const siteRule = await getSiteRule(tabUrl!)

            contentScriptStore.setState({ siteRule })

            await initiateAutofill({ rootElement: elem })

            elem.requestSubmit()

            sendResponse({ type: AUTOFILL_COMPLETE })
          }
          break
        }

        case INIT_AUTOFILL_INPUT: {
          if (
            activeElement instanceof HTMLInputElement ||
            activeElement instanceof HTMLTextAreaElement ||
            activeElement instanceof HTMLSelectElement
          ) {
            const tabUrl = request.tab?.url
            const siteRule = await getSiteRule(tabUrl!)

            contentScriptStore.setState({ siteRule })

            fillElement({ elem: activeElement as SupportedInputsType })
          }
          break
        }

        case SCROLL_FORM_INTO_VIEW: {
          if (request?.form) {
            const elem = document.querySelectorAll('form')[request.form.index]

            elem?.scrollIntoView({
              behavior: 'smooth',
              block: 'start',
            })
          }

          break
        }

        default: {
          /* Handle Site Specifc Message */
          if (request.type.startsWith('SITE_AUTOFILL_')) {
            const tabUrl = request.tab?.url
            const siteRule = await getSiteRule(tabUrl!)

            contentScriptStore.setState({ siteRule, message: { id: request.type?.slice(14) } })

            await initiateAutofill({ rootElement: null })

            sendResponse({ type: AUTOFILL_COMPLETE })
          }

          return null
        }
      }
    } catch (err) {
      log(`Error during autofill: ${err}`)
    }
  })()

  // Return true to keep the message channel open for async responses
  return true
})
