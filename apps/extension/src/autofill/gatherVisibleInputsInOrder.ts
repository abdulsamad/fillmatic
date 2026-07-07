import { SupportedInputsType } from '@/types'
import { isWidgetElement } from '@/utils'

/**
 * querySelectorAll that also pierces open shadow roots. Light-DOM matches of each
 * root keep document order; matches inside a shadow root are appended after their
 * host root's own matches. Closed shadow roots stay unreachable (browser limit).
 */
export const queryDeepAll = (root: ParentNode, selector: string): Element[] => {
  const results: Element[] = Array.from(root.querySelectorAll(selector))

  for (const el of Array.from(root.querySelectorAll('*'))) {
    const shadowRoot = (el as HTMLElement).shadowRoot
    if (shadowRoot) results.push(...queryDeepAll(shadowRoot, selector))
  }

  return results
}

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
  const allInputs = queryDeepAll(
    rootElement || document,
    'input:not(:disabled):not([readonly]), select:not(:disabled):not([readonly]), textarea:not(:disabled):not([readonly])',
  ) as (HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement)[]

  return allInputs.filter((input) => isElementVisible(input)) as SupportedInputsType[]
}

/**
 * Gathers visible custom widgets (ARIA comboboxes, date-picker triggers, switches…)
 * for the widget fill strategy, de-duplicated against the native input pass:
 * - a native input carrying a widget role stays with the native path;
 * - a widget wrapping a *visible* native input is skipped (the input was already filled);
 *   a widget syncing to a hidden native input stays a widget (hidden inputs are
 *   invisible to the native gather);
 * - elements nested inside an already-collected widget are skipped.
 */
export const gatherWidgetElements = (rootElement: Element | null = null): HTMLElement[] => {
  const widgets: HTMLElement[] = []

  for (const elem of queryDeepAll(rootElement || document, '[role], [aria-haspopup]')) {
    if (!(elem instanceof HTMLElement) || !isWidgetElement(elem)) continue
    if (!isElementVisible(elem)) continue
    if (elem.getAttribute('aria-disabled') === 'true' || elem.hasAttribute('disabled')) continue
    if (widgets.some((w) => w.contains(elem))) continue

    const innerInputs = Array.from(elem.querySelectorAll('input, select, textarea'))
    if (innerInputs.some((input) => isElementVisible(input))) continue

    widgets.push(elem)
  }

  return widgets
}
