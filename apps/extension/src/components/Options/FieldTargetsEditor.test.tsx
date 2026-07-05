import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Form } from '@fillmatic/ui'
import { useEffect } from 'react'
import { useForm, type UseFormReturn } from 'react-hook-form'
import { describe, expect, it } from 'vitest'

import FieldTargetsEditor from '@/components/Options/FieldTargetsEditor'
import { type FieldTarget } from '@/utils/actions'

const makeTarget = (overrides: Partial<FieldTarget> = {}): FieldTarget => ({
  attribute: 'id',
  operator: 'exact',
  match: '',
  value: '',
  ...overrides,
})

const Harness = ({
  defaultFields,
  onReady,
}: {
  defaultFields: FieldTarget[]
  onReady?: (form: UseFormReturn<{ fields: FieldTarget[] }>) => void
}) => {
  const form = useForm<{ fields: FieldTarget[] }>({ defaultValues: { fields: defaultFields } })

  useEffect(() => {
    onReady?.(form)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Form {...form}>
      <FieldTargetsEditor name="fields" />
    </Form>
  )
}

describe('FieldTargetsEditor', () => {
  it('renders one row per field with the label and column headers', () => {
    render(<Harness defaultFields={[makeTarget(), makeTarget()]} />)

    expect(screen.getByText('Fields to fill')).toBeInTheDocument()
    expect(screen.getAllByPlaceholderText('e.g. cardNumber')).toHaveLength(2)
  })

  it('appends a new empty row when "Add field" is clicked', async () => {
    const user = userEvent.setup()
    render(<Harness defaultFields={[makeTarget()]} />)

    await user.click(screen.getByRole('button', { name: /add field/i }))

    expect(screen.getAllByPlaceholderText('e.g. cardNumber')).toHaveLength(2)
  })

  it('disables the remove button when only one row remains', () => {
    render(<Harness defaultFields={[makeTarget()]} />)

    const removeButtons = screen.getAllByRole('button', { name: '' })
    expect(removeButtons[0]).toBeDisabled()
  })

  it('enables remove buttons and removes a row when clicked, once more than one row exists', async () => {
    const user = userEvent.setup()
    render(<Harness defaultFields={[makeTarget(), makeTarget()]} />)

    const removeButtons = screen.getAllByRole('button', { name: '' })
    expect(removeButtons[0]).toBeEnabled()

    await user.click(removeButtons[0])

    expect(screen.getAllByPlaceholderText('e.g. cardNumber')).toHaveLength(1)
  })

  it('shows the root-level error message when the field array itself is invalid', async () => {
    let formRef: UseFormReturn<{ fields: FieldTarget[] }> | undefined
    render(<Harness defaultFields={[makeTarget()]} onReady={(form) => (formRef = form)} />)

    act(() => {
      formRef!.setError('fields.root' as never, { message: 'Add at least one field' })
    })

    expect(await screen.findByText('Add at least one field')).toBeInTheDocument()
  })
})
