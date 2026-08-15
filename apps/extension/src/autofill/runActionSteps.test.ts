import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { resolveTemplateTokens, runActionSteps } from '@/autofill/runActionSteps'
import { useConfigStore } from '@/store/config'

const makeVisible = (elem: HTMLElement) => {
  Object.defineProperty(elem, 'offsetWidth', { value: 100, configurable: true })
  Object.defineProperty(elem, 'offsetHeight', { value: 20, configurable: true })
  elem.getClientRects = () => [{}] as unknown as DOMRectList
}

beforeEach(() => {
  // Whole-value writes keep the tests fast; the typing effect is covered elsewhere.
  useConfigStore.setState({ typingEffect: false })
})

afterEach(() => {
  document.body.innerHTML = ''
})

describe('resolveTemplateTokens', () => {
  it('replaces whitelisted faker tokens', () => {
    const resolved = resolveTemplateTokens('mail: {{faker.internet.email}}')
    expect(resolved).toMatch(/^mail: .+@.+$/)
  })

  it('resolves every whitelisted token to a non-empty value', () => {
    const tokens = [
      'faker.person.fullName',
      'faker.person.firstName',
      'faker.person.lastName',
      'faker.internet.email',
      'faker.internet.username',
      'faker.internet.url',
      'faker.phone.number',
      'faker.lorem.word',
      'faker.lorem.sentence',
      'faker.lorem.paragraph',
      'faker.location.streetAddress',
      'faker.location.city',
      'faker.location.zipCode',
      'faker.location.country',
      'faker.company.name',
      'faker.number.int',
      'faker.string.uuid',
      'faker.date.recent',
    ]

    for (const token of tokens) {
      const resolved = resolveTemplateTokens(`{{${token}}}`)
      expect(resolved, token).not.toContain('{{')
      expect(resolved.length, token).toBeGreaterThan(0)
    }
  })

  it('tolerates whitespace inside the braces', () => {
    expect(resolveTemplateTokens('{{ faker.lorem.word }}')).not.toContain('{{')
  })

  it('leaves unknown tokens untouched so typos stay visible', () => {
    expect(resolveTemplateTokens('{{faker.not.real}}')).toBe('{{faker.not.real}}')
    expect(resolveTemplateTokens('no tokens here')).toBe('no tokens here')
  })
})

describe('runActionSteps', () => {
  it('clicks the step selector target', async () => {
    const button = document.createElement('button')
    button.id = 'submit-btn'
    document.body.appendChild(button)

    let clicks = 0
    button.addEventListener('click', () => clicks++)

    await expect(runActionSteps([{ kind: 'click', selector: '#submit-btn' }])).resolves.toBe(true)
    expect(clicks).toBe(1)
  })

  it('types a token-resolved value into an input', async () => {
    const input = document.createElement('input')
    input.id = 'email'
    document.body.appendChild(input)

    await expect(
      runActionSteps([{ kind: 'type', selector: '#email', value: '{{faker.internet.email}}' }]),
    ).resolves.toBe(true)
    expect(input.value).toContain('@')
  })

  it('waits for an element that mounts later', async () => {
    setTimeout(() => {
      const late = document.createElement('div')
      late.id = 'late'
      makeVisible(late)
      document.body.appendChild(late)
    }, 50)

    await expect(runActionSteps([{ kind: 'waitFor', selector: '#late', timeoutMs: 1000 }])).resolves.toBe(true)
  })

  it('fails a waitFor step when the element never appears', async () => {
    await expect(runActionSteps([{ kind: 'waitFor', selector: '#never', timeoutMs: 200 }])).resolves.toBe(false)
  })

  it('selects a native select option by its label', async () => {
    const select = document.createElement('select')
    select.id = 'country'
    for (const label of ['Canada', 'Chile']) {
      const option = document.createElement('option')
      option.value = label.toLowerCase()
      option.textContent = label
      select.appendChild(option)
    }
    document.body.appendChild(select)

    await expect(runActionSteps([{ kind: 'selectOption', selector: '#country', option: 'Chile' }])).resolves.toBe(true)
    expect(select.value).toBe('chile')
  })

  it('fails when a native select does not contain the requested option', async () => {
    const select = document.createElement('select')
    select.id = 'country'
    select.appendChild(new Option('Canada', 'ca'))
    document.body.appendChild(select)

    await expect(runActionSteps([{ kind: 'selectOption', selector: '#country', option: 'Chile' }])).resolves.toBe(false)
  })

  it('selects a widget option by opening its popover — and fails deterministically when the option is missing', async () => {
    const trigger = document.createElement('button')
    trigger.id = 'size'
    trigger.setAttribute('aria-controls', 'size-listbox')
    makeVisible(trigger)
    document.body.appendChild(trigger)

    const listbox = document.createElement('div')
    listbox.id = 'size-listbox'
    listbox.setAttribute('role', 'listbox')
    makeVisible(listbox)

    const clicked: string[] = []
    for (const label of ['Small', 'Large']) {
      const option = document.createElement('div')
      option.setAttribute('role', 'option')
      option.textContent = label
      makeVisible(option)
      option.addEventListener('click', () => {
        clicked.push(label)
        listbox.remove()
      })
      listbox.appendChild(option)
    }
    trigger.addEventListener('click', () => document.body.appendChild(listbox))

    await expect(runActionSteps([{ kind: 'selectOption', selector: '#size', option: 'Large' }])).resolves.toBe(true)
    expect(clicked).toEqual(['Large'])

    // Re-open with an option that doesn't exist -> deterministic failure, no random pick.
    await expect(runActionSteps([{ kind: 'selectOption', selector: '#size', option: 'Gigantic' }])).resolves.toBe(false)
    expect(clicked).toEqual(['Large'])
  })

  it('fails widget selection when the trigger does not open a popover', async () => {
    const trigger = document.createElement('button')
    trigger.id = 'closed-widget'
    makeVisible(trigger)
    document.body.appendChild(trigger)
    await expect(
      runActionSteps([{ kind: 'selectOption', selector: '#closed-widget', option: 'Anything' }]),
    ).resolves.toBe(false)
  })

  it('clickRandom clicks one of the visible enabled matches', async () => {
    const clicked: string[] = []
    for (const [i, disabled] of [false, false, true].entries()) {
      const cell = document.createElement('button')
      cell.className = 'day'
      cell.textContent = String(i)
      if (disabled) cell.setAttribute('aria-disabled', 'true')
      makeVisible(cell)
      cell.addEventListener('click', () => clicked.push(cell.textContent!))
      document.body.appendChild(cell)
    }

    await expect(runActionSteps([{ kind: 'clickRandom', selector: '.day' }])).resolves.toBe(true)

    expect(clicked).toHaveLength(1)
    expect(['0', '1']).toContain(clicked[0]) // never the disabled cell
  })

  it('clickRandom fails when nothing visible matches', async () => {
    await expect(runActionSteps([{ kind: 'clickRandom', selector: '.missing' }])).resolves.toBe(false)
  })

  it('resolves the @self selector to the context element', async () => {
    const widget = document.createElement('button')
    makeVisible(widget)
    document.body.appendChild(widget)

    let clicks = 0
    widget.addEventListener('click', () => clicks++)

    await expect(runActionSteps([{ kind: 'click', selector: '@self' }], { self: widget })).resolves.toBe(true)
    expect(clicks).toBe(1)

    // Without a context element @self resolves to nothing and the step fails.
    await expect(runActionSteps([{ kind: 'click', selector: '@self' }])).resolves.toBe(false)
  })

  it('presses a key on the target element', async () => {
    const input = document.createElement('input')
    input.id = 'search'
    document.body.appendChild(input)

    const keys: string[] = []
    input.addEventListener('keydown', (e) => keys.push((e as KeyboardEvent).key))

    await expect(runActionSteps([{ kind: 'press', selector: '#search', key: 'Enter' }])).resolves.toBe(true)
    expect(keys).toEqual(['Enter'])
  })

  it.each([
    [{ kind: 'type', selector: '#plain-button', value: 'nope' } as const],
    [{ kind: 'selectOption', selector: '#missing', option: 'nope' } as const],
    [{ kind: 'press', selector: '#missing', key: 'Enter' } as const],
  ])('fails safely when a step target is absent or cannot accept the operation', async (step) => {
    const button = document.createElement('button')
    button.id = 'plain-button'
    document.body.appendChild(button)
    await expect(runActionSteps([step])).resolves.toBe(false)
  })

  it('fails safely for an unknown step kind', async () => {
    await expect(runActionSteps([{ kind: 'unknown' } as never])).resolves.toBe(false)
  })

  it('catches selector errors and aborts the run without throwing', async () => {
    await expect(runActionSteps([{ kind: 'click', selector: '[' }])).resolves.toBe(false)
  })

  it('aborts remaining steps after a failure', async () => {
    const button = document.createElement('button')
    button.id = 'after'
    document.body.appendChild(button)

    let clicks = 0
    button.addEventListener('click', () => clicks++)

    await expect(
      runActionSteps([
        { kind: 'click', selector: '#does-not-exist' },
        { kind: 'click', selector: '#after' },
      ]),
    ).resolves.toBe(false)
    expect(clicks).toBe(0)
  })
})
