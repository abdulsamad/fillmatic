import { z } from 'zod'

import type { ActionStep } from '@/utils/actions'

/**
 * Form-level schema for one declarative Action step. `timeoutMs` stays a string here
 * (what an <Input> produces) and is converted to a number on save so the schema's
 * input/output types stay identical for react-hook-form's resolver.
 */
export const actionStepFormSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('click'), selector: z.string().min(1, 'Required') }),
  z.object({ kind: z.literal('clickRandom'), selector: z.string().min(1, 'Required') }),
  z.object({
    kind: z.literal('waitFor'),
    selector: z.string().min(1, 'Required'),
    timeoutMs: z.string().regex(/^\d*$/, 'Digits only').optional(),
  }),
  z.object({ kind: z.literal('type'), selector: z.string().min(1, 'Required'), value: z.string().min(1, 'Required') }),
  z.object({
    kind: z.literal('selectOption'),
    selector: z.string().min(1, 'Required'),
    option: z.string().min(1, 'Required'),
  }),
  z.object({ kind: z.literal('press'), selector: z.string().min(1, 'Required'), key: z.string().min(1, 'Required') }),
])

export const actionStepsFormSchema = z.array(actionStepFormSchema)

export type ActionStepFormValues = z.infer<typeof actionStepsFormSchema>

export const EMPTY_ACTION_STEP = { kind: 'click', selector: '' } as const

export const formStepsToActionSteps = (steps: ActionStepFormValues): ActionStep[] =>
  steps.map((step) =>
    step.kind === 'waitFor'
      ? { kind: 'waitFor', selector: step.selector, timeoutMs: step.timeoutMs ? Number(step.timeoutMs) : undefined }
      : step,
  )

export const actionStepsToForm = (steps: ActionStep[] | undefined): ActionStepFormValues =>
  (steps ?? []).map((step) =>
    step.kind === 'waitFor'
      ? {
          kind: 'waitFor',
          selector: step.selector,
          timeoutMs: step.timeoutMs != null ? String(step.timeoutMs) : undefined,
        }
      : step,
  )
