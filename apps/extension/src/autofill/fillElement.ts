import { log, typeWithEffect, getElementType } from '@/utils'
import { handleFileInput } from '@/autofill'
import { DEFAULT_CONFIG } from '@/consts'
import { Inputs } from '@/types'

import { generateValue } from './generateValue'

export const fillElement = async (elem: Inputs, config = DEFAULT_CONFIG) => {
  const type = getElementType(elem)

  // Ignore elements that are not fillable
  if (['button', 'submit', 'reset', 'hidden', 'image'].includes(type)) return

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
}
