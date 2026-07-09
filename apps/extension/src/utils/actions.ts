import { DEMO_URL, DEMO_URL_DEV, PRODUCT_NAME } from '@fillmatic/config'

import { isDev, getStoreFromStorage } from '.'

export type MatcherType = 'hostname' | 'startsWith' | 'endsWith' | 'regex'
export type AttributeType = 'id' | 'name' | 'placeholder' | 'label' | 'autocomplete'
export type OperatorType = 'exact' | 'contains' | 'regex'
export type ValueStrategyType = 'exact' | 'random'
export type ValueTypeType = 'string' | 'number' | 'date' | 'email' | 'phone' | 'fullName' | 'url'

export const ATTRIBUTE_OPTIONS: { value: AttributeType; label: string }[] = [
  { value: 'id', label: 'id' },
  { value: 'name', label: 'name' },
  { value: 'placeholder', label: 'placeholder' },
  { value: 'label', label: 'label' },
  { value: 'autocomplete', label: 'autocomplete' },
]

export const OPERATOR_OPTIONS: { value: OperatorType; label: string }[] = [
  { value: 'exact', label: 'equals' },
  { value: 'contains', label: 'contains' },
  { value: 'regex', label: 'regex' },
]

export const VALUE_STRATEGY_OPTIONS: { value: ValueStrategyType; label: string }[] = [
  { value: 'exact', label: 'exact value' },
  { value: 'random', label: 'random' },
]

export const VALUE_TYPE_OPTIONS: { value: ValueTypeType; label: string }[] = [
  { value: 'string', label: 'string' },
  { value: 'number', label: 'number' },
  { value: 'date', label: 'date' },
  { value: 'email', label: 'email' },
  { value: 'phone', label: 'phone' },
  { value: 'fullName', label: 'full name' },
  { value: 'url', label: 'url' },
]

export const ATTRIBUTE_VALUES = ATTRIBUTE_OPTIONS.map((o) => o.value) as [AttributeType, ...AttributeType[]]
export const OPERATOR_VALUES = OPERATOR_OPTIONS.map((o) => o.value) as [OperatorType, ...OperatorType[]]
export const VALUE_STRATEGY_VALUES = VALUE_STRATEGY_OPTIONS.map((o) => o.value) as [
  ValueStrategyType,
  ...ValueStrategyType[],
]
export const VALUE_TYPE_VALUES = VALUE_TYPE_OPTIONS.map((o) => o.value) as [ValueTypeType, ...ValueTypeType[]]

/** A single field match → fill instruction. Shared by Actions and per-profile Field Rules. */
export type FieldTarget = {
  attribute: AttributeType
  operator: OperatorType
  match: string
  value: string
  /** How to produce the fill value. Absent = 'exact' (the literal `value`, pre-existing behavior). */
  valueStrategy?: ValueStrategyType
  /** What kind of random value to generate when `valueStrategy` is 'random'. */
  valueType?: ValueTypeType
}

/**
 * A declarative automation step an Action runs before its field fill — the no-eval,
 * CWS-safe escape hatch for widgets the built-in adapters can't drive. `type` values
 * support `{{faker.*}}` tokens resolved against a whitelist at run time.
 */
export type ActionStep =
  | { kind: 'click'; selector: string }
  | { kind: 'waitFor'; selector: string; timeoutMs?: number }
  | { kind: 'type'; selector: string; value: string }
  | { kind: 'selectOption'; selector: string; option: string }
  | { kind: 'press'; selector: string; key: string }

export const STEP_KIND_OPTIONS: { value: ActionStep['kind']; label: string }[] = [
  { value: 'click', label: 'Click' },
  { value: 'waitFor', label: 'Wait for' },
  { value: 'type', label: 'Type' },
  { value: 'selectOption', label: 'Select option' },
  { value: 'press', label: 'Press key' },
]

export type Action = {
  id: string // also used as the message id
  name: string // button label shown in popup
  group?: string // optional popup section header (e.g. "Stripe")
  matcher: { type: MatcherType; value: string }
  active: boolean
  matchInIframe?: boolean // preserved passthrough; no behavior change
  rootSelector?: string // CSS selector scoping autofill to a single element (e.g. one form) instead of the whole page
  steps?: ActionStep[] // declarative steps run before the field fill; a steps-only action (fields: []) skips the fill
  fields: FieldTarget[]
}

export const STORAGE_KEY = 'actions'

export const DEFAULT_ACTIONS: Action[] = [
  {
    id: 'default-demo',
    name: 'Custom Action Demo',
    group: `${PRODUCT_NAME} Demo`,
    matcher: {
      type: 'startsWith',
      value: isDev ? DEMO_URL_DEV : DEMO_URL,
    },
    active: true,
    rootSelector: '#allinputs-form',
    fields: [
      { attribute: 'name', operator: 'exact', match: 'text', value: `${PRODUCT_NAME} Special Demo Data` },
      {
        attribute: 'name',
        operator: 'exact',
        match: 'demo_note',
        value: `This textarea was filled by the ${PRODUCT_NAME} Demo action.\n\nYou can set custom values per field using Actions in Settings. Great for things like test card numbers, specific addresses, or any fixed data you fill repeatedly.`,
      },
    ],
  },
  {
    id: 'default-stripe-success',
    name: 'Fill Success Card',
    group: 'Stripe',
    matcher: { type: 'startsWith', value: 'https://checkout.stripe.com/c/pay/cs_test' },
    active: true,
    fields: [{ attribute: 'id', operator: 'exact', match: 'cardNumber', value: '4242424242424242' }],
  },
  {
    id: 'default-stripe-declined',
    name: 'Fill Declined Card',
    group: 'Stripe',
    matcher: { type: 'startsWith', value: 'https://checkout.stripe.com/c/pay/cs_test' },
    active: true,
    fields: [{ attribute: 'id', operator: 'exact', match: 'cardNumber', value: '4000000000000002' }],
  },
  {
    id: 'default-lemonsqueezy-success',
    name: 'Fill Success Card',
    group: 'Lemon Squeezy',
    matcher: { type: 'regex', value: 'https://[^.]+\\.lemonsqueezy\\.com/checkout' },
    active: true,
    fields: [{ attribute: 'id', operator: 'exact', match: 'Field-numberInput', value: '4242424242424242' }],
  },
  {
    id: 'default-lemonsqueezy-declined',
    name: 'Fill Declined Card',
    group: 'Lemon Squeezy',
    matcher: { type: 'regex', value: 'https://[^.]+\\.lemonsqueezy\\.com/checkout' },
    active: true,
    fields: [{ attribute: 'id', operator: 'exact', match: 'Field-numberInput', value: '4000000000000002' }],
  },
  {
    id: 'default-paddle-success',
    name: 'Fill Success Card',
    group: 'Paddle',
    matcher: { type: 'startsWith', value: 'https://sandbox-buy.paddle.com/checkout' },
    active: true,
    matchInIframe: true,
    fields: [{ attribute: 'id', operator: 'exact', match: 'cardNumber', value: '4000056655665556' }],
  },
  {
    id: 'default-paddle-declined',
    name: 'Fill Declined Card',
    group: 'Paddle',
    matcher: { type: 'startsWith', value: 'https://sandbox-buy.paddle.com/checkout' },
    active: true,
    matchInIframe: true,
    fields: [{ attribute: 'id', operator: 'exact', match: 'cardNumber', value: '4000000000000002' }],
  },
]

/** Returns true when the given URL satisfies the action's URL matcher. */
export const matchUrl = (matcher: Action['matcher'], url: string): boolean => {
  switch (matcher.type) {
    case 'hostname':
      try {
        return new URL(url).hostname === matcher.value
      } catch {
        return false
      }
    case 'startsWith':
      return url.startsWith(matcher.value)
    case 'endsWith':
      return url.endsWith(matcher.value)
    case 'regex':
      try {
        return new RegExp(matcher.value).test(url)
      } catch {
        return false
      }
    default:
      return false
  }
}

/** Returns all active actions whose matcher accepts the given URL. */
export const getMatchingActions = (actions: Action[], url: string): Action[] =>
  actions.filter((action) => action.active && matchUrl(action.matcher, url))

export const getAttributeValue = (elem: Element, attribute: AttributeType): string => {
  switch (attribute) {
    case 'id':
      return elem.id ?? ''
    case 'name':
      return elem instanceof HTMLInputElement ||
        elem instanceof HTMLTextAreaElement ||
        elem instanceof HTMLSelectElement
        ? elem.name
        : (elem.getAttribute('name') ?? '')
    case 'placeholder':
      return elem instanceof HTMLInputElement || elem instanceof HTMLTextAreaElement
        ? elem.placeholder
        : (elem.getAttribute('placeholder') ?? '')
    case 'autocomplete':
      return elem instanceof HTMLInputElement ? elem.autocomplete : (elem.getAttribute('autocomplete') ?? '')
    case 'label': {
      if (elem instanceof HTMLInputElement && elem.labels) {
        return Array.from(elem.labels)
          .map((label) => label.textContent ?? '')
          .join(' ')
      }

      // Custom widgets label themselves via ARIA instead of <label>.
      const ariaLabel = elem.getAttribute('aria-label')
      if (ariaLabel) return ariaLabel

      const labelledBy = elem.getAttribute('aria-labelledby')
      if (labelledBy) {
        return labelledBy
          .split(/\s+/)
          .map((refId) => document.getElementById(refId)?.textContent ?? '')
          .join(' ')
          .trim()
      }

      return ''
    }
    default:
      return ''
  }
}

/** Returns true when the element's chosen attribute satisfies the field target's operator/match. */
export const matchFieldTarget = (elem: Element, field: FieldTarget): boolean => {
  const value = getAttributeValue(elem, field.attribute)
  if (!field.match) return false

  switch (field.operator) {
    case 'exact':
      return value.toLowerCase() === field.match.toLowerCase()
    case 'contains':
      return value.toLowerCase().includes(field.match.toLowerCase())
    case 'regex':
      try {
        return new RegExp(field.match).test(value)
      } catch {
        return false
      }
    default:
      return false
  }
}

/**
 * Reads the persisted actions from chrome.storage.local. Falls back to DEFAULT_ACTIONS
 * when nothing has been persisted yet (e.g. first run before the store hydrates/saves).
 * Used by the content script, which can't rely on the Zustand store being hydrated.
 */
export const getActionsFromStorage = async (): Promise<Action[]> => {
  try {
    const state = await getStoreFromStorage(STORAGE_KEY)
    const actions = state?.actions as Action[] | undefined
    return actions ?? DEFAULT_ACTIONS
  } catch {
    return DEFAULT_ACTIONS
  }
}
