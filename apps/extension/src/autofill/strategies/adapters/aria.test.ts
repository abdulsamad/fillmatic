import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { faker } from '@faker-js/faker'

const { generateValue } = vi.hoisted(() => ({ generateValue: vi.fn() }))
vi.mock('@/autofill/generateValue', () => ({ generateValue }))

import { ariaAdapter, fillWidgetWithAria } from '@/autofill/strategies/adapters/aria'
import { radixAdapter } from '@/autofill/strategies/adapters/radix'
import { widgetStrategy } from '@/autofill/strategies/widget'

const makeVisible = (elem: HTMLElement) => {
  Object.defineProperty(elem, 'offsetWidth', { value: 100, configurable: true })
  Object.defineProperty(elem, 'offsetHeight', { value: 20, configurable: true })
  elem.getClientRects = () => [{}] as unknown as DOMRectList
}

beforeEach(() => {
  generateValue.mockReset()
})

afterEach(() => {
  document.body.innerHTML = ''
})

/** Builds a combobox trigger whose click portals a listbox with the given options to document.body. */
const buildOptionPicker = (labels = ['Apple', 'Banana', 'Cherry']) => {
  const trigger = document.createElement('button')
  trigger.setAttribute('role', 'combobox')
  trigger.setAttribute('aria-haspopup', 'listbox')
  trigger.setAttribute('aria-controls', 'test-listbox')
  makeVisible(trigger)
  document.body.appendChild(trigger)

  const listbox = document.createElement('div')
  listbox.id = 'test-listbox'
  listbox.setAttribute('role', 'listbox')
  makeVisible(listbox)

  const clicked: string[] = []
  for (const label of labels) {
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

  return { trigger, listbox, clicked }
}

describe('fillWidgetWithAria — option picker', () => {
  it('opens the popover and clicks the option matching the target value', async () => {
    generateValue.mockResolvedValue('Banana')
    const { trigger, clicked } = buildOptionPicker()

    await expect(fillWidgetWithAria(trigger)).resolves.toBe(true)
    expect(clicked).toEqual(['Banana'])
  })

  it('matches option text case-insensitively and by containment', async () => {
    generateValue.mockResolvedValue('cherry')
    const { trigger, clicked } = buildOptionPicker(['Sweet Cherry Pie', 'Apple'])

    await expect(fillWidgetWithAria(trigger)).resolves.toBe(true)
    expect(clicked).toEqual(['Sweet Cherry Pie'])
  })

  it('picks a random option when no Action/rule pins a value', async () => {
    generateValue.mockResolvedValue('')
    const { trigger, clicked } = buildOptionPicker()

    await expect(fillWidgetWithAria(trigger)).resolves.toBe(true)
    expect(clicked).toHaveLength(1)
  })

  it('returns false when clicking the trigger never opens a popover', async () => {
    const trigger = document.createElement('button')
    trigger.setAttribute('role', 'combobox')
    makeVisible(trigger)
    document.body.appendChild(trigger)

    await expect(fillWidgetWithAria(trigger)).resolves.toBe(false)
  })

  it('escapes and returns false when an opened popover has no selectable options', async () => {
    const trigger = document.createElement('button')
    trigger.setAttribute('role', 'combobox')
    makeVisible(trigger)
    document.body.appendChild(trigger)
    const listbox = document.createElement('div')
    listbox.setAttribute('role', 'listbox')
    makeVisible(listbox)
    trigger.addEventListener('click', () => document.body.appendChild(listbox))
    const keys: string[] = []
    document.addEventListener('keydown', (event) => keys.push((event as KeyboardEvent).key))

    await expect(fillWidgetWithAria(trigger)).resolves.toBe(false)
    expect(keys).toContain('Escape')
  })

  it('closes a popover that remains visible after an option is clicked', async () => {
    generateValue.mockResolvedValue('Apple')
    const trigger = document.createElement('button')
    trigger.setAttribute('role', 'combobox')
    makeVisible(trigger)
    document.body.appendChild(trigger)
    const listbox = document.createElement('div')
    listbox.setAttribute('role', 'listbox')
    makeVisible(listbox)
    const option = document.createElement('button')
    option.setAttribute('role', 'option')
    option.textContent = 'Apple'
    makeVisible(option)
    listbox.appendChild(option)
    trigger.addEventListener('click', () => document.body.appendChild(listbox))
    const keys: string[] = []
    document.addEventListener('keydown', (event) => keys.push((event as KeyboardEvent).key))

    await expect(fillWidgetWithAria(trigger, { popoverSelector: '[role="listbox"]' })).resolves.toBe(true)
    expect(keys).toContain('Escape')
  })
})

describe('fillWidgetWithAria — calendar', () => {
  it('opens the date popup and clicks the day cell for the generated date', async () => {
    generateValue.mockResolvedValue('2026-07-15')

    const trigger = document.createElement('button')
    trigger.setAttribute('aria-haspopup', 'dialog')
    trigger.setAttribute('aria-controls', 'test-dialog')
    makeVisible(trigger)
    document.body.appendChild(trigger)

    const dialog = document.createElement('div')
    dialog.id = 'test-dialog'
    dialog.setAttribute('role', 'dialog')
    makeVisible(dialog)
    const grid = document.createElement('div')
    grid.setAttribute('role', 'grid')
    dialog.appendChild(grid)

    const clicked: string[] = []
    for (let day = 1; day <= 28; day++) {
      const cell = document.createElement('button')
      cell.setAttribute('role', 'gridcell')
      cell.textContent = String(day)
      makeVisible(cell)
      cell.addEventListener('click', () => {
        clicked.push(cell.textContent!)
        dialog.remove()
      })
      grid.appendChild(cell)
    }

    trigger.addEventListener('click', () => document.body.appendChild(dialog))

    await expect(fillWidgetWithAria(trigger)).resolves.toBe(true)
    expect(clicked).toEqual(['15'])
  })

  it('escapes when a calendar contains no enabled visible day cells', async () => {
    const trigger = document.createElement('button')
    trigger.setAttribute('aria-haspopup', 'dialog')
    makeVisible(trigger)
    document.body.appendChild(trigger)
    const dialog = document.createElement('div')
    dialog.setAttribute('role', 'dialog')
    makeVisible(dialog)
    const disabled = document.createElement('button')
    disabled.setAttribute('role', 'gridcell')
    disabled.setAttribute('aria-disabled', 'true')
    disabled.textContent = '12'
    makeVisible(disabled)
    dialog.appendChild(disabled)
    trigger.addEventListener('click', () => document.body.appendChild(dialog))
    const keys: string[] = []
    document.addEventListener('keydown', (event) => keys.push((event as KeyboardEvent).key))

    await expect(fillWidgetWithAria(trigger)).resolves.toBe(false)
    expect(keys).toContain('Escape')
  })

  it('falls back to the middle leaf day for an invalid generated date', async () => {
    generateValue.mockResolvedValue('not-a-date')
    const trigger = document.createElement('button')
    trigger.setAttribute('aria-haspopup', 'dialog')
    makeVisible(trigger)
    document.body.appendChild(trigger)
    const dialog = document.createElement('div')
    dialog.setAttribute('role', 'dialog')
    makeVisible(dialog)
    const clicked: string[] = []
    for (const day of ['1', '2', '3']) {
      const cell = document.createElement('button')
      cell.setAttribute('role', 'gridcell')
      cell.textContent = day
      makeVisible(cell)
      cell.addEventListener('click', () => clicked.push(day))
      dialog.appendChild(cell)
    }
    trigger.addEventListener('click', () => document.body.appendChild(dialog))

    await expect(fillWidgetWithAria(trigger)).resolves.toBe(true)
    expect(clicked).toEqual(['2'])
  })
})

describe('fillWidgetWithAria — switch', () => {
  const buildSwitch = (checked: boolean) => {
    const toggle = document.createElement('button')
    toggle.setAttribute('role', 'switch')
    toggle.setAttribute('aria-checked', String(checked))
    makeVisible(toggle)
    toggle.addEventListener('click', () =>
      toggle.setAttribute('aria-checked', String(toggle.getAttribute('aria-checked') !== 'true')),
    )
    document.body.appendChild(toggle)
    return toggle
  }

  it('clicks the switch when the desired state differs', async () => {
    generateValue.mockResolvedValue(true)
    const toggle = buildSwitch(false)

    await expect(fillWidgetWithAria(toggle)).resolves.toBe(true)
    expect(toggle.getAttribute('aria-checked')).toBe('true')
  })

  it('leaves the switch alone when it already has the desired state', async () => {
    generateValue.mockResolvedValue(true)
    const toggle = buildSwitch(true)

    await expect(fillWidgetWithAria(toggle)).resolves.toBe(true)
    expect(toggle.getAttribute('aria-checked')).toBe('true')
  })

  it('normalizes string and missing desired values to booleans', async () => {
    generateValue.mockResolvedValueOnce('true').mockResolvedValueOnce(undefined)
    const enabled = buildSwitch(false)
    const disabled = buildSwitch(true)

    await expect(fillWidgetWithAria(enabled)).resolves.toBe(true)
    await expect(fillWidgetWithAria(disabled)).resolves.toBe(true)
    expect(enabled.getAttribute('aria-checked')).toBe('true')
    expect(disabled.getAttribute('aria-checked')).toBe('false')
  })
})

describe('fillWidgetWithAria — radiogroup', () => {
  const buildRadiogroup = (checkedIndex: number | null) => {
    const group = document.createElement('div')
    group.setAttribute('role', 'radiogroup')
    makeVisible(group)

    const clicked: string[] = []
    for (const [i, label] of ['Small', 'Medium', 'Large'].entries()) {
      const radio = document.createElement('div')
      radio.setAttribute('role', 'radio')
      radio.setAttribute('aria-checked', String(i === checkedIndex))
      radio.textContent = label
      makeVisible(radio)
      radio.addEventListener('click', () => clicked.push(label))
      group.appendChild(radio)
    }

    document.body.appendChild(group)
    return { group, clicked }
  }

  it('selects the radio matching a pinned value', async () => {
    generateValue.mockResolvedValue('Medium')
    const { group, clicked } = buildRadiogroup(null)

    await expect(fillWidgetWithAria(group)).resolves.toBe(true)
    expect(clicked).toEqual(['Medium'])
  })

  it('respects an existing selection', async () => {
    generateValue.mockResolvedValue('')
    const { group, clicked } = buildRadiogroup(0)

    await expect(fillWidgetWithAria(group)).resolves.toBe(true)
    expect(clicked).toEqual([])
  })

  it('returns false when a radiogroup has no enabled visible radios', async () => {
    const group = document.createElement('div')
    group.setAttribute('role', 'radiogroup')
    makeVisible(group)
    document.body.appendChild(group)
    expect(await fillWidgetWithAria(group)).toBe(false)
  })

  it('chooses a random radio when no target value matches', async () => {
    generateValue.mockResolvedValue('Not present')
    const { group, clicked } = buildRadiogroup(null)
    vi.spyOn(faker.helpers, 'arrayElement').mockReturnValue(group.querySelectorAll<HTMLElement>('[role="radio"]')[2])

    await expect(fillWidgetWithAria(group)).resolves.toBe(true)
    expect(clicked).toEqual(['Large'])
  })
})

describe('fillWidgetWithAria — slider', () => {
  it('steps the slider with arrow keys', async () => {
    const slider = document.createElement('div')
    slider.setAttribute('role', 'slider')
    makeVisible(slider)
    document.body.appendChild(slider)

    let presses = 0
    slider.addEventListener('keydown', (e) => {
      if ((e as KeyboardEvent).key === 'ArrowRight') presses++
    })

    await expect(fillWidgetWithAria(slider)).resolves.toBe(true)
    expect(presses).toBeGreaterThan(0)
  })

  it('supports spinbuttons and focuses before stepping', async () => {
    const spinbutton = document.createElement('div')
    spinbutton.setAttribute('role', 'spinbutton')
    makeVisible(spinbutton)
    document.body.appendChild(spinbutton)
    const focus = vi.spyOn(spinbutton, 'focus')
    const keys: string[] = []
    spinbutton.addEventListener('keydown', (event) => keys.push((event as KeyboardEvent).key))

    await expect(fillWidgetWithAria(spinbutton)).resolves.toBe(true)
    expect(focus).toHaveBeenCalledWith({ preventScroll: true })
    expect(keys).toContain('ArrowRight')
  })

  it('returns false for an element without supported widget semantics', async () => {
    await expect(fillWidgetWithAria(document.createElement('div'))).resolves.toBe(false)
  })
})

describe('widgetStrategy', () => {
  it('handles widget elements but not native inputs or plain divs', () => {
    const combobox = document.createElement('button')
    combobox.setAttribute('role', 'combobox')

    const input = document.createElement('input')
    input.setAttribute('role', 'combobox')

    expect(widgetStrategy.canHandle(combobox)).toBe(true)
    expect(widgetStrategy.canHandle(input)).toBe(false)
    expect(widgetStrategy.canHandle(document.createElement('div'))).toBe(false)
  })

  it('reports handled even when the adapter fails, so the field is skipped not retried', async () => {
    // Combobox that never opens a popover -> aria adapter returns false.
    const trigger = document.createElement('button')
    trigger.setAttribute('role', 'combobox')
    makeVisible(trigger)
    document.body.appendChild(trigger)

    await expect(widgetStrategy.fill(trigger)).resolves.toBe(true)
  })
})

describe('ariaAdapter', () => {
  it('is the universal fallback (detects everything)', () => {
    expect(ariaAdapter.detect(document.createElement('div'))).toBe(true)
  })
})

describe('radixAdapter', () => {
  it('detects Radix triggers via data-state plus widget semantics', () => {
    const trigger = document.createElement('button')
    trigger.setAttribute('role', 'combobox')
    trigger.setAttribute('data-state', 'closed')
    expect(radixAdapter.detect(trigger)).toBe(true)

    // data-state without a widget role, and widget role without data-state, both fall through.
    const stateOnly = document.createElement('div')
    stateOnly.setAttribute('data-state', 'closed')
    expect(radixAdapter.detect(stateOnly)).toBe(false)

    const roleOnly = document.createElement('button')
    roleOnly.setAttribute('role', 'combobox')
    expect(radixAdapter.detect(roleOnly)).toBe(false)
  })

  it('fills a Radix-style select through the aria engine', async () => {
    generateValue.mockResolvedValue('Banana')
    const { trigger, clicked } = buildOptionPicker()
    trigger.setAttribute('data-state', 'closed')

    await expect(radixAdapter.fill(trigger)).resolves.toBe(true)
    expect(clicked).toEqual(['Banana'])
  })
})
