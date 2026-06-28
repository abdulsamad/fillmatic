import { HTMLInputTypeAttribute } from 'react'
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

import { useConfigStore as configStore } from '@/store/config'
import { ExtensionCommands, SupportedInputsType } from '@/types'

export * from './log'
export * from './generateNames'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const isDev = import.meta.env.DEV

export const isSupportedInput = (elem: Element): elem is SupportedInputsType =>
  elem instanceof HTMLInputElement || elem instanceof HTMLTextAreaElement || elem instanceof HTMLSelectElement

export const isContentEditable = (elem: Element): boolean =>
  elem instanceof HTMLElement && elem.contentEditable?.toLowerCase() === 'true' && !isSupportedInput(elem)

export const isSupportedElement = (elem: Element): boolean => isSupportedInput(elem) || isContentEditable(elem)

/**
 * Native value/checked setters captured from the prototype. Frameworks like React patch the
 * element instance's own setter and keep an internal value tracker; assigning `el.value` directly
 * updates that tracker, so a following `input` event reads as "no change" and `onChange` never
 * fires. Calling the prototype setter bypasses the instance patch, leaving the tracker stale, so
 * the dispatched event is detected as a real change. (Same approach used by Testing Library.)
 */
const inputValueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
const textareaValueSetter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set
const selectValueSetter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')?.set
const checkedSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'checked')?.set

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

export const matchElement = (element: HTMLElement, word: string): boolean => {
  const label =
    element instanceof HTMLInputElement && element.labels
      ? Array.from(element.labels)
          .map((label) => label.textContent?.toLowerCase())
          .join(' ')
      : ''

  const placeholder =
    element instanceof HTMLInputElement
      ? element.placeholder?.toLowerCase().replaceAll('_', ' ').replaceAll('-', ' ').trim()
      : ''
  const name =
    element instanceof HTMLInputElement
      ? element.name?.toLowerCase().replaceAll('_', ' ').replaceAll('-', ' ').trim()
      : ''
  const id = element.id?.toLowerCase().replaceAll('_', ' ').replaceAll('-', ' ').trim()
  const className = element.className?.toLowerCase().replaceAll('_', ' ').replaceAll('-', ' ').trim()

  const words = word.toLowerCase().split(' ')
  const joinedWord = words.join('')

  for (const w of [word.toLowerCase(), joinedWord]) {
    if (!w) continue
    try {
      // Escape so a regex-special char in user config (e.g. "c++") can't throw and
      // break matching for every element.
      const regex = new RegExp(`\\b${escapeRegExp(w)}\\b`)
      if (regex.test(label) || regex.test(placeholder) || regex.test(name) || regex.test(id) || regex.test(className)) {
        return true
      }
    } catch {
      // Ignore malformed patterns and continue.
    }
  }

  return false
}

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
