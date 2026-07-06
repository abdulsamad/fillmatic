import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/components/Options/Form', () => ({ default: () => <div data-testid="options-form" /> }))

import Options from '@/options/Options'

describe('Options', () => {
  it('renders the welcome heading and the options form', () => {
    render(<Options />)

    expect(screen.getByText(/Welcome, User/)).toBeInTheDocument()
    expect(screen.getByTestId('options-form')).toBeInTheDocument()
  })
})
