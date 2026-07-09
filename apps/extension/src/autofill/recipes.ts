import { useRecipesStore } from '@/store/recipes'
import { log } from '@/utils'
import { getMatchingRecipes, type Recipe } from '@/utils/recipes'

import { runActionSteps } from './runActionSteps'
import { isElementVisible, queryDeepAll } from './gatherVisibleInputsInOrder'

// Elements a recipe drove during the current fill run — the widget strategy skips
// them so a recipe-taught widget isn't also driven by a built-in adapter.
let recipeHandled = new WeakSet<Element>()

export const resetRecipeRun = () => {
  recipeHandled = new WeakSet<Element>()
}

export const wasRecipeHandled = (elem: Element): boolean => recipeHandled.has(elem)

/** The first active recipe for this URL whose selector matches the element. */
export const findRecipeFor = (elem: Element, url: string = window.location.href): Recipe | undefined =>
  getMatchingRecipes(useRecipesStore.getState().recipes, url).find((recipe) => {
    try {
      return elem.matches(recipe.selector)
    } catch {
      return false // malformed user selector
    }
  })

/**
 * Runs a recipe against one element (used by the widget strategy for single-element
 * fills). Marks the element handled either way — a failed recipe should skip the
 * widget, not fall through to an adapter that would interact with it differently.
 */
export const runRecipeForElement = async (elem: HTMLElement, recipe: Recipe): Promise<boolean> => {
  recipeHandled.add(elem)
  const ok = await runActionSteps(recipe.steps, { self: elem })
  if (!ok) log(`Recipe '${recipe.name}' failed on element, skipping it`)
  return ok
}

/**
 * The user-recipe pass of a fill run: for every active recipe matching the current
 * URL, drive each visible element its selector finds (recipes outrank built-in
 * adapters and can target elements no adapter recognizes). Sequential, like the
 * rest of the fill pipeline.
 */
export const runRecipesPass = async (rootElement: Element | null): Promise<void> => {
  const recipes = getMatchingRecipes(useRecipesStore.getState().recipes, window.location.href)
  if (recipes.length === 0) return

  for (const recipe of recipes) {
    let targets: Element[]
    try {
      targets = queryDeepAll(rootElement || document, recipe.selector)
    } catch {
      log(`Recipe '${recipe.name}' has a malformed selector, skipping`)
      continue
    }

    for (const elem of targets) {
      if (!(elem instanceof HTMLElement) || !isElementVisible(elem) || wasRecipeHandled(elem)) continue
      await runRecipeForElement(elem, recipe)
    }
  }
}
