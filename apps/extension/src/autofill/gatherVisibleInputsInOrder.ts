import { SupportedInputsType } from '@/types'

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

/** Returns true if any part of the element overlaps the current viewport. */
export const isInViewport = (elem: Element): boolean => {
  const rect = elem.getBoundingClientRect()
  const viewHeight = window.innerHeight || document.documentElement.clientHeight
  const viewWidth = window.innerWidth || document.documentElement.clientWidth

  return rect.top < viewHeight && rect.bottom > 0 && rect.left < viewWidth && rect.right > 0
}

export const gatherVisibleInputsInOrder = (rootElement: Element | null = null): SupportedInputsType[] => {
  const allInputs = Array.from(
    (rootElement || document).querySelectorAll(
      'input:not(:disabled):not([readonly]), select:not(:disabled):not([readonly]), textarea:not(:disabled):not([readonly])',
    ) as NodeListOf<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  )

  return allInputs.filter((input) => isElementVisible(input)) as SupportedInputsType[]
}
