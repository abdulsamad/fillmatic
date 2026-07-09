import { describe, expect, it } from 'vitest'

import { getMatchingRecipes, getRecipesFromStorage, type Recipe } from '@/utils/recipes'
import { useRecipesStore } from '@/store/recipes'

const recipe = (overrides: Partial<Recipe> = {}): Recipe => ({
  id: 'r-1',
  name: 'Calendar',
  active: true,
  matcher: { type: 'hostname', value: 'example.com' },
  selector: '.datepicker',
  steps: [{ kind: 'click', selector: '@self' }],
  ...overrides,
})

describe('getMatchingRecipes', () => {
  it('filters by active flag and URL matcher, and an empty matcher applies everywhere', () => {
    const matching = recipe()
    const inactive = recipe({ id: 'r-2', active: false })
    const otherSite = recipe({ id: 'r-3', matcher: { type: 'hostname', value: 'other.dev' } })
    const everywhere = recipe({ id: 'r-4', matcher: { type: 'hostname', value: '' } })

    const result = getMatchingRecipes([matching, inactive, otherSite, everywhere], 'https://example.com/form')

    expect(result.map((r) => r.id)).toEqual(['r-1', 'r-4'])
  })
})

describe('useRecipesStore', () => {
  it('adds, updates, deletes and imports recipes (import replaces same ids)', () => {
    useRecipesStore.setState({ recipes: [] })
    const { addRecipe, updateRecipe, deleteRecipe, importRecipes } = useRecipesStore.getState()

    addRecipe(recipe())
    updateRecipe(recipe({ name: 'Renamed' }))
    expect(useRecipesStore.getState().recipes[0].name).toBe('Renamed')

    importRecipes([recipe({ name: 'Imported' }), recipe({ id: 'r-9', name: 'New' })])
    const recipes = useRecipesStore.getState().recipes
    expect(recipes).toHaveLength(2)
    expect(recipes.find((r) => r.id === 'r-1')?.name).toBe('Imported')

    deleteRecipe('r-1')
    deleteRecipe('r-9')
    expect(useRecipesStore.getState().recipes).toEqual([])
  })
})

describe('getRecipesFromStorage', () => {
  // chrome.storage.local.get is overloaded; cast to the Promise shape we use.
  const asAsyncMock = <T,>(fn: unknown) => fn as { mockResolvedValueOnce: (value: T) => void }

  it('reads persisted recipes and falls back to [] on bad payloads', async () => {
    asAsyncMock<Record<string, string>>(chrome.storage.local.get).mockResolvedValueOnce({
      recipes: JSON.stringify({ state: { recipes: [recipe()] }, version: 0 }),
    })
    await expect(getRecipesFromStorage()).resolves.toEqual([recipe()])

    asAsyncMock<Record<string, string>>(chrome.storage.local.get).mockResolvedValueOnce({})
    await expect(getRecipesFromStorage()).resolves.toEqual([])
  })
})
