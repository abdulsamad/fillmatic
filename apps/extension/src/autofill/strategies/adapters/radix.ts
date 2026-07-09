import { isWidgetElement } from '@/utils'

import { POPOVER_SELECTOR } from './helpers'
import { fillWidgetWithAria } from './aria'
import type { WidgetAdapter } from './types'

/**
 * Radix UI / shadcn (Select, Combobox, Popover-based Calendar). Radix follows the
 * ARIA authoring practices closely, so this delegates to the generic engine — the
 * hint just widens popover detection to Radix's popper wrapper, whose inner content
 * carries the role but can render outside the standard containers mid-animation.
 */
export const radixAdapter: WidgetAdapter = {
  name: 'radix',

  detect: (elem) => elem.hasAttribute('data-state') && isWidgetElement(elem),

  fill: (elem) =>
    fillWidgetWithAria(elem, {
      popoverSelector: `${POPOVER_SELECTOR}, [data-radix-popper-content-wrapper] [data-state="open"]`,
    }),
}
