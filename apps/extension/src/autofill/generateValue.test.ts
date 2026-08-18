import { faker } from '@faker-js/faker'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { isFeatureEnabled } = vi.hoisted(() => ({ isFeatureEnabled: vi.fn().mockReturnValue(true) }))
vi.mock('@/utils/featureFlags', () => ({ isFeatureEnabled }))

import { generateValue, resolveFieldTargetValue } from '@/autofill/generateValue'
import { DEFAULT_PROFILE, DEFAULT_PROFILE_ID, useProfileStore } from '@/store/profiles'
import { useContentScriptStore as contentScriptStore } from '@/store/content-script'
import { useAiMappingsStore } from '@/store/ai-mappings'
import { type Action } from '@/utils/actions'

const resetStores = () => {
  contentScriptStore.setState({
    firstName: undefined,
    lastName: undefined,
    lastGeneratedPassword: '',
    activeAction: undefined,
  })
  useProfileStore.setState({ profiles: [DEFAULT_PROFILE], activeProfileId: DEFAULT_PROFILE_ID })
  useAiMappingsStore.setState({ snapshots: [] })
}

beforeEach(() => {
  isFeatureEnabled.mockReturnValue(true)
  resetStores()
})

describe('generateValue', () => {
  it('returns an empty string for an unsupported element', async () => {
    const div = document.createElement('div')
    expect(await generateValue({ type: 'text', elem: div })).toBe('')
  })

  it('prefers the active action field target over default generation', async () => {
    const input = document.createElement('input')
    input.id = 'cardNumber'

    const action: Action = {
      id: 'demo',
      name: 'Demo',
      matcher: { type: 'startsWith', value: 'https://example.com' },
      active: true,
      fields: [{ attribute: 'id', operator: 'exact', match: 'cardNumber', value: '4242424242424242' }],
    }
    contentScriptStore.setState({ activeAction: action })

    expect(await generateValue({ type: 'text', elem: input })).toBe('4242424242424242')
  })

  it('prefers a matching user profile field rule over default generation', async () => {
    const input = document.createElement('input')
    input.name = 'promo_code'

    useProfileStore.setState({
      profiles: [
        {
          ...DEFAULT_PROFILE,
          rules: [
            {
              id: 'rule-1',
              siteMatcher: window.location.hostname,
              rules: [{ attribute: 'name', operator: 'exact', match: 'promo_code', value: 'SAVE10' }],
            },
          ],
        },
      ],
      activeProfileId: DEFAULT_PROFILE_ID,
    })

    expect(await generateValue({ type: 'text', elem: input })).toBe('SAVE10')
  })

  it('uses a saved mapper snapshot for the site, but the active action still wins', async () => {
    const input = document.createElement('input')
    input.id = 'company'

    useAiMappingsStore.setState({
      snapshots: [
        {
          id: 'snap-1',
          name: 'Test map',
          siteMatcher: window.location.hostname,
          createdAt: '2026-07-09T00:00:00.000Z',
          fields: [{ attribute: 'id', operator: 'exact', match: 'company', value: 'Acme Inc' }],
        },
      ],
    })

    expect(await generateValue({ type: 'text', elem: input })).toBe('Acme Inc')

    // Snapshot for another site does not apply.
    useAiMappingsStore.setState({
      snapshots: [
        {
          id: 'snap-2',
          name: 'Elsewhere',
          siteMatcher: 'not-this-site.example',
          createdAt: '2026-07-09T00:00:00.000Z',
          fields: [{ attribute: 'id', operator: 'exact', match: 'company', value: 'Acme Inc' }],
        },
      ],
    })
    expect(await generateValue({ type: 'text', elem: input })).not.toBe('Acme Inc')

    // An active action outranks the snapshot tier.
    useAiMappingsStore.setState({
      snapshots: [
        {
          id: 'snap-1',
          name: 'Test map',
          siteMatcher: window.location.hostname,
          createdAt: '2026-07-09T00:00:00.000Z',
          fields: [{ attribute: 'id', operator: 'exact', match: 'company', value: 'Acme Inc' }],
        },
      ],
    })
    contentScriptStore.setState({
      activeAction: {
        id: 'demo',
        name: 'Demo',
        matcher: { type: 'startsWith', value: 'x' },
        active: true,
        fields: [{ attribute: 'id', operator: 'exact', match: 'company', value: 'Override Corp' }],
      },
    })
    expect(await generateValue({ type: 'text', elem: input })).toBe('Override Corp')
  })

  it('ignores saved mapper snapshots entirely when the aiMapping feature flag is off', async () => {
    isFeatureEnabled.mockReturnValue(false)

    const input = document.createElement('input')
    input.id = 'company'

    useAiMappingsStore.setState({
      snapshots: [
        {
          id: 'snap-1',
          name: 'Test map',
          siteMatcher: window.location.hostname,
          createdAt: '2026-07-09T00:00:00.000Z',
          fields: [{ attribute: 'id', operator: 'exact', match: 'company', value: 'Acme Inc' }],
        },
      ],
    })

    expect(await generateValue({ type: 'text', elem: input })).not.toBe('Acme Inc')
  })

  it('matches an action field target against a widget element via its ARIA label', async () => {
    const widget = document.createElement('button')
    widget.setAttribute('role', 'combobox')
    widget.setAttribute('aria-label', 'Country')

    const action: Action = {
      id: 'demo',
      name: 'Demo',
      matcher: { type: 'startsWith', value: 'https://example.com' },
      active: true,
      fields: [{ attribute: 'label', operator: 'contains', match: 'country', value: 'Canada' }],
    }
    contentScriptStore.setState({ activeAction: action })

    expect(await generateValue({ type: 'select', elem: widget })).toBe('Canada')
  })

  it('generates a value from a recognized autocomplete token', async () => {
    const input = document.createElement('input')
    input.autocomplete = 'email'

    const value = await generateValue({ type: 'email', elem: input })
    expect(typeof value).toBe('string')
    expect(value as string).toContain('@')
  })

  it('falls back to default generation when the autocomplete token is unrecognized', async () => {
    const input = document.createElement('input')
    input.autocomplete = 'off'
    input.placeholder = 'First Name'

    const value = await generateValue({ type: 'text', elem: input })
    expect(typeof value).toBe('string')
    expect((value as string).length).toBeGreaterThan(0)
  })

  it('matches heuristic text field rules by placeholder (e.g. email)', async () => {
    const input = document.createElement('input')
    input.placeholder = 'Email address'

    const value = (await generateValue({ type: 'text', elem: input })) as string
    expect(value).toContain('@')
  })

  it('prefers an accessible email label over a misleading username name and autocomplete', async () => {
    const input = document.createElement('input')
    input.type = 'text'
    input.id = 'optionalEmail'
    input.name = 'username'
    input.autocomplete = 'username'
    input.setAttribute('aria-label', 'Email Address')

    const value = (await generateValue({ type: 'text', elem: input })) as string
    expect(value).toContain('@')
  })

  it('falls back to the input name when no label identifies the field', async () => {
    const input = document.createElement('input')
    input.type = 'text'
    input.name = 'username'

    const value = (await generateValue({ type: 'text', elem: input })) as string
    expect(value).not.toContain('@')
  })

  it('respects the min/max range for a number input', async () => {
    const input = document.createElement('input')
    input.min = '5'
    input.max = '10'

    const value = Number(await generateValue({ type: 'number', elem: input }))
    expect(value).toBeGreaterThanOrEqual(5)
    expect(value).toBeLessThanOrEqual(10)
  })

  it('respects the min/max range for a date input', async () => {
    const input = document.createElement('input')
    input.min = '2020-01-01'
    input.max = '2020-01-31'

    const value = new Date((await generateValue({ type: 'date', elem: input })) as string)
    expect(value.getTime()).toBeGreaterThanOrEqual(new Date('2020-01-01').getTime())
    expect(value.getTime()).toBeLessThanOrEqual(new Date('2020-01-31').getTime())
  })

  it('picks one of the available <option> values for a select element', async () => {
    const select = document.createElement('select')
    ;['a', 'b', 'c'].forEach((v) => {
      const option = document.createElement('option')
      option.value = v
      select.appendChild(option)
    })

    const value = await generateValue({ type: 'select', elem: select })
    expect(['a', 'b', 'c']).toContain(value)
  })

  it('always checks a checkbox matching the configured alwaysCheckFields list', async () => {
    const checkbox = document.createElement('input')
    checkbox.type = 'checkbox'
    checkbox.id = 'accept-terms'

    expect(await generateValue({ type: 'checkbox', elem: checkbox })).toBe(true)
  })

  it('checks only the element faker picked as the random winner in a same-named checkbox group', async () => {
    const container = document.createElement('div')
    const boxes = ['a', 'b', 'c'].map((v) => {
      const box = document.createElement('input')
      box.type = 'checkbox'
      box.name = 'color'
      box.value = v
      container.appendChild(box)
      return box
    })
    document.body.appendChild(container)

    // Pin the "random" pick so the boolean-per-element outcome is deterministic.
    const spy = vi.spyOn(faker.helpers, 'arrayElement').mockReturnValue(boxes[1])

    const results = await Promise.all(boxes.map((box) => generateValue({ type: 'checkbox', elem: box })))
    expect(results).toEqual([false, true, false])

    spy.mockRestore()
    document.body.removeChild(container)
  })

  it('selects only the element faker picked as the random winner in a same-named radio group', async () => {
    const container = document.createElement('div')
    const radios = ['a', 'b', 'c'].map((v) => {
      const radio = document.createElement('input')
      radio.type = 'radio'
      radio.name = 'plan'
      radio.value = v
      container.appendChild(radio)
      return radio
    })
    document.body.appendChild(container)

    const spy = vi.spyOn(faker.helpers, 'arrayElement').mockReturnValue(radios[2])

    const results = await Promise.all(radios.map((radio) => generateValue({ type: 'radio', elem: radio })))
    expect(results).toEqual([false, false, true])

    spy.mockRestore()
    document.body.removeChild(container)
  })

  it('generates a textarea value, capped to maxLength when set', async () => {
    const textarea = document.createElement('textarea')
    textarea.maxLength = 10

    const value = (await generateValue({ type: 'textarea', elem: textarea })) as string
    expect(value.length).toBeLessThanOrEqual(10)
  })

  it('generates a default password respecting min/max length', async () => {
    const input = document.createElement('input')
    input.type = 'password'
    input.minLength = 6
    input.maxLength = 6

    const value = (await generateValue({ type: 'password', elem: input })) as string
    expect(value).toHaveLength(6)
  })

  it('reuses the last generated password for a confirm/re-enter field', async () => {
    const original = document.createElement('input')
    original.type = 'password'
    original.minLength = 8
    original.maxLength = 8

    const generated = (await generateValue({ type: 'password', elem: original })) as string

    const confirm = document.createElement('input')
    confirm.type = 'password'
    confirm.placeholder = 'Confirm password'
    confirm.maxLength = 8

    const confirmValue = await generateValue({ type: 'password', elem: confirm })
    expect(confirmValue).toBe(generated)
  })

  it('generates a 6-digit PIN for a field identified as a pin', async () => {
    const input = document.createElement('input')
    input.type = 'password'
    input.placeholder = 'PIN'
    input.minLength = 6
    input.maxLength = 6

    const value = (await generateValue({ type: 'password', elem: input })) as string
    expect(value).toMatch(/^\d{6}$/)
  })
})

describe('resolveFieldTargetValue', () => {
  const target = (overrides = {}) => ({
    attribute: 'id' as const,
    operator: 'exact' as const,
    match: 'field',
    value: 'literal',
    ...overrides,
  })

  it('returns the literal value when the strategy is absent (pre-existing targets)', () => {
    expect(resolveFieldTargetValue(target(), document.createElement('input'))).toBe('literal')
  })

  it('returns the literal value for the exact strategy', () => {
    expect(resolveFieldTargetValue(target({ valueStrategy: 'exact' }), document.createElement('input'))).toBe('literal')
  })

  it('generates a fresh email for random/email', () => {
    const value = resolveFieldTargetValue(
      target({ valueStrategy: 'random', valueType: 'email', value: '' }),
      document.createElement('input'),
    )
    expect(value).toContain('@')
  })

  it('respects a number input min/max for random/number', () => {
    const input = document.createElement('input')
    input.type = 'number'
    input.min = '5'
    input.max = '7'

    const value = resolveFieldTargetValue(target({ valueStrategy: 'random', valueType: 'number', value: '' }), input)
    expect(Number(value)).toBeGreaterThanOrEqual(5)
    expect(Number(value)).toBeLessThanOrEqual(7)
  })

  it('generates an ISO date for random/date', () => {
    const value = resolveFieldTargetValue(
      target({ valueStrategy: 'random', valueType: 'date', value: '' }),
      document.createElement('input'),
    )
    expect(value).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('records the generated full name for later fields (email consistency)', () => {
    const value = resolveFieldTargetValue(
      target({ valueStrategy: 'random', valueType: 'fullName', value: '' }),
      document.createElement('input'),
    )
    expect(contentScriptStore.getState().firstName).toBe(value)
  })

  it('falls back to a word for random with no valueType', () => {
    const value = resolveFieldTargetValue(
      target({ valueStrategy: 'random', value: '' }),
      document.createElement('input'),
    )
    expect(value.length).toBeGreaterThan(0)
  })

  it('is applied when an action field target uses the random strategy', async () => {
    const input = document.createElement('input')
    input.id = 'contact_email'

    const action: Action = {
      id: 'demo',
      name: 'Demo',
      matcher: { type: 'startsWith', value: 'https://example.com' },
      active: true,
      fields: [
        {
          attribute: 'id',
          operator: 'exact',
          match: 'contact_email',
          value: '',
          valueStrategy: 'random',
          valueType: 'email',
        },
      ],
    }
    contentScriptStore.setState({ activeAction: action })

    expect((await generateValue({ type: 'text', elem: input })) as string).toContain('@')
  })
})
