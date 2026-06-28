import { z } from 'zod'

import { ATTRIBUTE_VALUES, OPERATOR_VALUES } from '@/utils/actions'

/** Zod schema for a single field target — shared by Action and Field Rule forms. */
export const fieldTargetSchema = z.object({
  attribute: z.enum(ATTRIBUTE_VALUES),
  operator: z.enum(OPERATOR_VALUES),
  match: z.string().min(1, 'Required'),
  value: z.string().min(1, 'Required'),
})

/** Zod schema for a non-empty list of field targets. */
export const fieldTargetsSchema = z.array(fieldTargetSchema).min(1, 'Add at least one field')

export const EMPTY_FIELD_TARGET = { attribute: 'id', operator: 'exact', match: '', value: '' } as const
