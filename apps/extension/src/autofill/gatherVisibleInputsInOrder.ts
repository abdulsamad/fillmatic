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

/**
 * Returns true if the element overlaps the viewport, shrunk inward by `margin` on every
 * side. A plain edge-to-edge overlap check would treat a sliver of an element peeking in
 * at the very top/bottom (e.g. behind a sticky header) as "already visible" and skip the
 * scroll — the margin keeps that sliver case from counting so the caller still scrolls it
 * comfortably into view.
 */
export const isInViewport = (elem: Element, margin = 0): boolean => {
  const rect = elem.getBoundingClientRect()
  const viewHeight = window.innerHeight || document.documentElement.clientHeight
  const viewWidth = window.innerWidth || document.documentElement.clientWidth

  return (
    rect.top < viewHeight - margin && rect.bottom > margin && rect.left < viewWidth - margin && rect.right > margin
  )
}

export const gatherVisibleInputsInOrder = (rootElement: Element | null = null): SupportedInputsType[] => {
  const allInputs = Array.from(
    (rootElement || document).querySelectorAll(
      'input:not(:disabled):not([readonly]), select:not(:disabled):not([readonly]), textarea:not(:disabled):not([readonly])',
    ) as NodeListOf<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  )

  return allInputs.filter((input) => isElementVisible(input)) as SupportedInputsType[]
}
