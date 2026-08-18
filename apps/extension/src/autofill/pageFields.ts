import { getElementType, getWidgetKind, isContentEditable, isSupportedInput, matchElement } from '@/utils'
import {
  getAttributeValue,
  ATTRIBUTE_VALUES,
  type AttributeType,
  type ValueStrategyType,
  type ValueTypeType,
} from '@/utils/actions'

import {
  gatherContenteditableHosts,
  gatherVisibleInputsInOrder,
  gatherWidgetElements,
} from './gatherVisibleInputsInOrder'

/**
 * A serializable description of one fillable element, sent to the side panel
 * mapper. `attribute`/`match` are the suggested FieldTarget selector; `suggested`
 * is the heuristic value guess the AI tier (when available) refines. `ref` indexes
 * into the scan's element list kept on the content-script side (for highlighting).
 */
export type PageField = {
  ref: number
  label: string
  kind: string
  attribute: AttributeType
  match: string
  autocomplete?: string
  suggested: { valueStrategy: ValueStrategyType; valueType: ValueTypeType }
}

const UNFILLABLE_INPUT_TYPES = ['button', 'submit', 'reset', 'hidden', 'image', 'file']

/** Attribute preference for the suggested FieldTarget: most stable/unique first. */
const ATTRIBUTE_PREFERENCE: AttributeType[] = ['id', 'name', 'autocomplete', 'label', 'placeholder']

const pickMatchAttribute = (elem: Element): { attribute: AttributeType; match: string } => {
  for (const attribute of ATTRIBUTE_PREFERENCE) {
    const value = getAttributeValue(elem, attribute)
    if (value) return { attribute, match: value.trim() }
  }
  return { attribute: ATTRIBUTE_VALUES[0], match: '' }
}

/** Human-readable label for the panel row: prefer the actual label, else any identity attribute. */
const describeLabel = (elem: Element): string => {
  for (const attribute of ['label', 'placeholder', 'name', 'id'] as AttributeType[]) {
    const value = getAttributeValue(elem, attribute)
    if (value) return value.trim()
  }
  return '(unlabeled field)'
}

const INPUT_TYPE_TO_VALUE_TYPE: Record<string, ValueTypeType> = {
  email: 'email',
  tel: 'phone',
  number: 'number',
  date: 'date',
  'datetime-local': 'date',
  month: 'date',
  week: 'date',
  url: 'url',
}

const KEYWORD_VALUE_TYPES: [ValueTypeType, string[]][] = [
  ['email', ['email', 'e mail']],
  ['phone', ['phone', 'tel', 'mobile']],
  ['url', ['url', 'website', 'homepage']],
  ['date', ['date', 'birthday', 'dob']],
  ['number', ['amount', 'quantity', 'age']],
  ['fullName', ['full name', 'name']],
]

const suggestValueType = (elem: Element): ValueTypeType => {
  if (elem instanceof HTMLInputElement) {
    const byType = INPUT_TYPE_TO_VALUE_TYPE[elem.type]
    if (byType) return byType
  }

  if (elem instanceof HTMLElement) {
    for (const [valueType, keywords] of KEYWORD_VALUE_TYPES) {
      if (keywords.some((keyword) => matchElement(elem, keyword))) return valueType
    }
  }

  return 'string'
}

const describeKind = (elem: Element): string => {
  if (isSupportedInput(elem)) {
    const type = getElementType(elem)
    return type === 'select' || type === 'textarea' ? type : `input:${type || 'text'}`
  }
  if (isContentEditable(elem)) return 'contenteditable'

  const widgetKind = getWidgetKind(elem)
  return widgetKind ? `widget:${widgetKind}` : 'unknown'
}

const describeField = (elem: Element, ref: number): PageField => {
  const { attribute, match } = pickMatchAttribute(elem)
  const autocomplete = elem instanceof HTMLInputElement && elem.autocomplete ? elem.autocomplete : undefined

  return {
    ref,
    label: describeLabel(elem),
    kind: describeKind(elem),
    attribute,
    match,
    autocomplete,
    suggested: { valueStrategy: 'random', valueType: suggestValueType(elem) },
  }
}

/**
 * Scans the page the same way a fill run discovers elements (native inputs,
 * ARIA widgets, contenteditable hosts) and returns serializable descriptors with
 * heuristic prefills — the non-AI baseline the mapper always has. The parallel
 * `elements` array (same indices as `ref`) stays on the content-script side.
 */
export const buildPageFields = (rootElement: Element | null = null): { fields: PageField[]; elements: Element[] } => {
  const elements: Element[] = [
    ...gatherVisibleInputsInOrder(rootElement).filter(
      (input) => !(input instanceof HTMLInputElement && UNFILLABLE_INPUT_TYPES.includes(input.type)),
    ),
    ...gatherWidgetElements(rootElement),
    ...gatherContenteditableHosts(rootElement),
  ]

  return { fields: elements.map(describeField), elements }
}
