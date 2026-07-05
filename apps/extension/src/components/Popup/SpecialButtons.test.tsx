import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import SpecialButtons from '@/components/Popup/SpecialButtons'
import { useActionsStore } from '@/store/actions'
import { usePopupStore } from '@/store/popup'
import { type Action } from '@/utils/actions'

const makeAction = (overrides: Partial<Action> = {}): Action => ({
  id: 'a1',
  name: 'Fill Card',
  matcher: { type: 'startsWith', value: 'https://example.com' },
  active: true,
  fields: [],
  ...overrides,
})

const fillData = vi.fn().mockResolvedValue(undefined)

beforeEach(() => {
  useActionsStore.setState({ actions: [] })
  usePopupStore.setState({ isAutofilling: false, currentTab: { url: 'https://example.com/checkout' } as never, fillData })
  fillData.mockClear()
})

describe('SpecialButtons', () => {
  it('renders nothing when there is no current tab url', () => {
    usePopupStore.setState({ currentTab: null })
    useActionsStore.setState({ actions: [makeAction()] })

    const { container } = render(<SpecialButtons />)

    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing when no actions match the current tab', () => {
    useActionsStore.setState({ actions: [makeAction({ matcher: { type: 'startsWith', value: 'https://other.com' } })] })

    const { container } = render(<SpecialButtons />)

    expect(container).toBeEmptyDOMElement()
  })

  it('groups matching actions by their group label, defaulting to "Actions", preserving first-seen order', () => {
    useActionsStore.setState({
      actions: [
        makeAction({ id: 'a1', name: 'First', group: 'Stripe' }),
        makeAction({ id: 'a2', name: 'Second' }),
        makeAction({ id: 'a3', name: 'Third', group: 'Stripe' }),
      ],
    })

    render(<SpecialButtons />)

    const headings = screen.getAllByRole('heading').map((h) => h.textContent)
    expect(headings).toEqual(['Stripe', 'Actions'])
    expect(screen.getByText('First')).toBeInTheDocument()
    expect(screen.getByText('Second')).toBeInTheDocument()
    expect(screen.getByText('Third')).toBeInTheDocument()
  })

  it('disables all action buttons while autofilling', () => {
    useActionsStore.setState({ actions: [makeAction()] })
    usePopupStore.setState({ isAutofilling: true })

    render(<SpecialButtons />)

    expect(screen.getByRole('button', { name: 'Fill Card' })).toBeDisabled()
  })

  it('calls fillData with fillType "site" and the action id when clicked', async () => {
    const user = userEvent.setup()
    useActionsStore.setState({ actions: [makeAction({ id: 'stripe-success' })] })

    render(<SpecialButtons />)
    await user.click(screen.getByRole('button', { name: 'Fill Card' }))

    expect(fillData).toHaveBeenCalledWith({ fillType: 'site', messageId: 'stripe-success' })
  })
})
