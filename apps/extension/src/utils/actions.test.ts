import { describe, expect, it } from 'vitest'

import {
  type Action,
  type FieldTarget,
  getActionsFromStorage,
  getAttributeValue,
  getMatchingActions,
  matchFieldTarget,
  matchUrl,
  DEFAULT_ACTIONS,
} from './actions'

describe('matchUrl', () => {
  it('matches hostname exactly', () => {
    expect(matchUrl({ type: 'hostname', value: 'example.com' }, 'https://example.com/checkout')).toBe(true)
    expect(matchUrl({ type: 'hostname', value: 'example.com' }, 'https://sub.example.com/checkout')).toBe(false)
  })

  it('returns false for hostname matcher on an invalid URL instead of throwing', () => {
    expect(matchUrl({ type: 'hostname', value: 'example.com' }, 'not-a-url')).toBe(false)
  })

  it('matches startsWith and endsWith', () => {
    expect(
      matchUrl({ type: 'startsWith', value: 'https://checkout.stripe.com' }, 'https://checkout.stripe.com/c/pay/1'),
    ).toBe(true)
    expect(matchUrl({ type: 'endsWith', value: '/checkout' }, 'https://example.com/cart/checkout')).toBe(true)
    expect(matchUrl({ type: 'startsWith', value: 'https://checkout.stripe.com' }, 'https://example.com')).toBe(false)
  })

  it('matches regex and tolerates an invalid pattern', () => {
    expect(
      matchUrl(
        { type: 'regex', value: 'https://[^.]+\\.lemonsqueezy\\.com/checkout' },
        'https://foo.lemonsqueezy.com/checkout',
      ),
    ).toBe(true)
    expect(matchUrl({ type: 'regex', value: '(' }, 'https://example.com')).toBe(false)
  })

  it('fails closed for an unknown matcher type', () => {
    expect(matchUrl({ type: 'unknown' as 'hostname', value: '' }, 'https://example.com')).toBe(false)
  })
})

describe('getMatchingActions', () => {
  const baseAction: Action = {
    id: 'a1',
    name: 'Test action',
    matcher: { type: 'startsWith', value: 'https://example.com' },
    active: true,
    fields: [],
  }

  it('returns only active actions whose matcher accepts the url', () => {
    const actions: Action[] = [
      baseAction,
      { ...baseAction, id: 'a2', active: false },
      { ...baseAction, id: 'a3', matcher: { type: 'startsWith', value: 'https://other.com' } },
    ]

    expect(getMatchingActions(actions, 'https://example.com/page').map((a) => a.id)).toEqual(['a1'])
  })
})

describe('matchFieldTarget', () => {
  const target = (overrides: Partial<FieldTarget>): FieldTarget => ({
    attribute: 'id',
    operator: 'exact',
    match: '',
    value: '',
    ...overrides,
  })

  it('matches by id with the exact operator, case-insensitively', () => {
    const input = document.createElement('input')
    input.id = 'CardNumber'
    expect(matchFieldTarget(input, target({ attribute: 'id', operator: 'exact', match: 'cardnumber' }))).toBe(true)
    expect(matchFieldTarget(input, target({ attribute: 'id', operator: 'exact', match: 'cvv' }))).toBe(false)
  })

  it('matches by name with the contains operator', () => {
    const input = document.createElement('input')
    input.name = 'billing_address_line1'
    expect(matchFieldTarget(input, target({ attribute: 'name', operator: 'contains', match: 'address' }))).toBe(true)
  })

  it('matches by placeholder with the regex operator, failing safe on a bad pattern', () => {
    const input = document.createElement('input')
    input.placeholder = 'MM/YY'
    expect(
      matchFieldTarget(input, target({ attribute: 'placeholder', operator: 'regex', match: '^\\w{2}/\\w{2}$' })),
    ).toBe(true)
    expect(matchFieldTarget(input, target({ attribute: 'placeholder', operator: 'regex', match: '(' }))).toBe(false)
  })

  it('matches by autocomplete attribute', () => {
    const input = document.createElement('input')
    input.autocomplete = 'email'
    expect(matchFieldTarget(input, target({ attribute: 'autocomplete', operator: 'exact', match: 'email' }))).toBe(true)
  })

  it('matches by associated label text', () => {
    const container = document.createElement('div')
    const label = document.createElement('label')
    label.htmlFor = 'field-1'
    label.textContent = 'Card Number'
    const input = document.createElement('input')
    input.id = 'field-1'
    container.append(label, input)
    document.body.appendChild(container)

    expect(matchFieldTarget(input, target({ attribute: 'label', operator: 'contains', match: 'card' }))).toBe(true)

    document.body.removeChild(container)
  })

  it('returns false when the target has an empty match string', () => {
    const input = document.createElement('input')
    input.id = 'anything'
    expect(matchFieldTarget(input, target({ attribute: 'id', operator: 'exact', match: '' }))).toBe(false)
  })

  it('reads attributes from native fields and custom widgets', () => {
    const textarea = document.createElement('textarea')
    textarea.name = 'notes'
    textarea.placeholder = 'Details'
    const widget = document.createElement('button')
    widget.setAttribute('name', 'country')
    widget.setAttribute('placeholder', 'Choose country')
    widget.setAttribute('autocomplete', 'country-name')

    expect(getAttributeValue(textarea, 'name')).toBe('notes')
    expect(getAttributeValue(textarea, 'placeholder')).toBe('Details')
    expect(getAttributeValue(widget, 'name')).toBe('country')
    expect(getAttributeValue(widget, 'placeholder')).toBe('Choose country')
    expect(getAttributeValue(widget, 'autocomplete')).toBe('country-name')
  })

  it('resolves ARIA labels and labelled-by references for custom widgets', () => {
    const label = document.createElement('span')
    label.id = 'country-label'
    label.textContent = 'Billing Country'
    const widget = document.createElement('button')
    widget.setAttribute('aria-labelledby', 'missing country-label')
    document.body.append(label, widget)

    expect(getAttributeValue(widget, 'label')).toBe('Billing Country')
    widget.setAttribute('aria-label', 'Shipping Country')
    expect(getAttributeValue(widget, 'label')).toBe('Shipping Country')
  })

  it('returns safe defaults for absent and unknown attributes or operators', () => {
    const widget = document.createElement('button')
    expect(getAttributeValue(widget, 'label')).toBe('')
    expect(getAttributeValue(widget, 'unknown' as 'id')).toBe('')
    expect(matchFieldTarget(widget, target({ operator: 'unknown' as 'exact', match: 'x' }))).toBe(false)
  })
})

describe('getActionsFromStorage', () => {
  it('returns persisted actions and falls back when storage is empty or unavailable', async () => {
    const storageGet = chrome.storage.local.get as unknown as {
      mockResolvedValueOnce: (value: Record<string, string>) => void
      mockRejectedValueOnce: (error: Error) => void
    }
    const action: Action = {
      id: 'saved',
      name: 'Saved',
      active: true,
      matcher: { type: 'hostname', value: 'example.com' },
      fields: [],
    }
    storageGet.mockResolvedValueOnce({
      actions: JSON.stringify({ state: { actions: [action] } }),
    })
    expect(await getActionsFromStorage()).toEqual([action])

    storageGet.mockResolvedValueOnce({})
    expect(await getActionsFromStorage()).toEqual(DEFAULT_ACTIONS)

    storageGet.mockRejectedValueOnce(new Error('storage unavailable'))
    expect(await getActionsFromStorage()).toEqual(DEFAULT_ACTIONS)
  })
})
