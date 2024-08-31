import { Inputs } from '@/types'

export const isElementVisible = (element: Element): boolean => {
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

export const gatherVisibleInputsInOrder = (): Inputs[] => {
  const allInputs = Array.from(
    document.querySelectorAll('input:not(:disabled), select:not(:disabled), textarea:not(:disabled)') as NodeListOf<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  )

  return allInputs.filter((input) => isElementVisible(input)) as Inputs[]
}
