import { useConfigStore as configStore } from '@/store/config'
import { AutoFillMessage } from '@/types'
import { log, typeWithEffect, getElementType, isSupportedInput, isContentEditable, matchElement } from '@/utils'
import { handleFileInput } from '@/autofill'

import { generateValue } from './generateValue'

interface IFillElement {
  elem: Element
  message?: AutoFillMessage
}

export const fillElement = async ({ elem, message }: IFillElement) => {
  const config = configStore.getState()

  if (isSupportedInput(elem)) {
    /* Inputs */
    const type = getElementType(elem)

    // Ignore elements that are not fillable
    // TODO: Enable file input handling by removing file from array
    if (['button', 'submit', 'reset', 'hidden', 'image', 'file'].includes(type)) return

    // Skip ignored fields
    if (config?.ignoredFields.split(',').some((field) => matchElement(elem, field.trim()))) {
      log(`Skipping autofill for ${type} as it is ignored in settings`)
      return
    }

    // Skip autofill if element has value and forceAutofill is off (except for certain types)
    // const defaultValuedElements = ['radio', 'checkbox', 'color', 'range', 'select']
    if (!config.forceAutofill && elem.value) {
      log(`Skipping autofill for ${type} as it already has a value`)
      return
    }

    if (type === 'file') {
      await handleFileInput(elem as HTMLInputElement)
      return
    }

    const value = await generateValue(type, elem, message)

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

      default: {
        try {
          const elemsWithoutTypeEffect = ['week', 'month', 'date', 'time', 'datetime-local']

          await typeWithEffect(value as string, elem, !elemsWithoutTypeEffect.includes(type))
        } catch (error) {
          log(`Error during type effect: ${error}`)
        }
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
