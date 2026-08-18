import { z } from 'zod'

import { ATTRIBUTE_VALUES, OPERATOR_VALUES, VALUE_STRATEGY_VALUES, VALUE_TYPE_VALUES } from '@/utils/actions'

/**
 * Zod schema for a single field target — shared by Action and Field Rule forms.
 * `value` is required for the (default) 'exact' strategy but may be empty when the
 * strategy is 'random' (the value is generated at fill time).
 */
export const fieldTargetSchema = z
  .object({
    attribute: z.enum(ATTRIBUTE_VALUES),
    operator: z.enum(OPERATOR_VALUES),
    match: z.string().min(1, 'Required'),
    value: z.string(),
    valueStrategy: z.enum(VALUE_STRATEGY_VALUES).optional(),
    valueType: z.enum(VALUE_TYPE_VALUES).optional(),
  })
  .superRefine((field, ctx) => {
    if ((field.valueStrategy ?? 'exact') === 'exact' && !field.value) {
      ctx.addIssue({ code: 'custom', message: 'Required', path: ['value'] })
    }
  })

/** Zod schema for a non-empty list of field targets. */
export const fieldTargetsSchema = z.array(fieldTargetSchema).min(1, 'Add at least one field')

/**
 * Row shape without required-ness — for forms (Actions) where untouched empty rows
 * are allowed and filtered on submit. Pair with `isEmptyFieldTarget` and re-implement
 * the required checks at the object level (see ActionsTab) so input/output types stay
 * identical for react-hook-form's resolver.
 */
export const relaxedFieldTargetSchema = z.object({
  attribute: z.enum(ATTRIBUTE_VALUES),
  operator: z.enum(OPERATOR_VALUES),
  match: z.string(),
  value: z.string(),
  valueStrategy: z.enum(VALUE_STRATEGY_VALUES).optional(),
  valueType: z.enum(VALUE_TYPE_VALUES).optional(),
})

/** True for a row the user never filled in (kept in the form, dropped on save). */
export const isEmptyFieldTarget = (field: { match?: string; value?: string }): boolean => !field.match && !field.value

export const EMPTY_FIELD_TARGET = {
  attribute: 'id',
  operator: 'exact',
  match: '',
  value: '',
  valueStrategy: 'exact',
} as const
