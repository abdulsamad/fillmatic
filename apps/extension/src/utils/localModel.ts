import { VALUE_STRATEGY_VALUES, VALUE_TYPE_VALUES, type ValueStrategyType, type ValueTypeType } from './actions'

/**
 * Thin wrapper around Chrome's built-in Prompt API (Gemini Nano, Chrome 138+ in
 * extension pages). All Prompt API surface goes through this file so API churn
 * touches one place. Everything degrades to 'unavailable' — callers must always
 * have a non-AI path (the heuristic prefill).
 */

export type LocalModelAvailability = 'unavailable' | 'downloadable' | 'downloading' | 'available'

interface LanguageModelSession {
  prompt(input: string, options?: { responseConstraint?: object }): Promise<string>
  destroy?(): void
}

interface LanguageModelStatic {
  availability(): Promise<LocalModelAvailability>
  create(options?: {
    initialPrompts?: { role: 'system' | 'user' | 'assistant'; content: string }[]
    monitor?: (m: {
      addEventListener(type: 'downloadprogress', listener: (e: { loaded: number }) => void): void
    }) => void
  }): Promise<LanguageModelSession>
}

const getLanguageModel = (): LanguageModelStatic | undefined =>
  (globalThis as { LanguageModel?: LanguageModelStatic }).LanguageModel

export const getLocalModelAvailability = async (): Promise<LocalModelAvailability> => {
  const model = getLanguageModel()
  if (typeof model?.availability !== 'function') return 'unavailable'

  try {
    return await model.availability()
  } catch {
    return 'unavailable'
  }
}

/** What the side panel sends the model about one scanned field. */
export type FieldDescriptor = {
  ref: number
  label: string
  kind: string
  autocomplete?: string
}

/** One mapping suggestion per field, keyed back to the scan by `ref`. */
export type FieldInference = {
  ref: number
  valueType: ValueTypeType
  valueStrategy: ValueStrategyType
  value?: string
}

const RESPONSE_SCHEMA = {
  type: 'object',
  required: ['fields'],
  additionalProperties: false,
  properties: {
    fields: {
      type: 'array',
      items: {
        type: 'object',
        required: ['ref', 'valueType', 'valueStrategy'],
        additionalProperties: false,
        properties: {
          ref: { type: 'integer' },
          valueType: { type: 'string', enum: [...VALUE_TYPE_VALUES] },
          valueStrategy: { type: 'string', enum: [...VALUE_STRATEGY_VALUES] },
          value: { type: 'string' },
        },
      },
    },
  },
} as const

const SYSTEM_PROMPT = `You classify web form fields for a dummy-data autofill tool.
For each field you receive (ref, label, kind, autocomplete), decide:
- valueType: what kind of dummy data fits (string, number, date, email, phone, fullName, url)
- valueStrategy: "random" to generate a fresh value each fill (the usual choice), or "exact" with a "value" only when the field clearly needs a specific literal (e.g. a known coupon code).
Respond for every ref you were given.`

/**
 * Asks the on-device model for a field → value-type map, constrained by JSON
 * schema. Returns only structurally valid suggestions; anything malformed is
 * dropped so a bad model response can never corrupt the heuristic prefill it
 * merges into. Returns [] when the model is missing or errors.
 */
export const inferFieldMap = async (
  fields: FieldDescriptor[],
  onDownloadProgress?: (loaded: number) => void,
): Promise<FieldInference[]> => {
  const model = getLanguageModel()
  if (!model || fields.length === 0) return []

  let session: LanguageModelSession | undefined
  try {
    session = await model.create({
      initialPrompts: [{ role: 'system', content: SYSTEM_PROMPT }],
      monitor: onDownloadProgress
        ? (m) => m.addEventListener('downloadprogress', (e) => onDownloadProgress(e.loaded))
        : undefined,
    })

    const raw = await session.prompt(JSON.stringify(fields), { responseConstraint: RESPONSE_SCHEMA })
    const parsed = JSON.parse(raw) as { fields?: FieldInference[] }

    return (parsed.fields ?? []).filter(
      (f) =>
        typeof f?.ref === 'number' &&
        (VALUE_TYPE_VALUES as readonly string[]).includes(f.valueType) &&
        (VALUE_STRATEGY_VALUES as readonly string[]).includes(f.valueStrategy),
    )
  } catch {
    return []
  } finally {
    session?.destroy?.()
  }
}
