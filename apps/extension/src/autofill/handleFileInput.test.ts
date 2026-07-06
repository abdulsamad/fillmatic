import { afterEach, describe, expect, it, vi } from 'vitest'

import { handleFileInput } from '@/autofill/handleFileInput'

afterEach(() => {
  vi.restoreAllMocks()
})

// jsdom's real `files` setter strictly requires a native FileList, which can't be
// constructed in tests. Override it on the instance so assignment just stores the value.
const stubFilesProperty = (input: HTMLInputElement) => {
  let stored: FileList | null = null
  Object.defineProperty(input, 'files', {
    get: () => stored,
    set: (value) => {
      stored = value
    },
    configurable: true,
  })
  return input
}

describe('handleFileInput', () => {
  it('picks a random default type (txt/jpg/csv) when no accept attribute is set', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0) // -> first of ['txt', 'jpg', 'csv']
    const input = stubFilesProperty(document.createElement('input'))
    input.type = 'file'

    await handleFileInput(input)

    expect(input.files).not.toBeNull()
    expect(input.files?.[0].name).toBe('sample.txt')
    expect(input.files?.[0].type).toBe('text/plain')
  })

  it('uses the single matching accept type without needing a random pick', async () => {
    const input = stubFilesProperty(document.createElement('input'))
    input.type = 'file'
    input.accept = '.png'

    await handleFileInput(input)

    expect(input.files?.[0].name).toBe('sample.png')
    expect(input.files?.[0].type).toBe('image/png')
  })

  it('maps a mime-type accept value (e.g. image/*) to its sample file', async () => {
    const input = stubFilesProperty(document.createElement('input'))
    input.type = 'file'
    input.accept = 'image/*'

    await handleFileInput(input)

    expect(input.files?.[0].name).toBe('sample.jpg')
  })

  it('falls back to a random supported type when no accept type matches', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0) // -> first supported type ("aac")
    const input = stubFilesProperty(document.createElement('input'))
    input.type = 'file'
    input.accept = '.exe'

    await handleFileInput(input)

    expect(input.files?.[0].name).toBe('sample.aac')
  })

  it('dispatches change, input, focus, and blur events on the input', async () => {
    const input = stubFilesProperty(document.createElement('input'))
    input.type = 'file'
    const seen: string[] = []
    ;['change', 'input', 'focus', 'blur'].forEach((type) => input.addEventListener(type, () => seen.push(type)))

    await handleFileInput(input)

    expect(seen).toEqual(['change', 'input', 'focus', 'blur'])
  })
})
