import { isElementVisible } from '@/utils/isElementVisible'

// Gather all visible input elements in the order they appear in the DOM
export const gatherVisibleInputsInOrder = (): HTMLElement[] => {
  const allInputs = Array.from(
    document.querySelectorAll('input, select, textarea') as NodeListOf<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  )
  const ignoredInputTypes = ['image', 'submit', 'button', 'reset', 'file']
  const visibleInputs = allInputs
    .filter((input) => !ignoredInputTypes.includes(input.type))
    .filter((input) => isElementVisible(input)) as HTMLElement[]
  return visibleInputs
}
