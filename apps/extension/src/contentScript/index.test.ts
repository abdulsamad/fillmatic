import { beforeEach, describe, expect, it, vi } from 'vitest'

import { MESSAGES } from '@/consts'
import { useContentScriptStore as contentScriptStore } from '@/store/content-script'
import { type Action } from '@/utils/actions'

const { fillElement, gatherVisibleInputsInOrder, initiateAutofill, isInViewport, getActionsFromStorage } = vi.hoisted(
  () => ({
    fillElement: vi.fn(),
    gatherVisibleInputsInOrder: vi.fn().mockReturnValue([]),
    initiateAutofill: vi.fn().mockResolvedValue(undefined),
    isInViewport: vi.fn().mockReturnValue(true),
    getActionsFromStorage: vi.fn().mockResolvedValue([] as Action[]),
  }),
)

vi.mock('@/autofill', () => ({ fillElement, gatherVisibleInputsInOrder, initiateAutofill, isInViewport }))
// Keep the real module (matchFieldTarget, getAttributeValue… are used by the unmocked
// pageFields scan) and only stub the storage read.
vi.mock('@/utils/actions', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/utils/actions')>()),
  getActionsFromStorage,
}))

// The module registers its onMessage listener as an import-time side effect; import it once
// and reuse the captured listener across tests instead of resetting modules per test (which
// would otherwise create a second, disconnected instance of the zustand stores it depends on).
await import('@/contentScript/index')

type Listener = (
  request: { type: string; tab?: unknown; form?: { index: number }; ref?: number; fields?: unknown },
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: unknown) => void,
) => boolean

const listener = vi.mocked(chrome.runtime.onMessage.addListener).mock.calls.at(-1)![0] as unknown as Listener

const flush = async () => {
  await Promise.resolve()
  await Promise.resolve()
  await Promise.resolve()
}

beforeEach(() => {
  fillElement.mockClear()
  gatherVisibleInputsInOrder.mockClear().mockReturnValue([])
  initiateAutofill.mockClear().mockResolvedValue(undefined)
  isInViewport.mockClear().mockReturnValue(true)
  getActionsFromStorage.mockClear().mockResolvedValue([])
  contentScriptStore.setState({ activeAction: undefined })
  document.body.innerHTML = ''
})

describe('contentScript GET_FORMS', () => {
  it('returns only forms that have visible inputs, with focused reflecting document.activeElement', async () => {
    const formWithInputs = document.createElement('form')
    formWithInputs.id = 'form-a'
    const formEmpty = document.createElement('form')
    formEmpty.id = 'form-b'
    document.body.append(formWithInputs, formEmpty)

    gatherVisibleInputsInOrder.mockImplementation((form: Element) =>
      form === formWithInputs ? [document.createElement('input')] : [],
    )

    const sendResponse = vi.fn()
    listener({ type: MESSAGES.GET_FORMS }, {} as chrome.runtime.MessageSender, sendResponse)
    await flush()

    expect(sendResponse).toHaveBeenCalledWith({
      type: MESSAGES.GET_FORMS,
      forms: [{ name: null, class: '', id: 'form-a', index: 0, focused: false }],
    })
  })
})

describe('contentScript INIT_AUTOFILL_ALL', () => {
  it('runs a full-page autofill and responds with AUTOFILL_COMPLETE', async () => {
    const sendResponse = vi.fn()

    listener({ type: MESSAGES.INIT_AUTOFILL_ALL }, {} as chrome.runtime.MessageSender, sendResponse)
    await flush()

    expect(initiateAutofill).toHaveBeenCalledWith({ rootElement: null })
    expect(sendResponse).toHaveBeenCalledWith({ type: MESSAGES.AUTOFILL_COMPLETE })
  })
})

describe('contentScript INIT_AUTOFILL_FORM', () => {
  it('does nothing when the request has no form', async () => {
    const sendResponse = vi.fn()

    listener({ type: MESSAGES.INIT_AUTOFILL_FORM }, {} as chrome.runtime.MessageSender, sendResponse)
    await flush()

    expect(initiateAutofill).not.toHaveBeenCalled()
    expect(sendResponse).not.toHaveBeenCalled()
  })

  it('scrolls into view, fills, submits the target form, and responds with AUTOFILL_COMPLETE', async () => {
    const form = document.createElement('form')
    document.body.appendChild(form)
    const requestSubmitSpy = vi.spyOn(form, 'requestSubmit')

    const sendResponse = vi.fn()
    listener(
      { type: MESSAGES.INIT_AUTOFILL_FORM, form: { index: 0 } },
      {} as chrome.runtime.MessageSender,
      sendResponse,
    )
    await flush()

    expect(initiateAutofill).toHaveBeenCalledWith({ rootElement: form })
    expect(requestSubmitSpy).toHaveBeenCalled()
    expect(sendResponse).toHaveBeenCalledWith({ type: MESSAGES.AUTOFILL_COMPLETE })
  })

  it('waits for the scroll when the form is not already in the viewport', async () => {
    vi.useFakeTimers()
    isInViewport.mockReturnValue(false)
    const form = document.createElement('form')
    document.body.appendChild(form)
    const scrollSpy = vi.spyOn(form, 'scrollIntoView')

    const sendResponse = vi.fn()
    listener(
      { type: MESSAGES.INIT_AUTOFILL_FORM, form: { index: 0 } },
      {} as chrome.runtime.MessageSender,
      sendResponse,
    )
    await vi.runAllTimersAsync()

    expect(scrollSpy).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' })
    expect(initiateAutofill).toHaveBeenCalledWith({ rootElement: form })
    vi.useRealTimers()
  })
})

describe('contentScript INIT_AUTOFILL_INPUT', () => {
  it('fills the currently focused supported input', async () => {
    const input = document.createElement('input')
    document.body.appendChild(input)
    input.focus()

    listener({ type: MESSAGES.INIT_AUTOFILL_INPUT }, {} as chrome.runtime.MessageSender, vi.fn())
    await flush()

    expect(fillElement).toHaveBeenCalledWith({ elem: input })
  })

  it('does nothing when the focused element is not a supported input', async () => {
    listener({ type: MESSAGES.INIT_AUTOFILL_INPUT }, {} as chrome.runtime.MessageSender, vi.fn())
    await flush()

    expect(fillElement).not.toHaveBeenCalled()
  })
})

describe('contentScript SCROLL_FORM_INTO_VIEW', () => {
  it('scrolls the requested form into view', async () => {
    const form = document.createElement('form')
    document.body.appendChild(form)
    const scrollSpy = vi.spyOn(form, 'scrollIntoView')

    listener({ type: MESSAGES.SCROLL_FORM_INTO_VIEW, form: { index: 0 } }, {} as chrome.runtime.MessageSender, vi.fn())
    await flush()

    expect(scrollSpy).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' })
  })

  it('does not throw when no form is given', () => {
    expect(() =>
      listener({ type: MESSAGES.SCROLL_FORM_INTO_VIEW }, {} as chrome.runtime.MessageSender, vi.fn()),
    ).not.toThrow()
  })
})

describe('contentScript action-autofill messages (default case)', () => {
  it('resolves the active action, scopes the fill to its rootSelector, and responds with AUTOFILL_COMPLETE', async () => {
    const scoped = document.createElement('div')
    scoped.id = 'scoped-root'
    document.body.appendChild(scoped)

    getActionsFromStorage.mockResolvedValue([
      {
        id: 'demo',
        name: 'Demo',
        matcher: { type: 'startsWith', value: 'x' },
        active: true,
        fields: [],
        rootSelector: '#scoped-root',
      },
    ] as Action[])

    const sendResponse = vi.fn()
    listener({ type: 'ACTION_AUTOFILL_demo' }, {} as chrome.runtime.MessageSender, sendResponse)
    await flush()

    expect(contentScriptStore.getState().activeAction?.id).toBe('demo')
    expect(initiateAutofill).toHaveBeenCalledWith({ rootElement: scoped })
    expect(sendResponse).toHaveBeenCalledWith({ type: MESSAGES.AUTOFILL_COMPLETE })
  })

  it('falls back to a null rootElement when the action has no rootSelector', async () => {
    getActionsFromStorage.mockResolvedValue([
      { id: 'demo', name: 'Demo', matcher: { type: 'startsWith', value: 'x' }, active: true, fields: [] },
    ] as Action[])

    listener({ type: 'ACTION_AUTOFILL_demo' }, {} as chrome.runtime.MessageSender, vi.fn())
    await flush()

    expect(initiateAutofill).toHaveBeenCalledWith({ rootElement: null })
  })

  it('does nothing for a completely unrecognized message type', async () => {
    const sendResponse = vi.fn()

    listener({ type: 'SOMETHING_UNKNOWN' }, {} as chrome.runtime.MessageSender, sendResponse)
    await flush()

    expect(initiateAutofill).not.toHaveBeenCalled()
    expect(sendResponse).not.toHaveBeenCalled()
  })
})

describe('contentScript page-field mapping messages', () => {
  const makeVisible = (elem: HTMLElement) => {
    Object.defineProperty(elem, 'offsetWidth', { value: 100, configurable: true })
    Object.defineProperty(elem, 'offsetHeight', { value: 20, configurable: true })
    elem.getClientRects = () => [{}] as unknown as DOMRectList
  }

  const scanPage = async () => {
    const sendResponse = vi.fn()
    listener({ type: MESSAGES.GET_PAGE_FIELDS }, {} as chrome.runtime.MessageSender, sendResponse)
    await flush()
    return sendResponse
  }

  it('GET_PAGE_FIELDS responds with field descriptors and the page URL', async () => {
    const input = document.createElement('input')
    input.id = 'user_email'
    input.type = 'email'
    makeVisible(input)
    document.body.appendChild(input)

    const sendResponse = await scanPage()

    expect(sendResponse).toHaveBeenCalledWith({
      type: MESSAGES.GET_PAGE_FIELDS,
      url: window.location.href,
      fields: [expect.objectContaining({ ref: 0, kind: 'input:email', attribute: 'id', match: 'user_email' })],
    })
  })

  it('HIGHLIGHT_FIELD outlines the scanned element and ref -1 clears it', async () => {
    const input = document.createElement('input')
    input.id = 'user_email'
    makeVisible(input)
    document.body.appendChild(input)
    await scanPage()

    listener({ type: MESSAGES.HIGHLIGHT_FIELD, ref: 0 }, {} as chrome.runtime.MessageSender, vi.fn())
    await flush()
    expect(input.style.outline).toContain('solid')

    listener({ type: MESSAGES.HIGHLIGHT_FIELD, ref: -1 }, {} as chrome.runtime.MessageSender, vi.fn())
    await flush()
    expect(input.style.outline).toBe('')
  })

  it('APPLY_MAPPING fills with the mapped fields as the active action, then clears it', async () => {
    const fields = [{ attribute: 'id', operator: 'exact', match: 'email', value: 'a@b.c' }]

    let actionDuringFill: unknown
    initiateAutofill.mockImplementation(async () => {
      actionDuringFill = contentScriptStore.getState().activeAction
    })

    const sendResponse = vi.fn()
    listener({ type: MESSAGES.APPLY_MAPPING, fields }, {} as chrome.runtime.MessageSender, sendResponse)
    await flush()

    expect(initiateAutofill).toHaveBeenCalledWith({ rootElement: null })
    expect(actionDuringFill).toMatchObject({ id: 'ai-mapping', fields })
    expect(contentScriptStore.getState().activeAction).toBeUndefined()
    expect(sendResponse).toHaveBeenCalledWith({ type: MESSAGES.AUTOFILL_COMPLETE })
  })
})

describe('contentScript error handling', () => {
  it('logs and does not throw when the async handler rejects', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    initiateAutofill.mockRejectedValueOnce(new Error('boom'))

    const result = listener({ type: MESSAGES.INIT_AUTOFILL_ALL }, {} as chrome.runtime.MessageSender, vi.fn())
    await flush()

    expect(result).toBe(true)
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('%cError during autofill'), expect.anything())
  })
})
