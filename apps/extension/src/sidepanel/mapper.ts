import type { PageField } from '@/autofill/pageFields'
import type { FieldTarget } from '@/utils/actions'
import type { FieldDescriptor, FieldInference } from '@/utils/localModel'

/**
 * One editable row in the side-panel mapper: the FieldTarget being built plus the
 * scan metadata used to display and highlight it. `ref` is -1 for rows loaded from
 * a saved snapshot (no live element to highlight).
 */
export type MapperField = {
  ref: number
  label: string
  kind: string
  target: FieldTarget
}

/** The heuristic baseline — what the mapper shows even when no AI is available. */
export const prefillFromScan = (fields: PageField[]): MapperField[] =>
  fields.map((field) => ({
    ref: field.ref,
    label: field.label,
    kind: field.kind,
    target: {
      attribute: field.attribute,
      operator: 'exact',
      match: field.match,
      value: '',
      valueStrategy: field.suggested.valueStrategy,
      valueType: field.suggested.valueType,
    },
  }))

export const toDescriptors = (fields: MapperField[]): FieldDescriptor[] =>
  fields.map((field) => ({ ref: field.ref, label: field.label, kind: field.kind }))

/** Merges model suggestions over the heuristic prefill; unknown refs are ignored. */
export const applyInferences = (fields: MapperField[], inferences: FieldInference[]): MapperField[] => {
  const byRef = new Map(inferences.map((inference) => [inference.ref, inference]))

  return fields.map((field) => {
    const inference = byRef.get(field.ref)
    if (!inference) return field

    return {
      ...field,
      target: {
        ...field.target,
        valueStrategy: inference.valueStrategy,
        valueType: inference.valueType,
        value: inference.value ?? field.target.value,
      },
    }
  })
}

/** Rows that can actually fill something: a matcher, and a value when the strategy is exact. */
export const toFieldTargets = (fields: MapperField[]): FieldTarget[] =>
  fields
    .filter((field) => field.target.match)
    .filter((field) => (field.target.valueStrategy ?? 'exact') === 'random' || field.target.value)
    .map((field) => field.target)

export const fieldsFromSnapshot = (targets: FieldTarget[]): MapperField[] =>
  targets.map((target) => ({ ref: -1, label: target.match, kind: 'saved', target }))

export const hostnameOf = (url: string): string => {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}
