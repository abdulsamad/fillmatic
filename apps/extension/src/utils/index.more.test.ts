import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useConfigStore } from '@/store/config'
import {
  escapeRegExp,
  getAllCommands,
  getCurrentTab,
  getElementType,
  getStoreFromStorage,
  isInternalPage,
  setNativeChecked,
  setNativeValue,
  triggerEvent,
  typeWithEffect,
} from '@/utils'

// chrome.tabs.query et al. are overloaded (callback vs. Promise-returning forms), which makes
// TS infer `void` for vi.mocked(...).mockResolvedValueOnce(...). Cast to the Promise-returning
// shape we actually use so we can configure the resolved value without fighting the overloads.
type AsyncMock<T> = { mockResolvedValueOnce: (value: T) => void }
const asAsyncMock = <T>(fn: unknown) => fn as AsyncMock<T>

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('escapeRegExp', () => {
  it('escapes regex special characters', () => {
    expect(escapeRegExp('c++')).toBe('c\\+\\+')
    expect(escapeRegExp('a.b*c?')).toBe('a\\.b\\*c\\?')
  })
})

describe('getElementType', () => {
  it('returns the input type for an <input>', () => {
    const input = document.createElement('input')
    input.type = 'email'
    expect(getElementType(input)).toBe('email')
  })

  it('returns "select" for a <select>', () => {
    expect(getElementType(document.createElement('select'))).toBe('select')
  })

  it('returns "textarea" for a <textarea>', () => {
    expect(getElementType(document.createElement('textarea'))).toBe('textarea')
  })

  it('returns an empty string for an unsupported element', () => {
    expect(getElementType(document.createElement('div'))).toBe('')
  })
})

describe('triggerEvent', () => {
  it('dispatches a bubbling, cancelable event of the given type', () => {
    const input = document.createElement('input')
    const handler = vi.fn()
    input.addEventListener('custom-event', handler)

    triggerEvent(input, 'custom-event')

    expect(handler).toHaveBeenCalledTimes(1)
    const event = handler.mock.calls[0][0] as Event
    expect(event.bubbles).toBe(true)
    expect(event.cancelable).toBe(true)
  })
})

describe('setNativeValue / setNativeChecked', () => {
  it('sets the value on an input via the native setter', () => {
    const input = document.createElement('input')
    setNativeValue(input, 'hello')
    expect(input.value).toBe('hello')
  })

  it('sets the value on a textarea via the native setter', () => {
    const textarea = document.createElement('textarea')
    setNativeValue(textarea, 'hello')
    expect(textarea.value).toBe('hello')
  })

  it('sets the value on a select via the native setter', () => {
    const select = document.createElement('select')
    const option = document.createElement('option')
    option.value = 'a'
    select.appendChild(option)
    setNativeValue(select, 'a')
    expect(select.value).toBe('a')
  })

  it('sets the checked state on a checkbox via the native setter', () => {
    const checkbox = document.createElement('input')
    checkbox.type = 'checkbox'
    setNativeChecked(checkbox, true)
    expect(checkbox.checked).toBe(true)
  })
})

describe('getCurrentTab', () => {
  it('returns the active tab when chrome.tabs.query resolves one', async () => {
    const tab = { id: 1, url: 'https://example.com' } as chrome.tabs.Tab
    asAsyncMock<chrome.tabs.Tab[]>(chrome.tabs.query).mockResolvedValueOnce([tab])

    expect(await getCurrentTab()).toBe(tab)
  })

  it('returns -1 when chrome.tabs.query resolves no tab', async () => {
    asAsyncMock<chrome.tabs.Tab[]>(chrome.tabs.query).mockResolvedValueOnce([])

    expect(await getCurrentTab()).toBe(-1)
  })
})

describe('isInternalPage', () => {
  const mockTabUrl = (url: string | undefined) => {
    asAsyncMock<chrome.tabs.Tab[]>(chrome.tabs.query).mockResolvedValueOnce([{ url } as chrome.tabs.Tab])
  }

  it('returns false when the active tab has no url', async () => {
    mockTabUrl(undefined)
    expect(await isInternalPage()).toBe(false)
  })

  it('returns true for a chrome:// url', async () => {
    mockTabUrl('chrome://extensions')
    expect(await isInternalPage()).toBe(true)
  })

  it('returns true for a chrome-extension:// url', async () => {
    mockTabUrl('chrome-extension://abc123/options.html')
    expect(await isInternalPage()).toBe(true)
  })

  it('returns true for the Chrome Web Store', async () => {
    mockTabUrl('https://chromewebstore.google.com/detail/foo')
    expect(await isInternalPage()).toBe(true)
  })

  it('returns false for a normal site url', async () => {
    mockTabUrl('https://example.com')
    expect(await isInternalPage()).toBe(false)
  })
})

describe('getStoreFromStorage', () => {
  it('parses the persisted JSON and returns its state', async () => {
    const persisted = { state: { foo: 'bar' }, version: 0 }
    asAsyncMock<Record<string, string>>(chrome.storage.local.get).mockResolvedValueOnce({
      myKey: JSON.stringify(persisted),
    })

    expect(await getStoreFromStorage('myKey')).toEqual({ foo: 'bar' })
  })
})

describe('getAllCommands', () => {
  it('filters out commands missing a name or shortcut and maps the rest', async () => {
    asAsyncMock<chrome.commands.Command[]>(chrome.commands.getAll).mockResolvedValueOnce([
      { name: 'AUTOFILL_ALL', shortcut: 'Ctrl+Shift+A' },
      { name: 'NO_SHORTCUT', shortcut: '' },
      { name: '', shortcut: 'Ctrl+X' },
    ] as chrome.commands.Command[])

    expect(await getAllCommands()).toEqual({ AUTOFILL_ALL: 'Ctrl+Shift+A' })
  })
})

describe('typeWithEffect', () => {
  beforeEach(() => {
    useConfigStore.setState({ typingEffect: false })
  })

  it('sets the value once and fires the input lifecycle when typing effect is off', async () => {
    const input = document.createElement('input')
    document.body.appendChild(input)
    const events: string[] = []
    ;['focus', 'beforeinput', 'input', 'change', 'blur'].forEach((type) =>
      input.addEventListener(type, () => events.push(type)),
    )

    await typeWithEffect('hi', input, true)

    expect(input.value).toBe('hi')
    // jsdom's own .focus()/.blur() calls dispatch native focus/blur events in addition to
    // the synthetic ones the implementation dispatches manually.
    expect(events).toEqual(['focus', 'focus', 'beforeinput', 'input', 'change', 'blur', 'blur'])
  })

  it('does not fire a change event for a contenteditable element', async () => {
    const div = document.createElement('div')
    div.contentEditable = 'true'
    document.body.appendChild(div)
    const events: string[] = []
    ;['focus', 'change', 'blur'].forEach((type) => div.addEventListener(type, () => events.push(type)))

    await typeWithEffect('hi', div, true)

    expect(div.textContent).toBe('hi')
    expect(events).toEqual(['focus', 'blur'])
  })

  it('types character by character when typingEffect is enabled, resolving once the last char lands', async () => {
    vi.useFakeTimers()
    useConfigStore.setState({ typingEffect: true, typingSpeed: 600 })
    const input = document.createElement('input')
    document.body.appendChild(input)

    const promise = typeWithEffect('hi', input, true)
    await vi.runAllTimersAsync()
    await promise

    expect(input.value).toBe('hi')
  })

  it('still runs the focus/change/blur lifecycle for an empty string under typing effect', async () => {
    vi.useFakeTimers()
    useConfigStore.setState({ typingEffect: true, typingSpeed: 600 })
    const input = document.createElement('input')
    document.body.appendChild(input)
    const events: string[] = []
    ;['focus', 'change', 'blur'].forEach((type) => input.addEventListener(type, () => events.push(type)))

    const promise = typeWithEffect('', input, true)
    await vi.runAllTimersAsync()
    await promise

    expect(events).toEqual(['focus', 'focus', 'change', 'blur', 'blur'])
  })
})
