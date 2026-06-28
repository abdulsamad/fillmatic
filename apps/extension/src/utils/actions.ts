import { isDev, getStoreFromStorage } from '.'

export type MatcherType = 'hostname' | 'startsWith' | 'endsWith' | 'regex'
export type AttributeType = 'id' | 'name' | 'placeholder' | 'label' | 'autocomplete'
export type OperatorType = 'exact' | 'contains' | 'regex'

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

export const ATTRIBUTE_VALUES = ATTRIBUTE_OPTIONS.map((o) => o.value) as [AttributeType, ...AttributeType[]]
export const OPERATOR_VALUES = OPERATOR_OPTIONS.map((o) => o.value) as [OperatorType, ...OperatorType[]]

/** A single field match → fill instruction. Shared by Actions and per-profile Field Rules. */
export type FieldTarget = {
  attribute: AttributeType
  operator: OperatorType
  match: string
  value: string
}

export type Action = {
  id: string // also used as the message id
  name: string // button label shown in popup
  group?: string // optional popup section header (e.g. "Stripe")
  matcher: { type: MatcherType; value: string }
  active: boolean
  matchInIframe?: boolean // preserved passthrough; no behavior change
  fields: FieldTarget[]
}

export const STORAGE_KEY = 'actions'

export const DEFAULT_ACTIONS: Action[] = [
  {
    id: 'default-demo',
    name: 'Fill Specific Data',
    group: 'Fillmatic Demo',
    matcher: {
      type: 'startsWith',
      value: isDev ? 'http://localhost:3000' : 'https://fillmatic.pages.dev/demo/',
    },
    active: isDev,
    fields: [{ attribute: 'name', operator: 'exact', match: 'text', value: 'FillMatic Special Demo Data' }],
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

const getAttributeValue = (elem: Element, attribute: AttributeType): string => {
  switch (attribute) {
    case 'id':
      return elem.id ?? ''
    case 'name':
      return elem instanceof HTMLInputElement || elem instanceof HTMLTextAreaElement || elem instanceof HTMLSelectElement
        ? elem.name
        : ''
    case 'placeholder':
      return elem instanceof HTMLInputElement || elem instanceof HTMLTextAreaElement ? elem.placeholder : ''
    case 'autocomplete':
      return elem instanceof HTMLInputElement ? elem.autocomplete : ''
    case 'label':
      return elem instanceof HTMLInputElement && elem.labels
        ? Array.from(elem.labels)
            .map((label) => label.textContent ?? '')
            .join(' ')
        : ''
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
