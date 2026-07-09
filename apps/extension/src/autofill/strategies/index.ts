import { nativeInputStrategy } from './native'
import { contenteditableStrategy } from './contenteditable'
import { widgetStrategy } from './widget'
import type { FillStrategy } from './types'

export type { FillStrategy } from './types'
export { nativeInputStrategy } from './native'
export { contenteditableStrategy } from './contenteditable'
export { widgetStrategy } from './widget'

/** Dispatch order: cheap/reliable native writes first, widgets as the last resort. */
export const strategies: FillStrategy[] = [nativeInputStrategy, contenteditableStrategy, widgetStrategy]
