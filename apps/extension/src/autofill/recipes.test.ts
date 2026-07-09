import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { findRecipeFor, resetRecipeRun, runRecipesPass, wasRecipeHandled } from '@/autofill/recipes'
import { widgetStrategy } from '@/autofill/strategies/widget'
import { useConfigStore } from '@/store/config'
import { useRecipesStore } from '@/store/recipes'
import { type Recipe } from '@/utils/recipes'

const makeVisible = (elem: HTMLElement) => {
  Object.defineProperty(elem, 'offsetWidth', { value: 100, configurable: true })
  Object.defineProperty(elem, 'offsetHeight', { value: 20, configurable: true })
  elem.getClientRects = () => [{}] as unknown as DOMRectList
}

const calendarRecipe = (overrides: Partial<Recipe> = {}): Recipe => ({
  id: 'r-cal',
  name: 'Custom calendar',
  active: true,
  matcher: { type: 'hostname', value: '' }, // every site
  selector: '.cal-trigger',
  steps: [
    { kind: 'click', selector: '@self' },
    { kind: 'clickRandom', selector: '.cal-day' },
  ],
  ...overrides,
})

/** A fully custom calendar: no ARIA, just classes — invisible to the built-in adapters. */
const buildCustomCalendar = () => {
  const trigger = document.createElement('div')
  trigger.className = 'cal-trigger'
  makeVisible(trigger)
  document.body.appendChild(trigger)

  const days: string[] = []
  trigger.addEventListener('click', () => {
    const popover = document.createElement('div')
    for (const day of ['1', '2', '3']) {
      const cell = document.createElement('div')
      cell.className = 'cal-day'
      cell.textContent = day
      makeVisible(cell)
      cell.addEventListener('click', () => days.push(day))
      popover.appendChild(cell)
    }
    document.body.appendChild(popover)
  })

  return { trigger, days }
}

beforeEach(() => {
  useConfigStore.setState({ typingEffect: false })
  useRecipesStore.setState({ recipes: [calendarRecipe()] })
  resetRecipeRun()
})

afterEach(() => {
  document.body.innerHTML = ''
  useRecipesStore.setState({ recipes: [] })
})

describe('runRecipesPass', () => {
  it('drives every visible element the recipe selector matches', async () => {
    const { trigger, days } = buildCustomCalendar()

    await runRecipesPass(null)

    expect(days).toHaveLength(1)
    expect(wasRecipeHandled(trigger)).toBe(true)
  })

  it('skips inactive recipes, invisible targets and malformed selectors without throwing', async () => {
    const { days } = buildCustomCalendar()
    const invisible = document.createElement('div')
    invisible.className = 'cal-trigger'
    document.body.appendChild(invisible)

    useRecipesStore.setState({
      recipes: [
        calendarRecipe({ active: false }),
        calendarRecipe({ id: 'r-bad', selector: ':::not-a-selector' }),
      ],
    })

    await runRecipesPass(null)

    expect(days).toHaveLength(0)
    expect(wasRecipeHandled(invisible)).toBe(false)
  })

  it('does not drive the same element twice across passes in one run', async () => {
    const { days } = buildCustomCalendar()

    await runRecipesPass(null)
    await runRecipesPass(null)
    expect(days).toHaveLength(1)

    resetRecipeRun()
    await runRecipesPass(null)
    expect(days).toHaveLength(2)
  })
})

describe('findRecipeFor', () => {
  it('returns the first active matching recipe for the element', () => {
    const elem = document.createElement('div')
    elem.className = 'cal-trigger'

    expect(findRecipeFor(elem)?.id).toBe('r-cal')
    expect(findRecipeFor(document.createElement('div'))).toBeUndefined()
  })
})

describe('widgetStrategy recipe priority', () => {
  it('a recipe outranks the built-in adapters for a widget element', async () => {
    // An ARIA switch that a recipe also targets: the recipe must win.
    const toggle = document.createElement('button')
    toggle.setAttribute('role', 'switch')
    toggle.setAttribute('aria-checked', 'false')
    toggle.className = 'cal-trigger' // matches the recipe selector
    makeVisible(toggle)
    document.body.appendChild(toggle)

    const clicks: string[] = []
    toggle.addEventListener('click', () => clicks.push('recipe-click'))

    useRecipesStore.setState({
      recipes: [calendarRecipe({ steps: [{ kind: 'click', selector: '@self' }] })],
    })

    await expect(widgetStrategy.fill(toggle)).resolves.toBe(true)

    // Exactly one click from the recipe's step — the switch adapter (which would
    // decide based on generateValue) never ran.
    expect(clicks).toEqual(['recipe-click'])
    expect(wasRecipeHandled(toggle)).toBe(true)

    // A second fill in the same run skips the element entirely.
    await expect(widgetStrategy.fill(toggle)).resolves.toBe(true)
    expect(clicks).toEqual(['recipe-click'])
  })
})
