import { afterEach, describe, expect, it } from 'vitest'

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
})
