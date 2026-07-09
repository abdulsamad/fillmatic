import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import RecipesTab from '@/components/Options/RecipesTab'
import { useRecipesStore } from '@/store/recipes'
import { type Recipe } from '@/utils/recipes'

const makeRecipe = (overrides: Partial<Recipe> = {}): Recipe => ({
  id: 'r-1',
  name: 'Booking calendar',
  active: true,
  matcher: { type: 'hostname', value: 'example.com' },
  selector: '.datepicker-trigger',
  steps: [
    { kind: 'click', selector: '@self' },
    { kind: 'clickRandom', selector: '.day:not(.disabled)' },
  ],
  ...overrides,
})

beforeEach(() => {
  useRecipesStore.setState({ recipes: [] })
})

describe('RecipesTab', () => {
  it('shows the empty state when there are no recipes', () => {
    render(<RecipesTab />)

    expect(screen.getByText('No recipes yet')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /export/i })).toBeDisabled()
  })

  it('renders recipe rows with matcher, selector and step count', () => {
    useRecipesStore.setState({
      recipes: [
        makeRecipe(),
        makeRecipe({
          id: 'r-2',
          name: 'Everywhere switch',
          active: false,
          matcher: { type: 'hostname', value: '' },
          steps: [{ kind: 'click', selector: '@self' }],
        }),
      ],
    })
    render(<RecipesTab />)

    expect(screen.getByText('Booking calendar')).toBeInTheDocument()
    expect(screen.getByText(/host: example\.com/)).toBeInTheDocument()
    expect(screen.getByText(/2 steps/)).toBeInTheDocument()
    expect(screen.getByText(/1 step\b/)).toBeInTheDocument()
    expect(screen.getByText(/every site/)).toBeInTheDocument()
    expect(screen.getByText('Disabled')).toBeInTheDocument()
  })

  it('adds a recipe through the dialog', async () => {
    const user = userEvent.setup()
    render(<RecipesTab />)

    await user.click(screen.getByRole('button', { name: /add recipe/i }))
    await user.type(screen.getByPlaceholderText('e.g. Booking calendar'), 'My calendar')
    await user.type(screen.getByPlaceholderText('e.g. .datepicker-trigger'), '.cal-btn')
    // The dialog seeds one default step (click @self), so the form is submittable as-is.
    await user.click(screen.getByRole('button', { name: /^add recipe$/i }))

    await waitFor(() => expect(useRecipesStore.getState().recipes).toHaveLength(1))
    expect(useRecipesStore.getState().recipes[0]).toMatchObject({
      name: 'My calendar',
      selector: '.cal-btn',
      steps: [{ kind: 'click', selector: '@self' }],
    })
  })

  it('deletes a recipe after confirmation', async () => {
    useRecipesStore.setState({ recipes: [makeRecipe()] })
    const user = userEvent.setup()
    render(<RecipesTab />)

    await user.click(screen.getByRole('button', { name: /delete booking calendar/i }))
    await user.click(await screen.findByRole('button', { name: /^delete$/i }))

    await waitFor(() => expect(useRecipesStore.getState().recipes).toEqual([]))
  })

  it('imports recipes from a JSON file, replacing same-id entries', async () => {
    useRecipesStore.setState({ recipes: [makeRecipe({ name: 'Old name' })] })
    const user = userEvent.setup()
    render(<RecipesTab />)

    const file = new File(
      [JSON.stringify([makeRecipe({ name: 'New name' }), makeRecipe({ id: 'r-2', name: 'Second' })])],
      'recipes.json',
      { type: 'application/json' },
    )
    await user.upload(screen.getByLabelText('Import recipes file'), file)

    await waitFor(() => expect(useRecipesStore.getState().recipes).toHaveLength(2))
    expect(useRecipesStore.getState().recipes.find((r) => r.id === 'r-1')?.name).toBe('New name')
  })

  it('exports recipes as a JSON download', async () => {
    useRecipesStore.setState({ recipes: [makeRecipe()] })
    const createSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    const user = userEvent.setup()
    render(<RecipesTab />)

    await user.click(screen.getByRole('button', { name: /export/i }))

    expect(createSpy).toHaveBeenCalledOnce()
    vi.restoreAllMocks()
  })
})
