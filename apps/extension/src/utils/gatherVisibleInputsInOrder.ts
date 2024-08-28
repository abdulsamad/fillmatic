import { isElementVisible } from '@/utils/isElementVisible'
import { Inputs } from '@/types'

// Gather all visible input elements in the order they appear in the DOM
export const gatherVisibleInputsInOrder = (): Inputs[] => {
  const allInputs = Array.from(
    document.querySelectorAll('input, select, textarea') as NodeListOf<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  )
  const ignoredInputTypes = ['image', 'submit', 'button', 'reset', 'file']
  const visibleInputs = allInputs
    .filter((input) => !ignoredInputTypes.includes(input.type))
    .filter((input) => isElementVisible(input)) as Inputs[]
  return visibleInputs
}
