import { create } from 'zustand'
import { persist, createJSONStorage, devtools } from 'zustand/middleware'

import { RECIPES_STORAGE_KEY, type Recipe } from '@/utils/recipes'

interface RecipesStore {
  recipes: Recipe[]
  addRecipe: (recipe: Recipe) => void
  updateRecipe: (recipe: Recipe) => void
  deleteRecipe: (id: string) => void
  importRecipes: (recipes: Recipe[]) => void
}

export const useRecipesStore = create(
  devtools(
    persist<RecipesStore>(
      (set) => ({
        recipes: [],

        addRecipe: (recipe) => set((state) => ({ recipes: [...state.recipes, recipe] })),
        updateRecipe: (recipe) =>
          set((state) => ({ recipes: state.recipes.map((r) => (r.id === recipe.id ? recipe : r)) })),
        deleteRecipe: (id) => set((state) => ({ recipes: state.recipes.filter((r) => r.id !== id) })),
        // Imported recipes replace same-id entries and append the rest.
        importRecipes: (imported) =>
          set((state) => ({
            recipes: [...state.recipes.filter((r) => !imported.some((i) => i.id === r.id)), ...imported],
          })),
      }),
      {
        name: RECIPES_STORAGE_KEY,
        storage: createJSONStorage(() => ({
          getItem: async (name: string) => {
            const value = await chrome.storage.local.get(name)
            return (value[name] as string) || null
          },
          setItem: async (name: string, value: string) => {
            await chrome.storage.local.set({ [name]: value })
          },
          removeItem: async (name: string) => {
            await chrome.storage.local.remove(name)
          },
        })),
      },
    ),
  ),
)
