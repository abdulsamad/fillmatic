import { faker } from '@faker-js/faker'

import { getWidgetKind, log } from '@/utils'

import { generateValue } from '../../generateValue'
import { waitForSettle } from '../../waitForSettle'
import { isElementVisible } from '../../gatherVisibleInputsInOrder'
import {
  POPOVER_SELECTOR,
  clickLikeUser,
  findOpenedPopover,
  findOptionByText,
  getSelectableOptions,
  getVisiblePopovers,
  normalizeText,
  pressKey,
} from './helpers'
import type { WidgetAdapter } from './types'

export interface AriaEngineHints {
  /** Extra containers to treat as popovers, beyond the standard ARIA roles. */
  popoverSelector?: string
}

const isDisabledCell = (cell: HTMLElement): boolean =>
  cell.hasAttribute('disabled') || cell.getAttribute('aria-disabled') === 'true' || cell.hasAttribute('data-disabled')

/** Dispatches Escape to close a popover that stayed open after a failed interaction. */
const escapeOut = (elem: HTMLElement) => {
  pressKey(document.activeElement instanceof HTMLElement ? document.activeElement : elem, 'Escape')
}

const openPopover = async (trigger: HTMLElement, popoverSelector: string): Promise<HTMLElement | undefined> => {
  const popoversBefore = new Set<Element>(getVisiblePopovers(popoverSelector))

  clickLikeUser(trigger)
  await waitForSettle(document.body, { quietMs: 120, timeoutMs: 1500 })

  return findOpenedPopover(trigger, popoversBefore, popoverSelector)
}

const fillOptionPicker = async (elem: HTMLElement, popoverSelector: string): Promise<boolean> => {
  const popover = await openPopover(elem, popoverSelector)
  if (!popover) return false

  const options = getSelectableOptions(popover)
  if (options.length === 0) {
    escapeOut(elem)
    return false
  }

  // Empty string = no Action/rule matched (generateValue has no options to pick
  // from for a non-native element) → random option, mirroring native selects.
  const targetValue = (await generateValue({ type: 'select', elem })) as string
  const option = findOptionByText(options, targetValue) ?? faker.helpers.arrayElement(options)

  clickLikeUser(option)
  await waitForSettle(document.body, { quietMs: 100, timeoutMs: 800 })

  if (popover.isConnected && isElementVisible(popover)) escapeOut(elem)
  return true
}

const fillCalendar = async (elem: HTMLElement, popoverSelector: string): Promise<boolean> => {
  const popover = await openPopover(elem, popoverSelector)
  if (!popover) return false

  // Day cells: buttons inside the date grid whose text is a bare day number.
  const cells = Array.from(
    popover.querySelectorAll('[role="gridcell"], [role="gridcell"] button, [role="grid"] button'),
  ).filter(
    (cell): cell is HTMLElement =>
      cell instanceof HTMLElement &&
      isElementVisible(cell) &&
      !isDisabledCell(cell) &&
      /^\d{1,2}$/.test(normalizeText(cell.textContent)),
  )

  if (cells.length === 0) {
    escapeOut(elem)
    return false
  }

  // An Action/rule can pin an exact date; otherwise generateValue produces a
  // recent ISO date whose day-of-month picks the cell in the shown month.
  const dateStr = (await generateValue({ type: 'date', elem })) as string
  const parsed = new Date(dateStr)
  const day = Number.isNaN(parsed.getTime()) ? undefined : String(parsed.getDate())

  const leafCells = cells.filter((cell) => !cells.some((other) => other !== cell && cell.contains(other)))
  const target = day ? leafCells.find((cell) => normalizeText(cell.textContent) === day) : undefined
  const cell = target ?? leafCells[Math.floor(leafCells.length / 2)]

  clickLikeUser(cell)
  await waitForSettle(document.body, { quietMs: 100, timeoutMs: 800 })

  if (popover.isConnected && isElementVisible(popover)) escapeOut(elem)
  return true
}

const fillSwitch = async (elem: HTMLElement): Promise<boolean> => {
  const desired = await generateValue({ type: 'checkbox', elem })
  const desiredChecked = typeof desired === 'boolean' ? desired : String(desired ?? '').toLowerCase() === 'true'
  const currentlyChecked = elem.getAttribute('aria-checked') === 'true'

  if (desiredChecked !== currentlyChecked) clickLikeUser(elem)
  return true
}

const fillRadiogroup = async (elem: HTMLElement): Promise<boolean> => {
  const radios = Array.from(elem.querySelectorAll('[role="radio"]')).filter(
    (radio): radio is HTMLElement =>
      radio instanceof HTMLElement && isElementVisible(radio) && radio.getAttribute('aria-disabled') !== 'true',
  )
  if (radios.length === 0) return false

  // Respect an existing selection, mirroring native radio behavior.
  if (radios.some((radio) => radio.getAttribute('aria-checked') === 'true')) return true

  const targetValue = (await generateValue({ type: 'select', elem })) as string
  const radio = findOptionByText(radios, targetValue) ?? faker.helpers.arrayElement(radios)

  clickLikeUser(radio)
  return true
}

const fillSliderOrSpinbutton = async (elem: HTMLElement): Promise<boolean> => {
  // Keyboard stepping is the only value-setting mechanism every ARIA slider and
  // spinbutton implementation honors; an exact target value is not supported here.
  elem.focus?.({ preventScroll: true })

  const presses = faker.number.int({ min: 1, max: 10 })
  for (let i = 0; i < presses; i++) {
    pressKey(elem, 'ArrowRight')
  }

  return true
}

/** The standards-based widget flow. Specific adapters delegate here with hints. */
export const fillWidgetWithAria = async (elem: HTMLElement, hints: AriaEngineHints = {}): Promise<boolean> => {
  const popoverSelector = hints.popoverSelector ?? POPOVER_SELECTOR

  switch (getWidgetKind(elem)) {
    case 'option-picker':
      return fillOptionPicker(elem, popoverSelector)
    case 'calendar':
      return fillCalendar(elem, popoverSelector)
    case 'switch':
      return fillSwitch(elem)
    case 'radiogroup':
      return fillRadiogroup(elem)
    case 'slider':
    case 'spinbutton':
      return fillSliderOrSpinbutton(elem)
    default:
      log('Widget kind not recognized, skipping')
      return false
  }
}

/** Universal fallback adapter — pure ARIA semantics, no library-specific knowledge. */
export const ariaAdapter: WidgetAdapter = {
  name: 'aria',
  detect: () => true,
  fill: (elem) => fillWidgetWithAria(elem),
}
