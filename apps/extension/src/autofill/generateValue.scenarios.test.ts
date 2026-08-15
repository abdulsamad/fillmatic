import { faker } from '@faker-js/faker'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { isFeatureEnabled } = vi.hoisted(() => ({ isFeatureEnabled: vi.fn().mockReturnValue(true) }))
vi.mock('@/utils/featureFlags', () => ({ isFeatureEnabled }))

import { generateValue, resolveFieldTargetValue } from '@/autofill/generateValue'
import { DEFAULT_PROFILE, DEFAULT_PROFILE_ID, useProfileStore } from '@/store/profiles'
import { useContentScriptStore as contentScriptStore } from '@/store/content-script'
import { useAiMappingsStore } from '@/store/ai-mappings'
import type { FieldTarget } from '@/utils/actions'

const inputFor = (type: string, properties: Partial<HTMLInputElement> = {}) => {
  const input = document.createElement('input')
  input.type = type
  Object.assign(input, properties)
  return input
}

const randomTarget = (valueType?: FieldTarget['valueType']): FieldTarget => ({
  attribute: 'id',
  operator: 'exact',
  match: 'field',
  value: '',
  valueStrategy: 'random',
  valueType,
})

beforeEach(() => {
  isFeatureEnabled.mockReturnValue(true)
  document.body.innerHTML = ''
  contentScriptStore.setState({
    firstName: undefined,
    lastName: undefined,
    lastGeneratedPassword: '',
    activeAction: undefined,
  })
  useProfileStore.setState({ profiles: [DEFAULT_PROFILE], activeProfileId: DEFAULT_PROFILE_ID })
  useAiMappingsStore.setState({ snapshots: [] })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('autocomplete compatibility', () => {
  const recognizedTokens = [
    'tel',
    'tel-country-code',
    'tel-national',
    'tel-area-code',
    'tel-local',
    'tel-local-prefix',
    'tel-local-suffix',
    'tel-extension',
    'email',
    'impp',
    'name',
    'honorific-prefix',
    'given-name',
    'additional-name',
    'family-name',
    'honorific-suffix',
    'nickname',
    'one-time-code',
    'organization-title',
    'organization',
    'street-address',
    'address-line1',
    'address-line2',
    'address-line3',
    'address-level4',
    'address-level3',
    'address-level2',
    'address-level1',
    'country',
    'country-name',
    'postal-code',
    'cc-name',
    'cc-given-name',
    'cc-additional-name',
    'cc-family-name',
    'cc-number',
    'cc-exp-month',
    'cc-exp-year',
    'cc-csc',
    'cc-type',
    'transaction-currency',
    'transaction-amount',
    'language',
    'sex',
    'url',
    'photo',
    'recipient-name',
    'recipient-email',
    'recipient-phone',
    'group-name',
    'group-description',
    'group-member',
    'named-entity',
    'named-entity-type',
  ]

  it.each(recognizedTokens)('generates a non-empty value for %s', async (token) => {
    const input = inputFor('text')
    input.setAttribute('autocomplete', `shipping ${token}`)

    const value = await generateValue({ type: 'text', elem: input })

    expect(value, token).toEqual(expect.any(String))
    expect(value, token).not.toBe('')
  })

  it('keeps generated names in fill state for dependent nickname and email fields', async () => {
    const givenName = inputFor('text', { autocomplete: 'given-name' })
    const familyName = inputFor('text', { autocomplete: 'family-name' })

    const firstName = await generateValue({ type: 'text', elem: givenName })
    const lastName = await generateValue({ type: 'text', elem: familyName })

    expect(contentScriptStore.getState()).toMatchObject({ firstName, lastName })
    const nickname = inputFor('text')
    nickname.setAttribute('autocomplete', 'nickname')
    expect(await generateValue({ type: 'text', elem: nickname })).toEqual(expect.any(String))
  })

  it.each([
    ['MM/YY', /^\d{2}\/\d{2}$/],
    ['MM-YYYY', /^\d{2}-\d{4}$/],
    ['', /^\d{2}\/\d{2}$/],
  ])('formats card expiry using %s', async (placeholder, expected) => {
    const input = inputFor('text', { autocomplete: 'cc-exp', placeholder })
    expect(await generateValue({ type: 'text', elem: input })).toMatch(expected)
  })

  it('uses the pattern as the card-expiry format when no placeholder exists', async () => {
    const input = inputFor('text', { autocomplete: 'cc-exp', pattern: 'MM-YY' })
    expect(await generateValue({ type: 'text', elem: input })).toMatch(/^\d{2}-\d{2}$/)
  })

  it.each(['new-password', 'current-password', 'username', 'bday', 'bday-day', 'bday-month', 'bday-year'])(
    'deliberately skips the %s token and falls back to field semantics',
    async (token) => {
      const input = inputFor('text', { placeholder: 'Company' })
      input.setAttribute('autocomplete', token)
      expect(await generateValue({ type: 'text', elem: input })).toEqual(expect.any(String))
    },
  )

  it.each(['off', 'on', 'unrecognized-token'])(
    'falls back instead of dropping a field with autocomplete=%s',
    async (autocomplete) => {
      const input = inputFor('text', { placeholder: 'Department' })
      input.setAttribute('autocomplete', autocomplete)
      expect(await generateValue({ type: 'text', elem: input })).not.toBeUndefined()
    },
  )
})

describe('heuristic text-field generation', () => {
  const cases = [
    ['Full Name', 'text'],
    ['First Name', 'text'],
    ['Last Name', 'text'],
    ['Middle Name', 'text'],
    ['Username', 'text'],
    ['Email', 'email'],
    ['Mobile', 'text'],
    ['Fax', 'text'],
    ['Street', 'text'],
    ['City', 'text'],
    ['Suburb', 'text'],
    ['State', 'text'],
    ['Postal Code', 'text'],
    ['District', 'text'],
    ['Country', 'text'],
    ['Address', 'text'],
    ['Gender', 'text'],
    ['Age', 'number'],
    ['Website', 'url'],
    ['Company', 'text'],
    ['Job Title', 'text'],
    ['Department', 'text'],
    ['cardnumber', 'text'],
    ['cardExpiry', 'card-expiry'],
    ['CVV', 'text'],
    ['cardtype', 'text'],
    ['Day', 'text'],
  ] as const

  it.each(cases)('generates the expected kind of value for %s', async (placeholder, kind) => {
    const input = inputFor('text', { placeholder })
    const value = await generateValue({ type: 'text', elem: input })

    expect(value).toEqual(expect.any(String))
    if (kind === 'email') expect(value).toContain('@')
    if (kind === 'number') expect(Number(value)).toBeGreaterThanOrEqual(18)
    if (kind === 'url') expect(() => new URL(value as string)).not.toThrow()
    if (kind === 'card-expiry') expect(value).toMatch(/^\d{2}\/\d{2}$/)
  })

  it.each([
    ['Date of birth', 'dd/mm/yyyy', /^\d{2}\/\d{2}\/\d{4}$/],
    ['Appointment date', 'dd-mm-yy', /^\d{2}-\d{2}-\d{2}$/],
    ['Appointment date', '', /^\d{4}-\d{2}-\d{2}$/],
  ])('honours text-date formats for %s (%s)', async (name, placeholder, expected) => {
    const input = inputFor('text', { name, placeholder })
    expect(await generateValue({ type: 'text', elem: input })).toMatch(expected)
  })

  it('caps generated names, day values, and generic words to maxlength', async () => {
    const fullName = inputFor('text', { placeholder: 'Full Name', maxLength: 4 })
    const day = inputFor('text', { placeholder: 'Day', maxLength: 2 })
    const generic = inputFor('text', { placeholder: 'Unmapped field', maxLength: 3 })

    expect(String(await generateValue({ type: 'text', elem: fullName }))).toHaveLength(4)
    expect(await generateValue({ type: 'text', elem: day })).toMatch(/^\d{2}$/)
    expect(String(await generateValue({ type: 'text', elem: generic })).length).toBeLessThanOrEqual(3)
  })

  it('records first, last, and full names for values generated later in the same fill', async () => {
    const firstName = await generateValue({ type: 'text', elem: inputFor('text', { placeholder: 'First Name' }) })
    const lastName = await generateValue({ type: 'text', elem: inputFor('text', { placeholder: 'Last Name' }) })
    expect(contentScriptStore.getState()).toMatchObject({ firstName, lastName })

    const fullName = await generateValue({ type: 'text', elem: inputFor('text', { placeholder: 'Full Name' }) })
    expect(contentScriptStore.getState().firstName).toBe(fullName)
  })
})

describe('native input type fallbacks', () => {
  it.each([
    ['search', /^.+$/],
    ['email', /@/],
    ['url', /^https?:\/\//],
    ['tel', /^501-\d{3}-\d{3}$/],
    ['color', /^#[0-9a-f]{6}$/i],
    ['contenteditable', /^.+$/],
  ])('generates a valid %s value', async (type, expected) => {
    const elem =
      type === 'contenteditable'
        ? Object.assign(document.createElement('div'), { contentEditable: 'true' })
        : inputFor(type)
    if (type === 'contenteditable') elem.setAttribute('contenteditable', 'true')

    expect(await generateValue({ type: type as 'text', elem })).toMatch(expected)
  })

  it.each([
    ['date', '2024-01-01', '2024-01-31', /^2024-01-\d{2}$/],
    ['datetime-local', '2024-01-01T00:00', '2024-01-31T23:59', /^2024-01-\d{2}T\d{2}:\d{2}$/],
    ['month', '2024-01', '2024-06', /^2024-0[1-6]$/],
    ['week', '2024-W01', '2024-W08', /^2024-W\d{2}$/],
  ])('honours min/max constraints for %s', async (type, min, max, expected) => {
    const input = inputFor(type, { min, max })
    expect(await generateValue({ type: type as 'date', elem: input })).toMatch(expected)
  })

  it('honours both max-hour minutes and ordinary-hour minutes for time inputs', async () => {
    const input = inputFor('time', { min: '09:15', max: '10:05' })
    vi.spyOn(faker.number, 'int').mockReturnValueOnce(10).mockReturnValueOnce(5)
    expect(await generateValue({ type: 'time', elem: input })).toBe('10:05')

    vi.mocked(faker.number.int).mockReset().mockReturnValueOnce(9).mockReturnValueOnce(42)
    expect(await generateValue({ type: 'time', elem: input })).toBe('09:42')
  })

  it.each(['date', 'time', 'datetime-local', 'month', 'week'])(
    'uses safe defaults when %s has no bounds',
    async (type) => {
      expect(await generateValue({ type: type as 'date', elem: inputFor(type) })).toEqual(expect.any(String))
    },
  )

  it('uses configured and default bounds for number and range fields', async () => {
    const number = Number(await generateValue({ type: 'number', elem: inputFor('number') }))
    const range = Number(await generateValue({ type: 'range', elem: inputFor('range', { min: '20', max: '30' }) }))
    expect(number).toBeGreaterThanOrEqual(1)
    expect(number).toBeLessThanOrEqual(100)
    expect(range).toBeGreaterThanOrEqual(20)
    expect(range).toBeLessThanOrEqual(30)
  })

  it('generates uncapped textarea content when maxlength is absent', async () => {
    const value = await generateValue({ type: 'textarea', elem: document.createElement('textarea') })
    expect(value).toEqual(expect.any(String))
    expect(String(value).length).toBeGreaterThan(10)
  })

  it('randomizes standalone checkbox and radio values', async () => {
    const boolean = vi.spyOn(faker.datatype, 'boolean').mockReturnValue(true)
    expect(await generateValue({ type: 'checkbox', elem: inputFor('checkbox') })).toBe(true)
    expect(await generateValue({ type: 'radio', elem: inputFor('radio') })).toBe(true)
    expect(boolean).toHaveBeenCalledTimes(2)
  })

  it('returns an empty value for unsupported input-type requests', async () => {
    expect(await generateValue({ type: 'button', elem: inputFor('button') })).toBe('')
  })

  it.each([
    'text',
    'password',
    'number',
    'date',
    'time',
    'datetime-local',
    'month',
    'week',
    'textarea',
    'select',
    'checkbox',
    'radio',
    'range',
  ])('fails safely when a custom widget requests the %s fallback', async (type) => {
    const widget = document.createElement('button')
    widget.setAttribute('role', 'switch')

    const value = await generateValue({ type: type as 'number', elem: widget })

    expect(value).not.toBeUndefined()
  })

  it('parses ISO weeks whose reference Sunday exercises the ISO Sunday rule', async () => {
    const input = inputFor('week', { min: '2015-W01', max: '2015-W02' })
    expect(await generateValue({ type: 'week', elem: input })).toMatch(/^2015-W\d{2}$/)
  })

  it('supports card-expiry formats without an explicit month or year token', async () => {
    const noMonth = inputFor('text', { autocomplete: 'cc-exp', placeholder: 'M/YY' })
    const noYear = inputFor('text', { autocomplete: 'cc-exp', placeholder: 'MM/X' })
    expect(await generateValue({ type: 'text', elem: noMonth })).toMatch(/^\d{1,2}\/\d{2}$/)
    expect(await generateValue({ type: 'text', elem: noYear })).toMatch(/^\d{2}\/\d{2}$/)
  })
})

describe('field override edge cases', () => {
  it.each(['phone', 'url', 'string'] as const)('resolves random %s targets', (valueType) => {
    const value = resolveFieldTargetValue(randomTarget(valueType), inputFor('text'))
    expect(value).toEqual(expect.any(String))
    expect(value).not.toBe('')
  })

  it('uses default numeric bounds for non-number elements and unconstrained number inputs', () => {
    const generic = Number(resolveFieldTargetValue(randomTarget('number'), document.createElement('button')))
    const input = Number(resolveFieldTargetValue(randomTarget('number'), inputFor('number')))
    expect(generic).toBeGreaterThanOrEqual(1)
    expect(generic).toBeLessThanOrEqual(100)
    expect(input).toBeGreaterThanOrEqual(1)
    expect(input).toBeLessThanOrEqual(100)
  })

  it('continues through non-matching snapshots and user rules before selecting a match', async () => {
    const input = inputFor('text', { id: 'promo' })
    useAiMappingsStore.setState({
      snapshots: [
        {
          id: 'snapshot',
          name: 'Checkout',
          siteMatcher: window.location.hostname,
          createdAt: '2026-08-16T00:00:00.000Z',
          fields: [{ attribute: 'id', operator: 'exact', match: 'other', value: 'wrong' }],
        },
      ],
    })
    useProfileStore.setState({
      activeProfileId: 'custom',
      profiles: [
        DEFAULT_PROFILE,
        {
          id: 'custom',
          name: 'Custom',
          rules: [
            {
              id: 'wrong-site',
              siteMatcher: 'elsewhere.example',
              rules: [{ attribute: 'id', operator: 'exact', match: 'promo', value: 'wrong' }],
            },
            {
              id: 'matching-site',
              siteMatcher: window.location.hostname,
              rules: [
                { attribute: 'id', operator: 'exact', match: 'other', value: 'wrong' },
                { attribute: 'id', operator: 'exact', match: 'promo', value: 'SAVE20' },
              ],
            },
          ],
        },
      ],
    })

    expect(await generateValue({ type: 'text', elem: input })).toBe('SAVE20')
  })

  it('falls back safely when the active profile no longer exists', async () => {
    useProfileStore.setState({ profiles: [DEFAULT_PROFILE], activeProfileId: 'deleted-profile' })
    expect(await generateValue({ type: 'text', elem: inputFor('text', { placeholder: 'Company' }) })).toEqual(
      expect.any(String),
    )
  })

  it('falls back after checking every field in a matching user rule with no match', async () => {
    useProfileStore.setState({
      activeProfileId: 'custom',
      profiles: [
        {
          id: 'custom',
          name: 'Custom',
          rules: [
            {
              id: 'rule',
              siteMatcher: window.location.hostname,
              rules: [{ attribute: 'id', operator: 'exact', match: 'different-field', value: 'wrong' }],
            },
          ],
        },
      ],
    })

    expect(await generateValue({ type: 'text', elem: inputFor('text', { placeholder: 'Company' }) })).not.toBe('wrong')
  })

  it('ignores an active action whose fields do not match', async () => {
    contentScriptStore.setState({
      activeAction: {
        id: 'checkout',
        name: 'Checkout',
        active: true,
        matcher: { type: 'hostname', value: 'example.com' },
        fields: [{ attribute: 'id', operator: 'exact', match: 'other', value: 'wrong' }],
      },
    })
    expect(await generateValue({ type: 'text', elem: inputFor('text', { placeholder: 'Company' }) })).not.toBe('wrong')
  })
})

describe('password safety and consistency', () => {
  it('uses the configured password when deterministic passwords are enabled', async () => {
    useProfileStore.setState({
      activeProfileId: 'secure',
      profiles: [
        DEFAULT_PROFILE,
        {
          id: 'secure',
          name: 'Secure',
          samePasswordEverytime: true,
          commonPassword: 'SafePass1!',
        },
      ],
    })
    const input = inputFor('password', { minLength: 8, maxLength: 10 })
    expect(await generateValue({ type: 'password', elem: input })).toBe('SafePass')
    expect(contentScriptStore.getState().lastGeneratedPassword).toBe('SafePass')
  })

  it('uses the deterministic PIN when enabled and it fits the field', async () => {
    useProfileStore.setState({
      activeProfileId: 'pin',
      profiles: [{ id: 'pin', name: 'PIN', samePasswordEverytime: true }],
    })
    const input = inputFor('password', { placeholder: 'PIN', minLength: 4, maxLength: 6 })
    expect(await generateValue({ type: 'password', elem: input })).toBe('1111')
  })

  it('generates a random password when the configured password cannot fit', async () => {
    useProfileStore.setState({
      activeProfileId: 'short',
      profiles: [
        {
          id: 'short',
          name: 'Short',
          samePasswordEverytime: true,
          commonPassword: 'password-that-is-too-long',
        },
      ],
    })
    const input = inputFor('password', { maxLength: 5, pattern: '[A-Za-z]+' })
    expect(String(await generateValue({ type: 'password', elem: input }))).toHaveLength(5)
  })

  it('returns an empty confirm value when no password has been generated yet', async () => {
    const confirm = inputFor('password', { placeholder: 'Confirm Password' })
    expect(await generateValue({ type: 'password', elem: confirm })).toBe('')
  })

  it('truncates the previous password to the confirmation field maxlength', async () => {
    contentScriptStore.setState({ lastGeneratedPassword: 'abcdefgh' })
    const confirm = inputFor('password', { placeholder: 'Re-enter password', maxLength: 4 })
    expect(await generateValue({ type: 'password', elem: confirm })).toBe('abcd')
  })
})
