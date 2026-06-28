import { getEffectiveConfig } from '@/store/profiles'
import {
  log,
  typeWithEffect,
  getElementType,
  isSupportedInput,
  isContentEditable,
  matchElement,
  triggerEvent,
  setNativeValue,
  setNativeChecked,
} from '@/utils'
import { handleFileInput } from '@/autofill'

import { generateValue } from './generateValue'

interface IFillElement {
  elem: Element
}

export const fillElement = async ({ elem }: IFillElement) => {
  try {
    const config = getEffectiveConfig()

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
      const defaultValuedElements = ['radio', 'checkbox', 'color', 'range', 'select']
      if (!config.forceAutofill && elem.value && !defaultValuedElements.includes(type)) {
        log(`Skipping autofill for ${type} as it already has a value`)
        return
      }

      if (type === 'file') {
        await handleFileInput(elem as HTMLInputElement)
        return
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
          const elemsWithoutTypeEffect = ['week', 'month', 'date', 'time', 'datetime-local']

          await typeWithEffect((value ?? '') as string, elem, !elemsWithoutTypeEffect.includes(type))
        }
      }
    } else if (isContentEditable(elem)) {
      /* Contenteditable — route through typeWithEffect so input events fire (uses textContent) */
      const value = await generateValue({ type: 'contenteditable', elem })
      await typeWithEffect((value ?? '') as string, elem as HTMLElement, true)
    }
  } catch (err) {
    log(`Error in fillElement: ${err}`)
    console.error('Errored Element', elem)
  }
}
