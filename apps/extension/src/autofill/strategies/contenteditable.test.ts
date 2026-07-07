import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { generateValue } = vi.hoisted(() => ({ generateValue: vi.fn() }))
vi.mock('@/autofill/generateValue', () => ({ generateValue }))

import { useConfigStore } from '@/store/config'
import {
  contenteditableStrategy,
  getEditorKind,
  insertIntoContenteditable,
} from '@/autofill/strategies/contenteditable'

const buildHost = (setup?: (host: HTMLElement) => void) => {
  const host = document.createElement('div')
  host.setAttribute('contenteditable', 'true')
  setup?.(host)
  document.body.appendChild(host)
  return host
}

beforeEach(() => {
  generateValue.mockReset()
  useConfigStore.setState({ typingEffect: false, forceAutofill: false })
})

afterEach(() => {
  document.body.innerHTML = ''
})

describe('getEditorKind', () => {
  it('recognizes each rich-editor marker', () => {
    const prosemirror = document.createElement('div')
    prosemirror.className = 'ProseMirror'
    expect(getEditorKind(prosemirror)).toBe('prosemirror')

    const lexical = document.createElement('div')
    lexical.setAttribute('data-lexical-editor', 'true')
    expect(getEditorKind(lexical)).toBe('lexical')

    const slate = document.createElement('div')
    slate.setAttribute('data-slate-editor', 'true')
    expect(getEditorKind(slate)).toBe('slate')

    const quill = document.createElement('div')
    quill.className = 'ql-editor'
    expect(getEditorKind(quill)).toBe('quill')

    const trix = document.createElement('trix-editor')
    expect(getEditorKind(trix)).toBe('trix')
  })

  it('falls back to plain for unmarked hosts', () => {
    expect(getEditorKind(document.createElement('div'))).toBe('plain')
  })
})

describe('insertIntoContenteditable', () => {
  it('prefers execCommand insertText when the document honors it', () => {
    const host = buildHost()
    const execCommand = vi.fn((command: string, _ui: boolean, value: string) => {
      host.textContent = value
      return true
    })
    document.execCommand = execCommand as unknown as typeof document.execCommand

    const inputEvents: Event[] = []
    host.addEventListener('input', (e) => inputEvents.push(e))

    insertIntoContenteditable(host, 'hello')

    expect(execCommand).toHaveBeenCalledWith('insertText', false, 'hello')
    expect(host.textContent).toBe('hello')
    // execCommand path: the browser/editor dispatches its own events, we add none.
    expect(inputEvents).toHaveLength(0)

    delete (document as { execCommand?: unknown }).execCommand
  })

  it('stops after a canceled beforeinput — the editor owns the insertion', () => {
    const host = buildHost()
    host.addEventListener('beforeinput', (e) => e.preventDefault())

    const inputEvents: Event[] = []
    host.addEventListener('input', (e) => inputEvents.push(e))

    insertIntoContenteditable(host, 'hello')

    // Nothing written directly and no synthetic input: the editor applied the
    // intent to its own model when it canceled the event.
    expect(host.textContent).toBe('')
    expect(inputEvents).toHaveLength(0)
  })

  it('falls back to Range insertion and dispatches an insertText input event', () => {
    const host = buildHost()

    const inputEvents: InputEvent[] = []
    host.addEventListener('input', (e) => inputEvents.push(e as InputEvent))

    insertIntoContenteditable(host, 'hello')

    expect(host.textContent).toBe('hello')
    expect(inputEvents).toHaveLength(1)
    expect(inputEvents[0].inputType).toBe('insertText')
    expect(inputEvents[0].data).toBe('hello')
  })

  it('replaces existing content instead of appending to it', () => {
    const host = buildHost((h) => {
      h.textContent = 'placeholder'
    })

    insertIntoContenteditable(host, 'fresh')

    expect(host.textContent).toBe('fresh')
  })
})

describe('contenteditableStrategy', () => {
  it('handles editable hosts (including plaintext-only) but not plain divs', () => {
    const host = document.createElement('div')
    host.setAttribute('contenteditable', 'true')
    expect(contenteditableStrategy.canHandle(host)).toBe(true)

    const plaintext = document.createElement('div')
    plaintext.setAttribute('contenteditable', 'plaintext-only')
    expect(contenteditableStrategy.canHandle(plaintext)).toBe(true)

    expect(contenteditableStrategy.canHandle(document.createElement('div'))).toBe(false)
  })

  it('skips a host that already has content when forceAutofill is off', async () => {
    const host = buildHost((h) => {
      h.textContent = 'user wrote this'
    })

    await expect(contenteditableStrategy.fill(host)).resolves.toBe(true)

    expect(generateValue).not.toHaveBeenCalled()
    expect(host.textContent).toBe('user wrote this')
  })

  it('refills a non-empty host when forceAutofill is on', async () => {
    useConfigStore.setState({ forceAutofill: true })
    generateValue.mockResolvedValue('generated sentence')
    const host = buildHost((h) => {
      h.textContent = 'stale'
    })

    await contenteditableStrategy.fill(host)

    expect(host.textContent).toBe('generated sentence')
  })

  it('fills a plain host through the typing path', async () => {
    generateValue.mockResolvedValue('generated sentence')
    const host = buildHost()

    await expect(contenteditableStrategy.fill(host)).resolves.toBe(true)

    expect(generateValue).toHaveBeenCalledWith({ type: 'contenteditable', elem: host })
    expect(host.textContent).toBe('generated sentence')
  })

  it('fills a rich editor via a single editor-aware insertion, not per-char typing', async () => {
    useConfigStore.setState({ typingEffect: true })
    generateValue.mockResolvedValue('generated sentence')

    const host = buildHost((h) => {
      h.className = 'ql-editor'
    })

    const inputEvents: InputEvent[] = []
    host.addEventListener('input', (e) => inputEvents.push(e as InputEvent))

    await expect(contenteditableStrategy.fill(host)).resolves.toBe(true)

    expect(host.textContent).toBe('generated sentence')
    // Whole-value insertion: one input event carrying the full text, not one per character.
    expect(inputEvents).toHaveLength(1)
    expect(inputEvents[0].data).toBe('generated sentence')
  })
})
