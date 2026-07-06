import { beforeEach, describe, expect, it, vi } from 'vitest'

const { generateValue } = vi.hoisted(() => ({ generateValue: vi.fn() }))
const { handleFileInput } = vi.hoisted(() => ({ handleFileInput: vi.fn().mockResolvedValue(undefined) }))
const { typeWithEffect } = vi.hoisted(() => ({ typeWithEffect: vi.fn().mockResolvedValue(undefined) }))

vi.mock('./generateValue', () => ({ generateValue }))
vi.mock('@/autofill', () => ({ handleFileInput }))
vi.mock('@/utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/utils')>()
  return { ...actual, typeWithEffect }
})

import { fillElement } from '@/autofill/fillElement'
import { DEFAULT_CONFIG } from '@/consts'
import { useConfigStore } from '@/store/config'
import { DEFAULT_PROFILE, DEFAULT_PROFILE_ID, useProfileStore } from '@/store/profiles'

beforeEach(() => {
  vi.clearAllMocks()
  generateValue.mockResolvedValue('generated-value')
  typeWithEffect.mockResolvedValue(undefined)
  handleFileInput.mockResolvedValue(undefined)
  useConfigStore.setState({ ...DEFAULT_CONFIG }, false)
  useProfileStore.setState({ profiles: [DEFAULT_PROFILE], activeProfileId: DEFAULT_PROFILE_ID })
  document.body.innerHTML = ''
})

describe('fillElement — ignored element types', () => {
  it.each(['button', 'submit', 'reset', 'hidden', 'image'])('does nothing for a %s input', async (type) => {
    const input = document.createElement('input')
    input.type = type
    document.body.appendChild(input)

    await fillElement({ elem: input })

    expect(generateValue).not.toHaveBeenCalled()
  })
})

describe('fillElement — ignoredFields config', () => {
  it('skips a field whose name/id matches the configured ignoredFields list', async () => {
    useConfigStore.setState({ ignoredFields: 'promo' })
    const input = document.createElement('input')
    input.name = 'promo_code'
    document.body.appendChild(input)

    await fillElement({ elem: input })

    expect(generateValue).not.toHaveBeenCalled()
  })
})

describe('fillElement — existing value guard', () => {
  it('skips a text field that already has a value when forceAutofill is off', async () => {
    const input = document.createElement('input')
    input.value = 'existing'
    document.body.appendChild(input)

    await fillElement({ elem: input })

    expect(generateValue).not.toHaveBeenCalled()
    expect(input.value).toBe('existing')
  })

  it('fills a text field that already has a value when forceAutofill is on', async () => {
    useConfigStore.setState({ forceAutofill: true })
    const input = document.createElement('input')
    input.value = 'existing'
    document.body.appendChild(input)

    await fillElement({ elem: input })

    expect(generateValue).toHaveBeenCalled()
  })

  it('fills a select even with an existing value and forceAutofill off (exempt type)', async () => {
    const select = document.createElement('select')
    const optionA = document.createElement('option')
    optionA.value = 'a'
    const optionB = document.createElement('option')
    optionB.value = 'b'
    select.append(optionA, optionB)
    select.value = 'a'
    document.body.appendChild(select)
    generateValue.mockResolvedValue('b')

    await fillElement({ elem: select })

    expect(generateValue).toHaveBeenCalled()
    expect(select.value).toBe('b')
  })
})

describe('fillElement — file inputs', () => {
  // 'file' is included in the early ignore-list (alongside button/submit/etc.), so the
  // `type === 'file'` branch further down that calls handleFileInput is currently
  // unreachable — matches the source's own "TODO: Enable file input handling" comment.
  it('does nothing for a file input (handleFileInput is not currently reachable)', async () => {
    const input = document.createElement('input')
    input.type = 'file'
    document.body.appendChild(input)

    await fillElement({ elem: input })

    expect(handleFileInput).not.toHaveBeenCalled()
    expect(generateValue).not.toHaveBeenCalled()
  })
})

describe('fillElement — checkbox/radio groups', () => {
  it('checks the element when generateValue resolves true and no sibling in the group is already checked', async () => {
    const checkbox = document.createElement('input')
    checkbox.type = 'checkbox'
    checkbox.name = 'accept'
    document.body.appendChild(checkbox)
    generateValue.mockResolvedValue(true)

    const events: string[] = []
    ;['input', 'change', 'blur'].forEach((t) => checkbox.addEventListener(t, () => events.push(t)))

    await fillElement({ elem: checkbox })

    expect(checkbox.checked).toBe(true)
    expect(events).toEqual(['input', 'change', 'blur'])
  })

  it('does not re-toggle a checkbox group that already has a checked member, but still fires events', async () => {
    const container = document.createElement('div')
    const a = document.createElement('input')
    a.type = 'checkbox'
    a.name = 'color'
    a.checked = true
    const b = document.createElement('input')
    b.type = 'checkbox'
    b.name = 'color'
    container.append(a, b)
    document.body.appendChild(container)

    const events: string[] = []
    ;['input', 'change', 'blur'].forEach((t) => b.addEventListener(t, () => events.push(t)))

    await fillElement({ elem: b })

    expect(b.checked).toBe(false)
    expect(events).toEqual(['input', 'change', 'blur'])
  })

  it('selects a radio when generateValue resolves true', async () => {
    const radio = document.createElement('input')
    radio.type = 'radio'
    radio.name = 'plan'
    document.body.appendChild(radio)
    generateValue.mockResolvedValue(true)

    await fillElement({ elem: radio })

    expect(radio.checked).toBe(true)
  })
})

describe('fillElement — color/select native-set path', () => {
  it('sets a color input value once and fires input/change/blur (no typing effect)', async () => {
    const input = document.createElement('input')
    input.type = 'color'
    document.body.appendChild(input)
    generateValue.mockResolvedValue('#ff0000')

    await fillElement({ elem: input })

    expect(input.value).toBe('#ff0000')
    expect(typeWithEffect).not.toHaveBeenCalled()
  })
})

describe('fillElement — default typing path', () => {
  it('routes plain text inputs through typeWithEffect with the typing effect enabled', async () => {
    const input = document.createElement('input')
    document.body.appendChild(input)
    generateValue.mockResolvedValue('hello')

    await fillElement({ elem: input })

    expect(typeWithEffect).toHaveBeenCalledWith('hello', input, true)
  })

  it.each(['week', 'month', 'date', 'time', 'datetime-local'])(
    'disables the typing effect for a %s input',
    async (type) => {
      const input = document.createElement('input')
      input.type = type
      document.body.appendChild(input)
      generateValue.mockResolvedValue('2024-01-01')

      await fillElement({ elem: input })

      expect(typeWithEffect).toHaveBeenCalledWith('2024-01-01', input, false)
    },
  )

  it('routes contenteditable elements through typeWithEffect using generated contenteditable value', async () => {
    const div = document.createElement('div')
    div.contentEditable = 'true'
    document.body.appendChild(div)
    generateValue.mockResolvedValue('editable content')

    await fillElement({ elem: div })

    expect(generateValue).toHaveBeenCalledWith({ type: 'contenteditable', elem: div })
    expect(typeWithEffect).toHaveBeenCalledWith('editable content', div, true)
  })
})

describe('fillElement — error resilience', () => {
  it('logs and does not throw when generateValue rejects', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    generateValue.mockRejectedValue(new Error('boom'))
    const input = document.createElement('input')
    document.body.appendChild(input)

    await expect(fillElement({ elem: input })).resolves.toBeUndefined()

    expect(errorSpy).toHaveBeenCalledWith('Errored Element', input)
  })
})
