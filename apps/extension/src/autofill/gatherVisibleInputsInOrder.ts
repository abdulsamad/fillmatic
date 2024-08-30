import { Inputs } from '@/types'

const isElementVisible = (element: Element): boolean => {
  if (!(element instanceof HTMLElement)) return false

  const style = window.getComputedStyle(element)

  return (
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    style.opacity !== '0' &&
    element.offsetWidth > 0 &&
    element.offsetHeight > 0 &&
    element.getClientRects().length > 0
  )
}

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
