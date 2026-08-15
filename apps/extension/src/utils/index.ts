import { HTMLInputTypeAttribute } from 'react'

import { useConfigStore as configStore } from '@/store/config'
import { ExtensionCommands, SupportedInputsType } from '@/types'

export * from './log'
export * from './generateNames'

export const isDev = import.meta.env.DEV

export const isSupportedInput = (elem: Element): elem is SupportedInputsType =>
  elem instanceof HTMLInputElement || elem instanceof HTMLTextAreaElement || elem instanceof HTMLSelectElement

export const isContentEditable = (elem: Element): boolean => {
  if (!(elem instanceof HTMLElement) || isSupportedInput(elem)) return false

  // contenteditable="" means true; 'plaintext-only' is editable too. The reflecting
  // property is read as a fallback for environments where assigning it doesn't
  // reach the attribute (jsdom).
  const attr = elem.getAttribute('contenteditable')
  const mode = (attr ?? (typeof elem.contentEditable === 'string' ? elem.contentEditable : '')).toLowerCase()
  if ((attr !== null && mode === '') || mode === 'true' || mode === 'plaintext-only') return true

  // Computed editability covers elements that inherit it (children of an editable
  // host, designMode documents) without carrying the attribute themselves.
  return elem.isContentEditable === true
}

export const isSupportedElement = (elem: Element): boolean => isSupportedInput(elem) || isContentEditable(elem)

export type WidgetKind = 'option-picker' | 'calendar' | 'switch' | 'slider' | 'spinbutton' | 'radiogroup'

/** Classifies a widget element by its ARIA semantics; undefined = not a known widget. */
export const getWidgetKind = (elem: Element): WidgetKind | undefined => {
  const role = elem.getAttribute('role')
  const haspopup = elem.getAttribute('aria-haspopup')

  if (role === 'switch') return 'switch'
  if (role === 'slider') return 'slider'
  if (role === 'spinbutton') return 'spinbutton'
  if (role === 'radiogroup') return 'radiogroup'
  if (haspopup === 'dialog') return 'calendar'
  if (role === 'combobox' || role === 'listbox' || haspopup === 'listbox') return 'option-picker'

  return undefined
}

/** True for non-native elements the widget fill strategy knows how to drive. */
export const isWidgetElement = (elem: Element): boolean =>
  elem instanceof HTMLElement && !isSupportedInput(elem) && getWidgetKind(elem) !== undefined

/**
 * Native value/checked setters captured from the prototype. Frameworks like React patch the
 * element instance's own setter and keep an internal value tracker; assigning `el.value` directly
 * updates that tracker, so a following `input` event reads as "no change" and `onChange` never
 * fires. Calling the prototype setter bypasses the instance patch, leaving the tracker stale, so
 * the dispatched event is detected as a real change. (Same approach used by Testing Library.)
 */
// Guard with typeof — these DOM globals don't exist in the service worker context.
const inputValueSetter = typeof HTMLInputElement !== 'undefined'
  ? Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
  : undefined
const textareaValueSetter = typeof HTMLTextAreaElement !== 'undefined'
  ? Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set
  : undefined
const selectValueSetter = typeof HTMLSelectElement !== 'undefined'
  ? Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')?.set
  : undefined
const checkedSetter = typeof HTMLInputElement !== 'undefined'
  ? Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'checked')?.set
  : undefined

export const setNativeValue = (el: SupportedInputsType, value: string) => {
  const setter =
    el instanceof HTMLInputElement
      ? inputValueSetter
      : el instanceof HTMLTextAreaElement
        ? textareaValueSetter
        : selectValueSetter
  if (setter) setter.call(el, value)
  else el.value = value
}

export const setNativeChecked = (el: HTMLInputElement, checked: boolean) => {
  if (checkedSetter) checkedSetter.call(el, checked)
  else el.checked = checked
}

export const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export const getCurrentTab = async () => {
  const queryOptions = { active: true, lastFocusedWindow: true }
  const [tab] = await chrome.tabs.query(queryOptions)

  return tab || -1
}

export const isInternalPage = async () => {
  const queryOptions = { active: true, lastFocusedWindow: true }
  const [tab] = await chrome.tabs.query(queryOptions)

  if (!tab.url) return false

  return (
    tab.url.startsWith('chrome://') ||
    tab.url.startsWith('chrome-extension://') ||
    tab.url.startsWith('https://chromewebstore.google.com')
  )
}

export const typeWithEffect = (text: string, element: HTMLElement, typeEffect: boolean): Promise<void> => {
  const value = text ?? ''
  const editable = isContentEditable(element)

  return new Promise((resolve) => {
    // Move real DOM focus (preventScroll avoids the page jumping per field), then
    // dispatch a synthetic focus for listeners that key off the event directly.
    element.focus?.({ preventScroll: true })
    element.dispatchEvent(new FocusEvent('focus', { bubbles: true }))

    const finish = () => {
      // contenteditable has no `change` event; inputs do.
      if (!editable) {
        element.dispatchEvent(new Event('change', { bubbles: true }))
      }
      element.dispatchEvent(new FocusEvent('blur', { bubbles: true }))
      element.blur?.()
      resolve()
    }

    if (configStore.getState().typingEffect && typeEffect) {
      const textArr = value.split('')

      // Empty value: still run the focus/blur + change lifecycle so listeners fire.
      if (textArr.length === 0) {
        finish()
        return
      }

      const charPerMinute = configStore.getState().typingSpeed * 5 // Assuming average word length of 5 characters
      const msPerChar = 60000 / charPerMinute // Convert to milliseconds per character

      textArr.forEach((str: string, index) => {
        const slice = textArr.slice(0, index + 1).join('')
        setTimeout(() => {
          element.dispatchEvent(new KeyboardEvent('keydown', { key: str, bubbles: true }))
          element.dispatchEvent(new InputEvent('beforeinput', { inputType: 'insertText', data: str, bubbles: true }))

          if (editable) {
            element.textContent = slice
          } else {
            setNativeValue(element as SupportedInputsType, slice)
          }

          element.dispatchEvent(new InputEvent('input', { inputType: 'insertText', data: str, bubbles: true }))
          element.dispatchEvent(new KeyboardEvent('keyup', { key: str, bubbles: true }))

          if (textArr.length === index + 1) finish()
        }, msPerChar * index)
      })

      return
    }

    // No typing effect: set the value once and run the event lifecycle.
    element.dispatchEvent(new InputEvent('beforeinput', { inputType: 'insertText', data: value, bubbles: true }))

    if (editable) {
      element.textContent = value
    } else {
      setNativeValue(element as SupportedInputsType, value)
    }

    element.dispatchEvent(new InputEvent('input', { inputType: 'insertText', data: value, bubbles: true }))
    finish()
  })
}

export const getElementType = (element: HTMLElement): HTMLInputTypeAttribute | 'select' | 'textarea' => {
  switch (true) {
    case element instanceof HTMLInputElement:
      return element.type
    case element instanceof HTMLSelectElement:
      return 'select'
    case element instanceof HTMLTextAreaElement:
      return 'textarea'
    default:
      return ''
  }
}

export const triggerEvent = (element: HTMLElement, eventType: string) => {
  const event = new Event(eventType, { bubbles: true, cancelable: true })
  element.dispatchEvent(event)
}

// Compiled regexes are cached per `word` so the same patterns aren't rebuilt for
// every element. `handleDefaultInputs` calls matchElement dozens of times per
// field; without this each call recompiled two RegExp objects.
const matchRegexCache = new Map<string, RegExp[]>()

const getMatchRegexes = (word: string): RegExp[] => {
  const cached = matchRegexCache.get(word)
  if (cached) return cached

  const joinedWord = word.toLowerCase().split(' ').join('')
  const regexes: RegExp[] = []

  for (const w of [word.toLowerCase(), joinedWord]) {
    if (!w) continue
    try {
      // Escape so a regex-special char in user config (e.g. "c++") can't throw and
      // break matching for every element.
      regexes.push(new RegExp(`\\b${escapeRegExp(w)}\\b`))
    } catch {
      // Ignore malformed patterns.
    }
  }

  matchRegexCache.set(word, regexes)
  return regexes
}

const normalizeAttr = (value: string | undefined | null): string =>
  value?.toLowerCase().replaceAll('_', ' ').replaceAll('-', ' ').trim() ?? ''

const isFormField = (el: HTMLElement): el is SupportedInputsType =>
  el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement

/**
 * Per-element searchable text is expensive to build (label/ARIA lookups), and
 * `matchElement` is called many times per element. The result is cached and
 * tagged with a generation number; bumping the generation (once per autofill run
 * via `invalidateMatchCache`) recomputes it in case the page changed, while reuse
 * within a run stays cheap. Elements are GC'd from the WeakMap when removed.
 */
let matchCacheGeneration = 0
export const invalidateMatchCache = () => {
  matchCacheGeneration += 1
}

type ElementSearchText = {
  label: string
  all: string
}

const elementTextCache = new WeakMap<HTMLElement, { gen: number; text: ElementSearchText }>()

const normalizeParts = (parts: string[]): string => parts.map(normalizeAttr).filter(Boolean).join('\n')

const buildElementSearchText = (element: HTMLElement): ElementSearchText => {
  const labelParts: string[] = []
  const fallbackParts: string[] = []

  // Associated <label> elements (works for input/textarea/select).
  if (isFormField(element) && element.labels) {
    for (const label of Array.from(element.labels)) {
      if (label.textContent) labelParts.push(label.textContent)
    }
  }

  // ARIA attributes provide the accessible label for fields that don't use a
  // native <label> — common in modern component libraries.
  const ariaLabel = element.getAttribute('aria-label')
  if (ariaLabel) labelParts.push(ariaLabel)

  const labelledBy = element.getAttribute('aria-labelledby')
  if (labelledBy) {
    for (const refId of labelledBy.split(/\s+/)) {
      const ref = refId ? document.getElementById(refId) : null
      if (ref?.textContent) labelParts.push(ref.textContent)
    }
  }

  const title = element.getAttribute('title')
  if (title) fallbackParts.push(title)

  // Field identity attributes. name/placeholder now also cover textarea/select,
  // not just <input>.
  if (isFormField(element) && element.name) fallbackParts.push(element.name)
  if ((element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) && element.placeholder) {
    fallbackParts.push(element.placeholder)
  }
  if (element.id) fallbackParts.push(element.id)
  if (element.className) fallbackParts.push(element.className)

  // Join parts with newlines so a multi-word phrase (e.g. "first name") can't
  // accidentally span two separate attributes, while single words still match.
  const label = normalizeParts(labelParts)
  const fallback = normalizeParts(fallbackParts)
  return { label, all: [label, fallback].filter(Boolean).join('\n') }
}

const getElementSearchText = (element: HTMLElement): ElementSearchText => {
  const cached = elementTextCache.get(element)
  if (cached && cached.gen === matchCacheGeneration) return cached.text

  const text = buildElementSearchText(element)
  elementTextCache.set(element, { gen: matchCacheGeneration, text })
  return text
}

const matchesText = (haystack: string, word: string): boolean => {
  if (!haystack) return false

  for (const regex of getMatchRegexes(word)) {
    if (regex.test(haystack)) return true
  }

  return false
}

/** Matches only native and ARIA label text, excluding name/id/placeholder/class hints. */
export const matchElementLabel = (element: HTMLElement, word: string): boolean =>
  matchesText(getElementSearchText(element).label, word)

export const matchElement = (element: HTMLElement, word: string): boolean =>
  matchesText(getElementSearchText(element).all, word)

export const getStoreFromStorage = async (key: string) => JSON.parse((await chrome.storage.local.get(key))[key] as string).state

export const getAllCommands = async (): Promise<Record<ExtensionCommands, string>> => {
  const commandsRef: Record<string, string | undefined> = {}

  const commands = await chrome.commands.getAll()

  commands.forEach((command) => {
    if (!command.name || !command.shortcut) return

    commandsRef[command.name] = command.shortcut
  })

  return commandsRef as Record<ExtensionCommands, string>
}
