import { isWidgetElement, log } from '@/utils'

import { findRecipeFor, runRecipeForElement, wasRecipeHandled } from '../recipes'
import { widgetAdapters } from './adapters'
import type { FillStrategy } from './types'

/**
 * Fills custom framework widgets (ARIA comboboxes, date-picker triggers, switches,
 * sliders, radio groups) by driving them like a user: open, wait for the popover to
 * settle, pick an option, confirm. A failure skips the field — it never aborts the
 * surrounding run or affects native fills.
 */
export const widgetStrategy: FillStrategy = {
  name: 'widget',

  canHandle: (elem) => isWidgetElement(elem),

  fill: async (elem) => {
    const host = elem as HTMLElement

    // A recipe pass may already have driven this element in the current run.
    if (wasRecipeHandled(host)) return true

    // User recipes outrank built-in adapters (single-element fills have no
    // recipe pass, so the lookup happens here too).
    const recipe = findRecipeFor(host)
    if (recipe) {
      await runRecipeForElement(host, recipe)
      return true
    }

    const adapter = widgetAdapters.find((a) => a.detect(host))
    if (!adapter) return false

    const filled = await adapter.fill(host)
    if (!filled) log(`Widget adapter '${adapter.name}' could not fill element, skipping`)

    // Handled either way: a failed widget interaction should be skipped, not
    // retried by another strategy that would mis-treat the element.
    return true
  },
}
