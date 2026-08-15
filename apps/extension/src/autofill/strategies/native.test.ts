import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  generateValue: vi.fn(),
  getEffectiveConfig: vi.fn(),
  log: vi.fn(),
  typeWithEffect: vi.fn().mockResolvedValue(undefined),
  matchElement: vi.fn().mockReturnValue(false),
  triggerEvent: vi.fn(),
  setNativeValue: vi.fn(),
  setNativeChecked: vi.fn(),
  fillComboboxInput: vi.fn().mockResolvedValue(false),
  handleFileInput: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/store/profiles', () => ({ getEffectiveConfig: mocks.getEffectiveConfig }))
vi.mock('@/autofill/generateValue', () => ({ generateValue: mocks.generateValue }))
vi.mock('@/autofill/handleFileInput', () => ({ handleFileInput: mocks.handleFileInput }))
vi.mock('@/autofill/strategies/adapters/comboboxInput', () => ({
  isComboboxTextInput: (elem: Element) => elem.getAttribute('role') === 'combobox',
  fillComboboxInput: mocks.fillComboboxInput,
}))
vi.mock('@/utils', () => ({
  log: mocks.log,
  typeWithEffect: mocks.typeWithEffect,
  getElementType: (elem: Element) => {
    if (elem instanceof HTMLInputElement) return elem.type
    if (elem instanceof HTMLSelectElement) return 'select'
    if (elem instanceof HTMLTextAreaElement) return 'textarea'
    return ''
  },
  isSupportedInput: (elem: Element) =>
    elem instanceof HTMLInputElement || elem instanceof HTMLSelectElement || elem instanceof HTMLTextAreaElement,
  matchElement: mocks.matchElement,
  triggerEvent: mocks.triggerEvent,
  setNativeValue: mocks.setNativeValue,
  setNativeChecked: mocks.setNativeChecked,
}))

import { nativeInputStrategy } from '@/autofill/strategies/native'

beforeEach(() => {
  vi.clearAllMocks()
  mocks.getEffectiveConfig.mockReturnValue({ ignoredFields: 'captcha', forceAutofill: false })
  mocks.generateValue.mockResolvedValue('generated')
  mocks.fillComboboxInput.mockResolvedValue(false)
  mocks.matchElement.mockReturnValue(false)
})

describe('nativeInputStrategy', () => {
  it('only handles native form controls', () => {
    expect(nativeInputStrategy.canHandle(document.createElement('input'))).toBe(true)
    expect(nativeInputStrategy.canHandle(document.createElement('textarea'))).toBe(true)
    expect(nativeInputStrategy.canHandle(document.createElement('select'))).toBe(true)
    expect(nativeInputStrategy.canHandle(document.createElement('div'))).toBe(false)
  })

  it('returns false when fill is called with a non-native element', async () => {
    await expect(nativeInputStrategy.fill(document.createElement('div'))).resolves.toBe(false)
  })

  it.each(['button', 'submit', 'reset', 'hidden', 'image', 'file'])(
    'treats non-fillable input type %s as handled without generating a value',
    async (type) => {
      const input = document.createElement('input')
      input.type = type
      await expect(nativeInputStrategy.fill(input)).resolves.toBe(true)
      expect(mocks.generateValue).not.toHaveBeenCalled()
    },
  )

  it('skips fields matched by the ignored-fields configuration', async () => {
    mocks.matchElement.mockReturnValue(true)
    const input = document.createElement('input')

    await expect(nativeInputStrategy.fill(input)).resolves.toBe(true)

    expect(mocks.log).toHaveBeenCalledWith(expect.stringContaining('ignored in settings'))
    expect(mocks.generateValue).not.toHaveBeenCalled()
  })

  it('preserves an existing value unless force-autofill is enabled', async () => {
    const input = document.createElement('input')
    input.value = 'user value'
    await nativeInputStrategy.fill(input)
    expect(mocks.generateValue).not.toHaveBeenCalled()

    mocks.getEffectiveConfig.mockReturnValue({ ignoredFields: '', forceAutofill: true })
    await nativeInputStrategy.fill(input)
    expect(mocks.generateValue).toHaveBeenCalled()
    expect(mocks.typeWithEffect).toHaveBeenCalledWith('generated', input, true)
  })

  it('sets checkbox values from booleans, strings, and null safely', async () => {
    for (const [value, expected] of [
      [true, true],
      ['TRUE', true],
      [null, false],
    ] as const) {
      mocks.generateValue.mockResolvedValueOnce(value)
      const checkbox = document.createElement('input')
      checkbox.type = 'checkbox'
      await nativeInputStrategy.fill(checkbox)
      expect(mocks.setNativeChecked).toHaveBeenLastCalledWith(checkbox, expected)
    }
    expect(mocks.triggerEvent).toHaveBeenCalledWith(expect.any(HTMLInputElement), 'change')
  })

  it('does not replace a checked member of an existing radio group', async () => {
    const selected = document.createElement('input')
    selected.type = 'radio'
    selected.name = 'plan'
    selected.checked = true
    const candidate = document.createElement('input')
    candidate.type = 'radio'
    candidate.name = 'plan'
    document.body.append(selected, candidate)

    await nativeInputStrategy.fill(candidate)

    expect(mocks.setNativeChecked).not.toHaveBeenCalled()
    expect(mocks.triggerEvent).toHaveBeenCalledWith(candidate, 'input')
  })

  it.each(['color', 'select'] as const)('sets %s values once and dispatches the lifecycle', async (type) => {
    const elem = type === 'select' ? document.createElement('select') : document.createElement('input')
    if (elem instanceof HTMLInputElement) elem.type = 'color'

    await nativeInputStrategy.fill(elem)

    expect(mocks.setNativeValue).toHaveBeenCalledWith(elem, 'generated')
    expect(mocks.triggerEvent).toHaveBeenCalledWith(elem, 'blur')
    expect(mocks.typeWithEffect).not.toHaveBeenCalled()
  })

  it('commits autocomplete combobox options without plain typing', async () => {
    mocks.fillComboboxInput.mockResolvedValue(true)
    const input = document.createElement('input')
    input.setAttribute('role', 'combobox')

    await nativeInputStrategy.fill(input)

    expect(mocks.fillComboboxInput).toHaveBeenCalledWith(input, 'generated')
    expect(mocks.typeWithEffect).not.toHaveBeenCalled()
  })

  it('falls back to typing when a combobox does not open and disables typing effects for date-like fields', async () => {
    const combo = document.createElement('input')
    combo.setAttribute('role', 'combobox')
    await nativeInputStrategy.fill(combo)
    expect(mocks.typeWithEffect).toHaveBeenCalledWith('generated', combo, true)

    const date = document.createElement('input')
    date.type = 'date'
    await nativeInputStrategy.fill(date)
    expect(mocks.typeWithEffect).toHaveBeenCalledWith('generated', date, false)
  })

  it('normalizes an undefined generated value before typing', async () => {
    mocks.generateValue.mockResolvedValue(undefined)
    const input = document.createElement('input')
    await nativeInputStrategy.fill(input)
    expect(mocks.typeWithEffect).toHaveBeenCalledWith('', input, true)
  })
})
