import { faker } from '@faker-js/faker'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { fillComboboxInput, isComboboxTextInput } from '@/autofill/strategies/adapters/comboboxInput'

const makeVisible = (elem: HTMLElement) => {
  Object.defineProperty(elem, 'offsetWidth', { value: 100, configurable: true })
  Object.defineProperty(elem, 'offsetHeight', { value: 20, configurable: true })
  elem.getClientRects = () => [{}] as unknown as DOMRectList
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('isComboboxTextInput', () => {
  it('recognizes inputs with a combobox role or list autocomplete', () => {
    const roleInput = document.createElement('input')
    roleInput.setAttribute('role', 'combobox')
    expect(isComboboxTextInput(roleInput)).toBe(true)

    const autoInput = document.createElement('input')
    autoInput.setAttribute('aria-autocomplete', 'list')
    expect(isComboboxTextInput(autoInput)).toBe(true)
  })

  it('rejects plain inputs and non-input widgets', () => {
    expect(isComboboxTextInput(document.createElement('input'))).toBe(false)

    const div = document.createElement('div')
    div.setAttribute('role', 'combobox')
    expect(isComboboxTextInput(div)).toBe(false)
  })
})

describe('fillComboboxInput', () => {
  it('opens the popup on click and picks the option matching the target value', async () => {
    const input = document.createElement('input')
    input.setAttribute('role', 'combobox')
    input.setAttribute('aria-controls', 'combo-menu')
    makeVisible(input)
    document.body.appendChild(input)

    const menu = document.createElement('div')
    menu.id = 'combo-menu'
    menu.setAttribute('role', 'listbox')
    makeVisible(menu)

    const clicked: string[] = []
    for (const label of ['Canada', 'Chile', 'China']) {
      const option = document.createElement('div')
      option.setAttribute('role', 'option')
      option.textContent = label
      makeVisible(option)
      option.addEventListener('click', () => {
        clicked.push(label)
        menu.remove()
      })
      menu.appendChild(option)
    }

    input.addEventListener('click', () => document.body.appendChild(menu))

    await expect(fillComboboxInput(input, 'Chile')).resolves.toBe(true)
    expect(clicked).toEqual(['Chile'])
  })

  it('returns false when no popup opens, so the caller can fall back to typing', async () => {
    const input = document.createElement('input')
    input.setAttribute('role', 'combobox')
    makeVisible(input)
    document.body.appendChild(input)

    await expect(fillComboboxInput(input, 'anything')).resolves.toBe(false)
  })

  it('escapes and returns false when the popup contains no selectable options', async () => {
    const input = document.createElement('input')
    input.setAttribute('role', 'combobox')
    input.setAttribute('aria-controls', 'empty-menu')
    makeVisible(input)
    document.body.appendChild(input)
    const menu = document.createElement('div')
    menu.id = 'empty-menu'
    menu.setAttribute('role', 'listbox')
    makeVisible(menu)
    input.addEventListener('click', () => document.body.appendChild(menu))
    const keys: string[] = []
    input.addEventListener('keydown', (event) => keys.push((event as KeyboardEvent).key))

    await expect(fillComboboxInput(input, 'anything')).resolves.toBe(false)
    expect(keys).toContain('Escape')
  })

  it('randomly picks an option when no target matches and closes a popover that stays open', async () => {
    const input = document.createElement('input')
    input.setAttribute('role', 'combobox')
    input.setAttribute('aria-controls', 'persistent-menu')
    makeVisible(input)
    document.body.appendChild(input)
    const menu = document.createElement('div')
    menu.id = 'persistent-menu'
    menu.setAttribute('role', 'listbox')
    makeVisible(menu)
    const options = ['Alpha', 'Beta'].map((label) => {
      const option = document.createElement('button')
      option.setAttribute('role', 'option')
      option.textContent = label
      makeVisible(option)
      menu.appendChild(option)
      return option
    })
    input.addEventListener('click', () => document.body.appendChild(menu))
    vi.spyOn(faker.helpers, 'arrayElement').mockReturnValue(options[1])
    const clicks: string[] = []
    options[1].addEventListener('click', () => clicks.push('Beta'))
    const keys: string[] = []
    input.addEventListener('keydown', (event) => keys.push((event as KeyboardEvent).key))

    await expect(fillComboboxInput(input, 'missing')).resolves.toBe(true)
    expect(clicks).toEqual(['Beta'])
    expect(keys).toContain('Escape')
  })
})
