import { HTMLInputTypeAttribute } from 'react'
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

import { DEFAULT_CONFIG } from '@/consts'

export * from './log'
export * from './generateNames'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const isDev = import.meta.env.DEV

export const getCurrentTab = async () => {
  let queryOptions = { active: true, lastFocusedWindow: true }
  let [tab] = await chrome.tabs.query(queryOptions)

  return tab || -1
}

export const typeWithEffect = (text: string, cb: (str: string) => void, typeEffect = true): Promise<void> => {
  return new Promise((resolve) => {
    if (typeEffect) {
      const textArr = text.split('')
      textArr.forEach((str: string, index) => {
        const slice = textArr.slice(0, index + 1).join('')
        setTimeout(() => {
          cb(slice)
          if (textArr.length === index + 1) {
            resolve()
          }
        }, DEFAULT_CONFIG.typeEffectSpeed * index)
      })

      return
    }

    cb(text)
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
