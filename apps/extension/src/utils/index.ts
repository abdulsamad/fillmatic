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

export const isSupportedInput = (elem: Element) =>
  elem instanceof HTMLInputElement || elem instanceof HTMLTextAreaElement || elem instanceof HTMLSelectElement

export const isContentEditable = (elem: Element) =>
  elem instanceof HTMLElement && elem.contentEditable?.toLowerCase() === 'true' && !isSupportedInput(elem)

export const isSupportedElement = (elem: Element) => isSupportedInput(elem) || isContentEditable(elem)

export const getCurrentTab = async () => {
  let queryOptions = { active: true, lastFocusedWindow: true }
  let [tab] = await chrome.tabs.query(queryOptions)

  return tab || -1
}

export const isInternalPage = async () => {
  let queryOptions = { active: true, lastFocusedWindow: true }
  let [tab] = await chrome.tabs.query(queryOptions)

  if (!tab.url) return false

  return tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')
}

export const typeWithEffect = (text: string, element: SupportedInputsType, typeEffect: boolean): Promise<void> => {
  return new Promise((resolve) => {
    // Trigger initial focus event
    element.dispatchEvent(new FocusEvent('focus', { bubbles: true }))

    if (configStore.getState().typingEffect && typeEffect) {
      const textArr = text.split('')
      const charPerMinute = configStore.getState().typingSpeed * 5 // Assuming average word length of 5 characters
      const msPerChar = 60000 / charPerMinute // Convert to milliseconds per character

      textArr.forEach((str: string, index) => {
        const slice = textArr.slice(0, index + 1).join('')
        setTimeout(() => {
          if (isContentEditable(element)) {
            // Simulate typing for contenteditable elements
            const keydownEvent = new KeyboardEvent('keydown', { key: str, bubbles: true })
            element.dispatchEvent(keydownEvent)

            const beforeinputEvent = new InputEvent('beforeinput', {
              inputType: 'insertText',
              data: str,
              bubbles: true,
            })
            element.dispatchEvent(beforeinputEvent)

            // Update content
            element.textContent = slice

            const inputEvent = new InputEvent('input', { inputType: 'insertText', data: str, bubbles: true })
            element.dispatchEvent(inputEvent)

            const keyupEvent = new KeyboardEvent('keyup', { key: str, bubbles: true })
            element.dispatchEvent(keyupEvent)
          } else {
            // Existing behavior for input elements
            element.value = slice

            // Trigger keyboard events for each keystroke
            const keydownEvent = new KeyboardEvent('keydown', { key: str })
            element.dispatchEvent(keydownEvent)

            // Only trigger keyup event for text, password, search, url, tel, and email input types
            if (
              element instanceof HTMLInputElement &&
              ['text', 'password', 'search', 'url', 'tel', 'email'].includes(element.type)
            ) {
              const keyupEvent = new KeyboardEvent('keyup', { key: str })
              element.dispatchEvent(keyupEvent)
            }

            // Trigger input event
            const inputEvent = new Event('input', { bubbles: true })
            element.dispatchEvent(inputEvent)
          }

          if (textArr.length === index + 1) {
            if (isContentEditable(element)) {
              // Trigger blur event for contenteditable
              element.dispatchEvent(new FocusEvent('blur', { bubbles: true }))
            } else {
              // Trigger change event for input elements
              const changeEvent = new Event('change', { bubbles: true })
              element.dispatchEvent(changeEvent)

              // Trigger blur event for input elements
              element.dispatchEvent(new FocusEvent('blur', { bubbles: true }))
            }
            resolve()
          }
        }, msPerChar * index)
      })

      return
    }

    if (isContentEditable(element)) {
      // Set content for contenteditable without type effect
      element.textContent = text

      // Trigger input event
      const inputEvent = new InputEvent('input', { inputType: 'insertText', data: text, bubbles: true })
      element.dispatchEvent(inputEvent)

      // Trigger blur event
      element.dispatchEvent(new FocusEvent('blur', { bubbles: true }))
    } else {
      // Trigger input event
      const focusEvent = new Event('focus', { bubbles: true })
      element.dispatchEvent(focusEvent)

      // Set value for input elements without type effect
      element.value = text

      // Trigger input event
      const inputEvent = new Event('input', { bubbles: true })
      element.dispatchEvent(inputEvent)

      // Trigger change event
      const changeEvent = new Event('change', { bubbles: true })
      element.dispatchEvent(changeEvent)

      // Trigger blur event
      element.dispatchEvent(new FocusEvent('blur', { bubbles: true }))
    }
    resolve()
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

export const matchElement = (element: HTMLElement, word: string): boolean => {
  const label =
    element instanceof HTMLInputElement && element.labels
      ? Array.from(element.labels)
          .map((label) => label.textContent?.toLowerCase())
          .join(' ')
      : ''

  const placeholder = element instanceof HTMLInputElement ? element.placeholder?.toLowerCase() : ''
  const name = element instanceof HTMLInputElement ? element.name.toLowerCase() : ''
  const id = element.id?.toLowerCase()
  const className = element.className?.toLowerCase()

  const words = word.toLowerCase().split(' ')
  const joinedWord = words.join('')

  for (const w of [word.toLowerCase(), joinedWord]) {
    const regex = new RegExp(`\\b${w}\\b`)
    if (regex.test(label) || regex.test(placeholder) || regex.test(name) || regex.test(id) || regex.test(className)) {
      return true
    }
  }

  return false
}

export const getStoreFromStorage = async (key: string) => JSON.parse((await chrome.storage.local.get(key))[key]).state

export const getAllCommands = async (): Promise<Record<ExtensionCommands, string>> => {
  const commandsRef: Record<string, string | undefined> = {}

  const commands = await chrome.commands.getAll()

  commands.forEach((command) => {
    if (!command.name || !command.shortcut) return

    commandsRef[command.name] = command.shortcut
  })

  return commandsRef as Record<ExtensionCommands, string>
}
