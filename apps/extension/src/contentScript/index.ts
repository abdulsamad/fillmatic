import { Form } from '@/types'
import { useContentScriptStore as contentScriptStore } from '@/store/content-script'
import { fillElement, gatherVisibleInputsInOrder, initiateAutofill, isInViewport, runActionSteps } from '@/autofill'
import { buildPageFields } from '@/autofill/pageFields'
import { isContentEditable, isSupportedInput, isWidgetElement, log } from '@/utils'
import { getActionsFromStorage, type FieldTarget } from '@/utils/actions'
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
  /** HIGHLIGHT_FIELD: index into the last GET_PAGE_FIELDS scan; -1 clears. */
  ref?: number
  /** APPLY_MAPPING: the (possibly edited) field map to fill with. */
  fields?: FieldTarget[]
}

// Elements from the last GET_PAGE_FIELDS scan, indexed by each field's `ref` so the
// side panel can highlight them without a re-scan.
let scannedElements: Element[] = []

let highlighted: { elem: HTMLElement; outline: string; outlineOffset: string } | null = null

const clearHighlight = () => {
  if (!highlighted) return
  highlighted.elem.style.outline = highlighted.outline
  highlighted.elem.style.outlineOffset = highlighted.outlineOffset
  highlighted = null
}

const highlightField = (ref: number) => {
  clearHighlight()

  const elem = scannedElements[ref]
  if (!(elem instanceof HTMLElement)) return

  highlighted = { elem, outline: elem.style.outline, outlineOffset: elem.style.outlineOffset }
  elem.style.outline = '2px solid #6366f1'
  elem.style.outlineOffset = '2px'
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
        GET_PAGE_FIELDS,
        HIGHLIGHT_FIELD,
        APPLY_MAPPING,
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

        case GET_PAGE_FIELDS:
          {
            const { fields, elements } = buildPageFields(null)
            scannedElements = elements

            sendResponse({ type: GET_PAGE_FIELDS, fields, url: window.location.href })
          }
          break

        case HIGHLIGHT_FIELD:
          {
            highlightField(request.ref ?? -1)
          }
          break

        case APPLY_MAPPING:
          {
            clearHighlight()

            // A mapping fill is a full-form autofill where the mapped fields override —
            // exactly the Action mechanism, so reuse activeAction for the run.
            contentScriptStore.setState({
              activeAction: {
                id: 'ai-mapping',
                name: 'AI Mapping',
                matcher: { type: 'startsWith', value: '' },
                active: true,
                fields: request.fields ?? [],
              },
            })

            await initiateAutofill({ rootElement: null })

            contentScriptStore.setState({ activeAction: undefined })

            sendResponse({ type: AUTOFILL_COMPLETE })
          }
          break

        default: {
          /* Handle action-specific message */
          if (isActionAutofill) {
            const action = contentScriptStore.getState().activeAction

            // Action messages are broadcast to every frame. Respect the action's
            // explicit iframe opt-in before running inside a child frame.
            if (window.top !== window && !action?.matchInIframe) {
              sendResponse({ type: AUTOFILL_COMPLETE })
              return null
            }

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
