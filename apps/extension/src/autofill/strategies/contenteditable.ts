import { getEffectiveConfig } from '@/store/profiles'
import { isContentEditable, log, typeWithEffect } from '@/utils'

import { generateValue } from '../generateValue'
import type { FillStrategy } from './types'

export type EditorKind = 'prosemirror' | 'lexical' | 'slate' | 'quill' | 'trix' | 'plain'

/**
 * Rich editors keep their own document model — overwriting the DOM with
 * `textContent` desyncs it. Each library stamps a marker on its editable host;
 * anything unrecognized is treated as plain contenteditable.
 */
export const getEditorKind = (elem: HTMLElement): EditorKind => {
  if (elem.classList.contains('ProseMirror')) return 'prosemirror'
  if (elem.hasAttribute('data-lexical-editor')) return 'lexical'
  if (elem.hasAttribute('data-slate-editor')) return 'slate'
  if (elem.classList.contains('ql-editor')) return 'quill'
  if (elem.tagName === 'TRIX-EDITOR') return 'trix'
  return 'plain'
}

/** Selects the host's whole content so the insertion replaces placeholder markup. */
const selectContents = (elem: HTMLElement) => {
  const selection = elem.ownerDocument.defaultView?.getSelection()
  if (!selection) return

  const range = elem.ownerDocument.createRange()
  range.selectNodeContents(elem)
  selection.removeAllRanges()
  selection.addRange(range)
}

/**
 * Inserts text the way editors expect instead of overwriting the DOM. Tried in order:
 * 1. `execCommand('insertText')` — deprecated but still the most widely honored
 *    programmatic insertion (ProseMirror, Quill and Lexical all translate it into
 *    a transaction on their own model).
 * 2. A cancelable `beforeinput` — editors that intercept input (Slate, Lexical)
 *    cancel it and apply the insertion to their model themselves.
 * 3. Manual Range insertion at the selection + an `input` event.
 * 4. Raw `textContent` write for hosts with no usable selection.
 */
export const insertIntoContenteditable = (elem: HTMLElement, value: string): void => {
  elem.focus?.({ preventScroll: true })
  elem.dispatchEvent(new FocusEvent('focus', { bubbles: true }))
  selectContents(elem)

  const before = elem.textContent ?? ''

  try {
    if (elem.ownerDocument.execCommand?.('insertText', false, value) && (elem.textContent ?? '') !== before) {
      return
    }
  } catch {
    // Not implemented or refused — fall through to the event-based path.
  }

  const accepted = elem.dispatchEvent(
    new InputEvent('beforeinput', { inputType: 'insertText', data: value, bubbles: true, cancelable: true }),
  )
  // Canceled = the editor intercepted the intent and applied it to its own model.
  if (!accepted) return

  const selection = elem.ownerDocument.defaultView?.getSelection()
  const range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null

  if (range && elem.contains(range.commonAncestorContainer)) {
    range.deleteContents()
    range.insertNode(elem.ownerDocument.createTextNode(value))
    range.collapse(false)
  } else {
    elem.textContent = value
  }

  elem.dispatchEvent(new InputEvent('input', { inputType: 'insertText', data: value, bubbles: true }))
}

/**
 * Fills contenteditable hosts. Plain editable elements keep the typed-input feel via
 * typeWithEffect; recognized rich editors get a single editor-aware insertion (per-char
 * textContent writes desync their internal model).
 */
export const contenteditableStrategy: FillStrategy = {
  name: 'contenteditable',

  canHandle: (elem) => isContentEditable(elem),

  fill: async (elem) => {
    const host = elem as HTMLElement
    const config = getEffectiveConfig()

    // Mirror native inputs: leave existing content alone unless forceAutofill is on.
    if (!config.forceAutofill && (host.textContent ?? '').trim()) {
      log('Skipping contenteditable as it already has content')
      return true
    }

    const value = ((await generateValue({ type: 'contenteditable', elem })) ?? '') as string

    if (getEditorKind(host) === 'plain') {
      await typeWithEffect(value, host, true)
      return true
    }

    insertIntoContenteditable(host, value)

    host.dispatchEvent(new FocusEvent('blur', { bubbles: true }))
    host.blur?.()
    return true
  },
}
