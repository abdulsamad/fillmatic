import { describe, expect, it } from 'vitest'

import { type Action, type FieldTarget, getMatchingActions, matchFieldTarget, matchUrl } from './actions'

describe('matchUrl', () => {
  it('matches hostname exactly', () => {
    expect(matchUrl({ type: 'hostname', value: 'example.com' }, 'https://example.com/checkout')).toBe(true)
    expect(matchUrl({ type: 'hostname', value: 'example.com' }, 'https://sub.example.com/checkout')).toBe(false)
  })

  it('returns false for hostname matcher on an invalid URL instead of throwing', () => {
    expect(matchUrl({ type: 'hostname', value: 'example.com' }, 'not-a-url')).toBe(false)
  })

  it('matches startsWith and endsWith', () => {
    expect(matchUrl({ type: 'startsWith', value: 'https://checkout.stripe.com' }, 'https://checkout.stripe.com/c/pay/1')).toBe(
      true,
    )
    expect(matchUrl({ type: 'endsWith', value: '/checkout' }, 'https://example.com/cart/checkout')).toBe(true)
    expect(matchUrl({ type: 'startsWith', value: 'https://checkout.stripe.com' }, 'https://example.com')).toBe(false)
  })

  it('matches regex and tolerates an invalid pattern', () => {
    expect(matchUrl({ type: 'regex', value: 'https://[^.]+\\.lemonsqueezy\\.com/checkout' }, 'https://foo.lemonsqueezy.com/checkout')).toBe(
      true,
    )
    expect(matchUrl({ type: 'regex', value: '(' }, 'https://example.com')).toBe(false)
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
    expect(matchFieldTarget(input, target({ attribute: 'placeholder', operator: 'regex', match: '^\\w{2}/\\w{2}$' }))).toBe(
      true,
    )
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
})
