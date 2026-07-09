import { getStoreFromStorage } from '.'
import { matchUrl, type Action, type ActionStep } from './actions'

export const RECIPES_STORAGE_KEY = 'recipes'

/**
 * A user-taught widget interaction: "wherever `selector` matches on a site this
 * recipe covers, drive the element with these steps". Recipes make the fill
 * engine framework-independent — they outrank the built-in adapters, which are
 * only defaults. Steps may target the matched element itself via `@self`.
 */
export type Recipe = {
  id: string
  name: string
  active: boolean
  /** Site scoping; an empty matcher value applies the recipe everywhere. */
  matcher: Action['matcher']
  /** CSS selector for the widget (trigger) element the steps drive. */
  selector: string
  steps: ActionStep[]
}

export const getMatchingRecipes = (recipes: Recipe[], url: string): Recipe[] =>
  recipes.filter((recipe) => recipe.active && (!recipe.matcher.value || matchUrl(recipe.matcher, url)))

/** Storage-side reader mirroring getActionsFromStorage, for contexts without a hydrated store. */
export const getRecipesFromStorage = async (): Promise<Recipe[]> => {
  try {
    const state = await getStoreFromStorage(RECIPES_STORAGE_KEY)
    return (state?.recipes as Recipe[]) ?? []
  } catch {
    return []
  }
}
