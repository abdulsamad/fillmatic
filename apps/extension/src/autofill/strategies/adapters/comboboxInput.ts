import { faker } from '@faker-js/faker'

import { waitForSettle } from '../../waitForSettle'
import { isElementVisible } from '../../gatherVisibleInputsInOrder'
import { clickLikeUser, findOpenedPopover, findOptionByText, getSelectableOptions, getVisiblePopovers, pressKey } from './helpers'

/**
 * Autocomplete-style comboboxes put `role="combobox"` on a *native text input*
 * (react-select, MUI Autocomplete, downshift, cmdk, Ant Design). Typing a word into
 * them never commits a value — an option must be picked from the popup. The native
 * strategy calls this before falling back to plain typing.
 */
export const isComboboxTextInput = (elem: Element): elem is HTMLInputElement =>
  elem instanceof HTMLInputElement &&
  (elem.getAttribute('role') === 'combobox' || elem.getAttribute('aria-autocomplete') === 'list')

/**
 * Opens the input's option popup and picks an option (matching `targetValue` when the
 * Action/rule pinned one, random otherwise). Returns false when no popup or options
 * appear so the caller can fall back to plain typing.
 */
export const fillComboboxInput = async (elem: HTMLInputElement, targetValue: string): Promise<boolean> => {
  const popoversBefore = new Set<Element>(getVisiblePopovers())

  elem.focus?.({ preventScroll: true })
  clickLikeUser(elem)
  await waitForSettle(document.body, { quietMs: 120, timeoutMs: 1500 })

  const popover = findOpenedPopover(elem, popoversBefore)
  if (!popover) return false

  const options = getSelectableOptions(popover)
  if (options.length === 0) {
    pressKey(elem, 'Escape')
    return false
  }

  const option = findOptionByText(options, targetValue) ?? faker.helpers.arrayElement(options)

  clickLikeUser(option)
  await waitForSettle(document.body, { quietMs: 100, timeoutMs: 800 })

  if (popover.isConnected && isElementVisible(popover)) pressKey(elem, 'Escape')
  return true
}
