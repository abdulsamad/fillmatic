import { isWidgetElement, log } from '@/utils'

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
    const adapter = widgetAdapters.find((a) => a.detect(elem as HTMLElement))
    if (!adapter) return false

    const filled = await adapter.fill(elem as HTMLElement)
    if (!filled) log(`Widget adapter '${adapter.name}' could not fill element, skipping`)

    // Handled either way: a failed widget interaction should be skipped, not
    // retried by another strategy that would mis-treat the element.
    return true
  },
}
