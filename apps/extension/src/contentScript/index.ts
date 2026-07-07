import { Form } from '@/types'
import { useContentScriptStore as contentScriptStore } from '@/store/content-script'
import { fillElement, gatherVisibleInputsInOrder, initiateAutofill, isInViewport, runActionSteps } from '@/autofill'
import { isContentEditable, isSupportedInput, isWidgetElement, log } from '@/utils'
import { getActionsFromStorage } from '@/utils/actions'
import { MESSAGES } from '@/consts'

const ACTION_AUTOFILL_PREFIX = 'ACTION_AUTOFILL_'

// Keeps a form/action target clear of viewport edges (e.g. a sticky header) before treating
// it as "already visible" — see isInViewport.
const SCROLL_SAFE_MARGIN_PX = 24

/** Scrolls the element into view first when it isn't already comfortably visible, waiting briefly for the scroll to settle. */
const scrollIntoViewIfNeeded = async (elem: Element) => {
  if (isInViewport(elem, SCROLL_SAFE_MARGIN_PX)) return

  elem.scrollIntoView({ behavior: 'smooth', block: 'center' })

  await new Promise((resolve) => setTimeout(resolve, 400))
}

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
      log(sender.tab ? `Tab Message` : `Extension Message`)

      const {
        INIT_AUTOFILL_ALL,
        INIT_AUTOFILL_FORM,
        INIT_AUTOFILL_INPUT,
        AUTOFILL_COMPLETE,
        GET_FORMS,
        SCROLL_FORM_INTO_VIEW,
      } = MESSAGES
      const activeElement = document.activeElement
      const isActionAutofill = request.type.startsWith(ACTION_AUTOFILL_PREFIX)

      // Resolve the active action (if any) into the content-script store
      if ([INIT_AUTOFILL_ALL, INIT_AUTOFILL_FORM, INIT_AUTOFILL_INPUT].includes(request.type) || isActionAutofill) {
        let activeAction
        if (isActionAutofill) {
          const actionId = request.type.slice(ACTION_AUTOFILL_PREFIX.length)
          const actions = await getActionsFromStorage()
          activeAction = actions.find((action) => action.id === actionId)
        }

        contentScriptStore.setState({ activeAction })
      }

      switch (request.type) {
        case GET_FORMS:
          {
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
          }
          break

        case INIT_AUTOFILL_ALL:
          {
            await initiateAutofill({ rootElement: null })

            sendResponse({ type: AUTOFILL_COMPLETE })
          }
          break

        case INIT_AUTOFILL_FORM:
          {
            if (!request?.form) return

            const elem = document.querySelectorAll('form')[request.form.index]

            await scrollIntoViewIfNeeded(elem)

            await initiateAutofill({ rootElement: elem })

            elem.requestSubmit()

            sendResponse({ type: AUTOFILL_COMPLETE })
          }
          break

        case INIT_AUTOFILL_INPUT:
          {
            // Native inputs, contenteditable hosts and custom widgets all route
            // through the fillElement strategy dispatcher.
            if (
              activeElement &&
              (isSupportedInput(activeElement) || isContentEditable(activeElement) || isWidgetElement(activeElement))
            ) {
              fillElement({ elem: activeElement })
            }
          }
          break

        case SCROLL_FORM_INTO_VIEW:
          {
            if (request?.form) {
              const elem = document.querySelectorAll('form')[request.form.index]

              elem?.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
              })
            }
          }
          break

        default: {
          /* Handle action-specific message */
          if (isActionAutofill) {
            const action = contentScriptStore.getState().activeAction

            // Declarative steps run first; a steps-only action (no fields) skips the fill.
            if (action?.steps?.length) await runActionSteps(action.steps)

            if (!action?.steps?.length || action.fields.length > 0) {
              const rootSelector = action?.rootSelector
              const rootElement = rootSelector ? document.querySelector(rootSelector) : null

              if (rootElement) await scrollIntoViewIfNeeded(rootElement)

              await initiateAutofill({ rootElement })
            }

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
