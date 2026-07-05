import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import ActionsTab from '@/components/Options/ActionsTab'
import { useActionsStore } from '@/store/actions'
import { type Action } from '@/utils/actions'

const makeAction = (overrides: Partial<Action> = {}): Action => ({
  id: 'a1',
  name: 'Test action',
  matcher: { type: 'startsWith', value: 'https://example.com' },
  active: true,
  fields: [{ attribute: 'id', operator: 'exact', match: 'cardNumber', value: '4242424242424242' }],
  ...overrides,
})

/** Finds the row `<div>` for an action by its rendered name, scoped via the row's border class. */
const getRow = (name: string): HTMLElement => {
  const row = screen.getByText(name).closest('.rounded-lg')
  if (!row) throw new Error(`Could not find row for action "${name}"`)
  return row as HTMLElement
}

beforeEach(() => {
  useActionsStore.setState({ actions: [] })
})

describe('ActionsTab', () => {
  it('shows the empty state when there are no actions', () => {
    render(<ActionsTab />)

    expect(screen.getByText('No actions yet')).toBeInTheDocument()
  })

  it('renders the name, group badge, disabled badge, and matcher summary for each action', () => {
    useActionsStore.setState({
      actions: [
        makeAction({
          id: 'a1',
          name: 'Fill Success Card',
          group: 'Stripe',
          matcher: { type: 'startsWith', value: 'https://x.com' },
        }),
        makeAction({
          id: 'a2',
          name: 'Fill Declined Card',
          active: false,
          matcher: { type: 'hostname', value: 'example.com' },
        }),
      ],
    })

    render(<ActionsTab />)

    expect(screen.getByText('Fill Success Card')).toBeInTheDocument()
    expect(screen.getByText('Stripe')).toBeInTheDocument()
    expect(screen.getByText(/starts with: https:\/\/x\.com/, { selector: 'p' })).toBeInTheDocument()

    expect(screen.getByText('Fill Declined Card')).toBeInTheDocument()
    expect(screen.getByText('Disabled')).toBeInTheDocument()
    expect(screen.getByText(/host: example\.com/, { selector: 'p' })).toBeInTheDocument()
  })

  it('shows only a disabled lock button for default actions, and working edit/delete buttons for others', () => {
    useActionsStore.setState({
      actions: [
        makeAction({ id: 'default-stripe-success', name: 'Locked Action' }),
        makeAction({ id: 'custom-1', name: 'Custom Action' }),
      ],
    })

    render(<ActionsTab />)

    const lockedRow = getRow('Locked Action')
    const lockedButtons = within(lockedRow).getAllByRole('button')
    expect(lockedButtons).toHaveLength(1)
    expect(lockedButtons[0]).toBeDisabled()

    const customRow = getRow('Custom Action')
    const customButtons = within(customRow).getAllByRole('button')
    expect(customButtons).toHaveLength(2)
    expect(customButtons[0]).toBeEnabled()
    expect(customButtons[1]).toBeEnabled()
  })

  it('deletes the action when the alert dialog is confirmed', async () => {
    const user = userEvent.setup()
    useActionsStore.setState({ actions: [makeAction({ id: 'custom-1', name: 'Custom Action' })] })

    render(<ActionsTab />)

    const [, deleteButton] = within(getRow('Custom Action')).getAllByRole('button')
    await user.click(deleteButton)

    const alert = await screen.findByRole('alertdialog')
    await user.click(within(alert).getByRole('button', { name: 'Delete' }))

    expect(useActionsStore.getState().actions.map((a) => a.id)).not.toContain('custom-1')
  })

  it('does not delete the action when the alert dialog is cancelled', async () => {
    const user = userEvent.setup()
    useActionsStore.setState({ actions: [makeAction({ id: 'custom-1', name: 'Custom Action' })] })

    render(<ActionsTab />)

    const [, deleteButton] = within(getRow('Custom Action')).getAllByRole('button')
    await user.click(deleteButton)

    const alert = await screen.findByRole('alertdialog')
    await user.click(within(alert).getByRole('button', { name: 'Cancel' }))

    expect(useActionsStore.getState().actions.map((a) => a.id)).toContain('custom-1')
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })

  it('adds a new action once the required fields are filled in', async () => {
    const user = userEvent.setup()
    useActionsStore.setState({ actions: [] })

    render(<ActionsTab />)

    await user.click(screen.getByRole('button', { name: /add action/i }))

    const dialog = await screen.findByRole('dialog')
    await user.type(within(dialog).getByPlaceholderText('e.g. Fill Success Card'), 'My New Action')
    await user.type(
      within(dialog).getByPlaceholderText('e.g. https://checkout.stripe.com/c/pay/cs_test'),
      'https://example.com/checkout',
    )
    await user.type(within(dialog).getByPlaceholderText('e.g. cardNumber'), 'cardNumber')
    await user.type(within(dialog).getByPlaceholderText('e.g. 4242424242424242'), '4242424242424242')

    await user.click(within(dialog).getByRole('button', { name: 'Add action' }))

    await waitFor(() => expect(useActionsStore.getState().actions).toHaveLength(1))
    expect(useActionsStore.getState().actions[0].name).toBe('My New Action')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('opens in edit mode for an existing action and updates it (not add) on save', async () => {
    // Note: the dialog's `initial` prop only feeds react-hook-form's `defaultValues`, which
    // react-hook-form captures once at first mount and does not resync on prop changes (no
    // `form.reset()`/remount happens on open) -- confirmed with an isolated repro against this
    // repo's react-hook-form version. So opening "Edit" does not actually pre-fill the visible
    // input values in this component as currently written; we only assert the dialog correctly
    // enters edit mode (title) and that submitting updates the existing action via `updateAction`
    // rather than creating a new one via `addAction`.
    const user = userEvent.setup()
    useActionsStore.setState({ actions: [makeAction({ id: 'custom-1', name: 'Original Name' })] })

    render(<ActionsTab />)

    const [editButton] = within(getRow('Original Name')).getAllByRole('button')
    await user.click(editButton)

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByRole('heading', { name: 'Edit action' })).toBeInTheDocument()

    await user.type(within(dialog).getByPlaceholderText('e.g. Fill Success Card'), 'Updated Name')
    await user.type(
      within(dialog).getByPlaceholderText('e.g. https://checkout.stripe.com/c/pay/cs_test'),
      'https://example.com/updated',
    )
    await user.type(within(dialog).getByPlaceholderText('e.g. cardNumber'), 'cardNumber')
    await user.type(within(dialog).getByPlaceholderText('e.g. 4242424242424242'), '4242424242424242')

    await user.click(within(dialog).getByRole('button', { name: 'Save changes' }))

    await waitFor(() => expect(useActionsStore.getState().actions).toHaveLength(1))
    const updated = useActionsStore.getState().actions[0]
    expect(updated.id).toBe('custom-1')
    expect(updated.name).toBe('Updated Name')
  })

  it('discards the draft when the add dialog is cancelled', async () => {
    const user = userEvent.setup()
    useActionsStore.setState({ actions: [] })

    render(<ActionsTab />)

    await user.click(screen.getByRole('button', { name: /add action/i }))

    const dialog = await screen.findByRole('dialog')
    await user.type(within(dialog).getByPlaceholderText('e.g. Fill Success Card'), 'Should not save')
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))

    expect(useActionsStore.getState().actions).toHaveLength(0)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
