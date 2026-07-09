import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Form } from '@fillmatic/ui'
import { useForm } from 'react-hook-form'
import { describe, expect, it } from 'vitest'

import ActionStepsEditor from '@/components/Options/ActionStepsEditor'
import { type ActionStepFormValues } from '@/components/Options/actionSteps'

const Harness = ({ defaultSteps = [] }: { defaultSteps?: ActionStepFormValues }) => {
  const form = useForm<{ steps: ActionStepFormValues }>({ defaultValues: { steps: defaultSteps } })

  return (
    <Form {...form}>
      <ActionStepsEditor name="steps" />
    </Form>
  )
}

describe('ActionStepsEditor', () => {
  it('renders empty with just the add button and appends a row when clicked', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    expect(screen.queryByPlaceholderText('CSS selector')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /add step/i }))

    expect(screen.getByPlaceholderText('CSS selector')).toBeInTheDocument()
  })

  it('shows the kind-specific extra input per row', () => {
    render(
      <Harness
        defaultSteps={[
          { kind: 'type', selector: '#a', value: 'hello' },
          { kind: 'press', selector: '#b', key: 'Enter' },
          { kind: 'waitFor', selector: '#c', timeoutMs: '1000' },
          { kind: 'selectOption', selector: '#d', option: 'Chile' },
          { kind: 'click', selector: '#e' },
        ]}
      />,
    )

    expect(screen.getByPlaceholderText('text or {{faker.internet.email}}')).toHaveValue('hello')
    expect(screen.getByPlaceholderText('e.g. Enter, Escape')).toHaveValue('Enter')
    expect(screen.getByPlaceholderText('timeout ms (default 5000)')).toHaveValue('1000')
    expect(screen.getByPlaceholderText('option label')).toHaveValue('Chile')
    expect(screen.getAllByPlaceholderText('CSS selector')).toHaveLength(5)
  })

  it('removes a row when its remove button is clicked', async () => {
    const user = userEvent.setup()
    render(<Harness defaultSteps={[{ kind: 'click', selector: '#only' }]} />)

    const removeButtons = screen.getAllByRole('button', { name: '' })
    await user.click(removeButtons[removeButtons.length - 1])

    expect(screen.queryByPlaceholderText('CSS selector')).not.toBeInTheDocument()
  })
})
