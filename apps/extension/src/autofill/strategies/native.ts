import { getEffectiveConfig } from '@/store/profiles'
import {
  log,
  typeWithEffect,
  getElementType,
  isSupportedInput,
  matchElement,
  triggerEvent,
  setNativeValue,
  setNativeChecked,
} from '@/utils'

import { handleFileInput } from '../handleFileInput'
import { generateValue } from '../generateValue'
import { fillComboboxInput, isComboboxTextInput } from './adapters/comboboxInput'
import type { FillStrategy } from './types'

/** Fills native input/select/textarea elements. Moved verbatim from the original fillElement. */
export const nativeInputStrategy: FillStrategy = {
  name: 'native',

  canHandle: (elem) => isSupportedInput(elem),

  fill: async (elem) => {
    if (!isSupportedInput(elem)) return false

    const config = getEffectiveConfig()
    const type = getElementType(elem)

    // Ignore elements that are not fillable
    // TODO: Enable file input handling by removing file from array
    if (['button', 'submit', 'reset', 'hidden', 'image', 'file'].includes(type)) return true

    // Skip ignored fields
    if (config?.ignoredFields.split(',').some((field) => matchElement(elem, field.trim()))) {
      log(`Skipping autofill for ${type} as it is ignored in settings`)
      return true
    }

    // Skip autofill if element has value and forceAutofill is off (except for certain types)
    const defaultValuedElements = ['radio', 'checkbox', 'color', 'range', 'select']
    if (!config.forceAutofill && elem.value && !defaultValuedElements.includes(type)) {
      log(`Skipping autofill for ${type} as it already has a value`)
      return true
    }

    if (type === 'file') {
      await handleFileInput(elem as HTMLInputElement)
      return true
    }

    const value = await generateValue({ type, elem })

    switch (type) {
      case 'checkbox':
      case 'radio':
        if (elem instanceof HTMLInputElement) {
          const name = elem.name
          const selectedInputs = document.querySelectorAll(`input[name="${name}"]:checked`)

          if (selectedInputs.length === 0) {
            const checked = typeof value === 'boolean' ? value : String(value ?? '').toLowerCase() === 'true'
            // Native setter so framework value trackers register the change.
            setNativeChecked(elem, checked)
          }

          triggerEvent(elem, 'input')
          triggerEvent(elem, 'change')
          triggerEvent(elem, 'blur')
        }
        break

      case 'color':
      case 'select':
        // Set once via the native setter (no char-by-char typing for these), then
        // trigger events to simulate user interaction.
        setNativeValue(elem, value as string)

        triggerEvent(elem, 'input')
        triggerEvent(elem, 'change')
        triggerEvent(elem, 'blur')

        break

      default: {
        // Autocomplete-style comboboxes (react-select, MUI Autocomplete…) put the
        // combobox role on a text input; typed text never commits, an option must
        // be picked from the popup. Falls back to plain typing when nothing opens.
        if (isComboboxTextInput(elem) && (await fillComboboxInput(elem, (value ?? '') as string))) {
          break
        }

        const elemsWithoutTypeEffect = ['week', 'month', 'date', 'time', 'datetime-local']

        await typeWithEffect((value ?? '') as string, elem, !elemsWithoutTypeEffect.includes(type))
      }
    }

    return true
  },
}
