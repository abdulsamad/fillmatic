import { isElementVisible } from '../../gatherVisibleInputsInOrder'

/** Dispatches the full pointer/mouse press sequence frameworks listen for (Radix opens on pointerdown, MUI on mousedown, most on click). */
export const clickLikeUser = (elem: Element) => {
  const init: MouseEventInit = { bubbles: true, cancelable: true, composed: true }

  // jsdom has no PointerEvent constructor — fall back to MouseEvent there.
  const pointerEvent = (type: string) =>
    typeof PointerEvent !== 'undefined' ? new PointerEvent(type, init) : new MouseEvent(type, init)

  elem.dispatchEvent(pointerEvent('pointerdown'))
  elem.dispatchEvent(new MouseEvent('mousedown', init))
  elem.dispatchEvent(pointerEvent('pointerup'))
  elem.dispatchEvent(new MouseEvent('mouseup', init))
  elem.dispatchEvent(new MouseEvent('click', init))
}

export const pressKey = (elem: Element, key: string) => {
  const init: KeyboardEventInit = { key, bubbles: true, cancelable: true, composed: true }
  elem.dispatchEvent(new KeyboardEvent('keydown', init))
  elem.dispatchEvent(new KeyboardEvent('keyup', init))
}

export const normalizeText = (text: string | null | undefined): string =>
  (text ?? '').toLowerCase().replace(/\s+/g, ' ').trim()

/** Containers a widget popover can render into. Portals mount at document.body, so searches are document-wide. */
export const POPOVER_SELECTOR = '[role="listbox"], [role="menu"], [role="dialog"], [role="grid"]'

export const getVisiblePopovers = (selector: string = POPOVER_SELECTOR): HTMLElement[] =>
  Array.from(document.querySelectorAll(selector)).filter(
    (el): el is HTMLElement => el instanceof HTMLElement && isElementVisible(el),
  )

/**
 * Finds the popover a trigger just opened: prefer the trigger's own aria-controls /
 * aria-owns reference, else the newest visible popover container that wasn't
 * present before the trigger was clicked.
 */
export const findOpenedPopover = (
  trigger: Element,
  popoversBefore: ReadonlySet<Element>,
  selector: string = POPOVER_SELECTOR,
): HTMLElement | undefined => {
  const refIds = [trigger.getAttribute('aria-controls'), trigger.getAttribute('aria-owns')]
    .filter(Boolean)
    .flatMap((ids) => (ids as string).split(/\s+/))

  for (const id of refIds) {
    const ref = document.getElementById(id)
    if (ref && isElementVisible(ref)) return ref
  }

  const fresh = getVisiblePopovers(selector).filter((el) => !popoversBefore.has(el))
  return fresh[fresh.length - 1]
}

/** Visible, non-disabled option elements inside a popover. */
export const getSelectableOptions = (popover: HTMLElement): HTMLElement[] =>
  Array.from(popover.querySelectorAll('[role="option"]')).filter(
    (el): el is HTMLElement =>
      el instanceof HTMLElement && isElementVisible(el) && el.getAttribute('aria-disabled') !== 'true',
  )

/**
 * Picks the option matching `targetValue` by normalized textContent — exact match
 * first, then contains. Empty/missing target or no match returns undefined so the
 * caller can fall back to a random option.
 */
export const findOptionByText = (options: HTMLElement[], targetValue: string): HTMLElement | undefined => {
  const target = normalizeText(targetValue)
  if (!target) return undefined

  const texts = options.map((option) => normalizeText(option.textContent))

  const exactIndex = texts.findIndex((text) => text === target)
  if (exactIndex !== -1) return options[exactIndex]

  const containsIndex = texts.findIndex((text) => text.includes(target))
  return containsIndex !== -1 ? options[containsIndex] : undefined
}
