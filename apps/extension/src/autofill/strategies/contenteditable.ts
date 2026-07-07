import { isContentEditable, typeWithEffect } from '@/utils'

import { generateValue } from '../generateValue'
import type { FillStrategy } from './types'

/**
 * Fills contenteditable hosts. Currently routes through typeWithEffect so input
 * events fire (raw textContent write) — the rich-editor overhaul (ProseMirror,
 * Lexical, Slate, Quill insertion paths) lands here.
 */
export const contenteditableStrategy: FillStrategy = {
  name: 'contenteditable',

  canHandle: (elem) => isContentEditable(elem),

  fill: async (elem) => {
    const value = await generateValue({ type: 'contenteditable', elem })
    await typeWithEffect((value ?? '') as string, elem as HTMLElement, true)
    return true
  },
}
