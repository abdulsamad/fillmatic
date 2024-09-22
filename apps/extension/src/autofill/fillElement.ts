import { log, typeWithEffect, getElementType, isSupportedInput, isContentEditable } from '@/utils'
import { handleFileInput } from '@/autofill'
import { DEFAULT_CONFIG } from '@/consts'

import { generateValue } from './generateValue'

export const fillElement = async (elem: Element, config = DEFAULT_CONFIG) => {
  if (isSupportedInput(elem)) {
    /* Inputs */
    const type = getElementType(elem)

    // Ignore elements that are not fillable
    // TODO: Add file input handling
    if (['button', 'submit', 'reset', 'hidden', 'image', 'file'].includes(type)) return

    // Ignore elements that already have a value
    if (!config.forceAutofill && elem.value && !['radio', 'checkbox', 'color', 'range', 'select'].includes(type)) {
      log(`Skipping autofill for ${type} as it already has a value`)
      return
    }

    if (type === 'file') {
      await handleFileInput(elem as HTMLInputElement)
      return
    }

    const value = await generateValue(type, elem)

    switch (type) {
      case 'checkbox':
      case 'radio':
        if (elem instanceof HTMLInputElement) {
          elem.checked = value as boolean
        }
        break

      case 'color':
        elem.value = value as string
        break

      default:
        try {
          const elemsWithoutTypeEffect = ['week', 'month', 'date', 'time', 'datetime-local']

          await typeWithEffect(value as string, elem, !elemsWithoutTypeEffect.includes(type))
        } catch (error) {
          log(`Error during type effect: ${error}`)
        }
    }
  } else if (isContentEditable(elem)) {
    /* Contenteditable */
    try {
      elem.innerHTML = (await generateValue('contenteditable', elem)) as string
    } catch (error) {
      log(`Error during type effect for contenteditable: ${error}`)
    }
  }
}
