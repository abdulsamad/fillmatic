import { ariaAdapter } from './aria'
import { radixAdapter } from './radix'
import type { WidgetAdapter } from './types'

export type { WidgetAdapter } from './types'
export { ariaAdapter, fillWidgetWithAria } from './aria'
export { radixAdapter } from './radix'
export { fillComboboxInput, isComboboxTextInput } from './comboboxInput'

/**
 * Checked in order; the generic ARIA adapter accepts everything, so it must stay
 * last. Add library-specific adapters (Ant Design, Headless UI…) above it as
 * quirks surface — most libraries follow the ARIA authoring practices closely
 * enough that the generic engine already drives them.
 */
export const widgetAdapters: WidgetAdapter[] = [radixAdapter, ariaAdapter]
