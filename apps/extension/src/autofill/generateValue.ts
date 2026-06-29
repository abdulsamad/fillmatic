import { HTMLInputTypeAttribute } from 'react'
import { faker } from '@faker-js/faker'

import { getEffectiveConfig, useProfileStore } from '@/store/profiles'
import { useContentScriptStore as contentScriptStore } from '@/store/content-script'
import { SupportedInputsType } from '@/types'
import { clientLog, isSupportedElement, isSupportedInput, matchElement } from '@/utils'
import { matchFieldTarget } from '@/utils/actions'

interface GenerateValueParams {
  type: HTMLInputTypeAttribute | 'contenteditable'
  elem: SupportedInputsType | Element
}

const getActiveUserRuleValue = (elem: Element): string | undefined => {
  const { profiles, activeProfileId } = useProfileStore.getState()
  const profile = profiles.find((p) => p.id === activeProfileId)
  const rules = profile?.rules ?? []
  if (!rules.length || !(elem instanceof HTMLElement)) return undefined
  const url = window.location.href
  for (const rule of rules) {
    if (url.includes(rule.siteMatcher)) {
      for (const field of rule.rules) {
        if (matchFieldTarget(elem, field)) return field.value
      }
    }
  }
  return undefined
}

export const generateValue = async ({ type, elem }: GenerateValueParams): Promise<string | boolean | undefined> => {
  if (!isSupportedElement(elem)) return ''

  const activeAction = contentScriptStore.getState().activeAction

  if (!isSupportedElement(elem)) return ''

  /* Check for the active action's field targets first */
  if (activeAction && isSupportedInput(elem)) {
    const matchingField = activeAction.fields.find((field) => matchFieldTarget(elem, field))

    if (matchingField) {
      return matchingField.value
    }
  }

  /* Check user-defined field rules */
  const userRuleValue = getActiveUserRuleValue(elem)
  if (userRuleValue !== undefined) return userRuleValue

  /* Generate based on AutoComplete */
  const autoCompleteTokensToSkip = [
    'new-password',
    'current-password',
    'username',
    'bday',
    'bday-day',
    'bday-month',
    'bday-year',
  ]
  if (
    elem instanceof HTMLInputElement &&
    elem.autocomplete &&
    !['off', 'on'].includes(elem.autocomplete) &&
    // Resovle to default propery if any one the token is from the skipped token
    !elem.autocomplete.split(' ').some((token) => autoCompleteTokensToSkip.includes(token))
  ) {
    const fromAutocomplete = handleAutocompleteToken(elem)
    // Only use it when the token was recognized; otherwise fall back to default
    // generation (returning undefined here would skip the field entirely).
    if (fromAutocomplete !== undefined) return fromAutocomplete
  }

  /* Fallback to default generation logic */
  return handleDefaultInputs(type, elem)
}

/**
 * Generates an email, reusing any first/last name already produced earlier in the
 * current fill run so the address stays consistent with name fields, then records
 * the names it generated for later fields. Shared by every email entry point.
 */
const generateEmail = (): string => {
  const config = getEffectiveConfig()
  const { firstName, lastName } = contentScriptStore.getState()

  const newFirstName = faker.person.firstName()
  const newLastName = faker.person.lastName()

  contentScriptStore.setState({ firstName: newFirstName, lastName: newLastName })

  return faker.internet.email({
    firstName: firstName || newFirstName,
    lastName: lastName || newLastName,
    provider: config.tempEmailProvider,
  })
}

const handleAutocompleteToken = (elem: HTMLInputElement) => {
  const contentScriptState = contentScriptStore.getState()
  const tokens = elem.autocomplete.toLowerCase()?.split(' ')
  const mainToken = tokens[tokens.length - 1] // Get the last token

  switch (mainToken) {
    // Digital Contact Tokens
    case 'tel':
    case 'tel-country-code':
    case 'tel-national':
    case 'tel-area-code':
    case 'tel-local':
    case 'tel-local-prefix':
    case 'tel-local-suffix':
    case 'tel-extension': {
      return faker.phone.number()
    }
    case 'email': {
      return generateEmail()
    }
    case 'impp': {
      return faker.internet.url()
    }

    // Personal Information Tokens
    case 'name': {
      return faker.person.fullName()
    }
    case 'honorific-prefix': {
      return faker.person.prefix()
    }
    case 'given-name': {
      const firstName = faker.person.firstName()
      contentScriptStore.setState({ firstName })
      return firstName
    }
    case 'additional-name': {
      return faker.person.middleName()
    }
    case 'family-name': {
      const lastName = faker.person.lastName()
      contentScriptStore.setState({ lastName })
      return lastName
    }
    case 'honorific-suffix': {
      return faker.person.suffix()
    }
    case 'nickname': {
      return faker.internet.username({
        firstName: contentScriptState.firstName,
        lastName: contentScriptState.lastName,
      })
    }
    // case 'username':
    //   return faker.internet.userName()
    // case 'new-password':
    // case 'current-password':
    //   return handlePasswordGeneration(element)
    case 'one-time-code': {
      return faker.number.int({ min: 100000, max: 999999 }).toString()
    }
    case 'organization-title': {
      return faker.person.jobTitle()
    }
    case 'organization': {
      return faker.company.name()
    }

    // Address Tokens
    case 'street-address':
    case 'address-line1':
    case 'address-line2':
    case 'address-line3': {
      return faker.location.streetAddress()
    }
    case 'address-level4':
    case 'address-level3':
    case 'address-level2':
    case 'address-level1': {
      return faker.location.city()
    }
    case 'country':
    case 'country-name': {
      return faker.location.country()
    }
    case 'postal-code': {
      return faker.location.zipCode()
    }

    // Payment Tokens
    case 'cc-name':
    case 'cc-given-name':
    case 'cc-additional-name':
    case 'cc-family-name': {
      const fullName = faker.person.fullName()
      contentScriptStore.setState({ firstName: fullName })
      return fullName
    }
    case 'cc-number': {
      return faker.finance.creditCardNumber()
    }
    case 'cc-exp': {
      const currentDate = new Date()
      const placeholder = elem?.placeholder || elem?.pattern || 'MM/YY'
      const separator = placeholder.includes('/') ? '/' : '-'
      const parts = placeholder?.split(separator)

      let month = (currentDate.getMonth() + 1).toString()
      let year = currentDate.getFullYear().toString().slice(-2)

      if (parts.includes('MM')) {
        month = month.toString().padStart(2, '0')
      }

      if (parts.includes('YY')) {
        year = year.toString()
      } else if (parts.includes('YYYY')) {
        year = currentDate.getFullYear().toString()
      }

      return `${month}${separator}${year}`
    }
    case 'cc-exp-month': {
      return faker.date.future().getMonth().toString().padStart(2, '0')
    }
    case 'cc-exp-year': {
      return faker.date.future().getFullYear().toString()
    }
    case 'cc-csc': {
      return faker.finance.creditCardCVV()
    }
    case 'cc-type': {
      return faker.finance.creditCardIssuer()
    }
    case 'transaction-currency': {
      return faker.finance.currencyCode()
    }
    case 'transaction-amount': {
      return faker.finance.amount()
    }

    // Other Tokens
    case 'language': {
      return faker.location.country()
    }
    case 'sex': {
      return faker.person.sex()
    }
    case 'url': {
      return faker.internet.url()
    }
    case 'photo': {
      return faker.image.url()
    }

    // Recipient Tokens
    case 'recipient-name': {
      return faker.person.fullName()
    }
    case 'recipient-email': {
      return generateEmail()
    }
    case 'recipient-phone': {
      return faker.phone.number()
    }

    // Group Tokens
    case 'group-name': {
      return faker.company.name()
    }
    case 'group-description': {
      return faker.lorem.sentence()
    }
    case 'group-member': {
      return faker.person.fullName()
    }

    // Named Tokens
    case 'named-entity': {
      return faker.company.name()
    }
    case 'named-entity-type': {
      return faker.company.buzzNoun()
    }
  }
}

/** Caps a value to the element's maxLength when one is set. */
const sliceToMax = (value: string, elem: HTMLInputElement): string =>
  elem.maxLength > 0 ? value.slice(0, elem.maxLength) : value

/** Builds a date string, honouring a `dd/mm/yyyy`-style placeholder when present. */
const generateTextDate = (elem: HTMLInputElement): string => {
  const isDateOfBirth = matchElement(elem, 'birth') || matchElement(elem, 'dob')
  // Date of birth → someone over 18; otherwise a recent date.
  const date = isDateOfBirth ? faker.date.birthdate() : faker.date.recent()

  const format = elem.placeholder?.toLowerCase()
  if (
    format &&
    format.includes('dd') &&
    format.includes('mm') &&
    (format.includes('yy') || format.includes('yyyy'))
  ) {
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear().toString()
    const shortYear = year.slice(-2)

    let formattedDate = format.replace('dd', day).replace('mm', month)
    formattedDate = format.includes('yyyy') ? formattedDate.replace('yyyy', year) : formattedDate.replace('yy', shortYear)

    return formattedDate
  }

  return date.toISOString()?.split('T')[0]
}

/**
 * Heuristic generators for `text` inputs, keyed off the field's identity
 * (name/id/placeholder/label/class) via `matchElement`. Rules are evaluated in
 * order and the first whose keywords match wins, so put more specific entries
 * first. Add a new field type by appending one entry here.
 */
type TextFieldRule = {
  match: string[]
  generate: (elem: HTMLInputElement) => string | Promise<string>
}

const textFieldRules: TextFieldRule[] = [
  {
    match: ['full name'],
    generate: (elem) => {
      const fullName = faker.person.fullName()
      contentScriptStore.setState({ firstName: fullName })
      return sliceToMax(fullName, elem)
    },
  },
  {
    match: ['first name', 'given name'],
    generate: (elem) => {
      const firstName = faker.person.firstName()
      contentScriptStore.setState({ firstName })
      return sliceToMax(firstName, elem)
    },
  },
  {
    match: ['last name', 'surname', 'family name'],
    generate: (elem) => {
      const lastName = faker.person.lastName()
      contentScriptStore.setState({ lastName })
      return sliceToMax(lastName, elem)
    },
  },
  { match: ['email', 'e-mail', 'mail'], generate: () => generateEmail() },
  { match: ['phone', 'tel', 'mobile', 'cell'], generate: () => faker.phone.number() },
  { match: ['date'], generate: (elem) => generateTextDate(elem) },
  // Address group — order matters: more specific tokens before the bare `address` catch-all.
  { match: ['street'], generate: () => faker.location.streetAddress() },
  { match: ['city'], generate: () => faker.location.city() },
  // Using a combination of city and state for a more suburb-like result.
  { match: ['suburb'], generate: () => `${faker.location.city()} ${faker.location.state({ abbreviated: true })}` },
  { match: ['state'], generate: () => faker.location.state() },
  { match: ['zip', 'postal', 'postalCode'], generate: () => faker.location.zipCode() },
  { match: ['district'], generate: () => faker.location.county() },
  { match: ['address'], generate: () => faker.location.streetAddress() },
  {
    match: [
      'confirm password',
      'reenter password',
      'reenter',
      'confirm reenter',
      'reenter PIN',
      're-enter',
      'confirm re-enter',
      're-enter PIN',
      'confirm',
    ],
    generate: (elem) => handlePasswordGeneration(elem, true),
  },
  { match: ['company', 'organization'], generate: () => faker.company.name() },
  { match: ['job title', 'job'], generate: () => faker.person.jobTitle() },
  { match: ['department'], generate: () => faker.commerce.department() },
  { match: ['cardnumber'], generate: () => faker.finance.creditCardNumber({ issuer: 'visa' }) },
  {
    match: ['cardExpiry'],
    generate: () => {
      const futureDate = faker.date.future()
      const month = (futureDate.getMonth() + 1).toString().padStart(2, '0')
      const year = futureDate.getFullYear().toString().slice(-2)
      return `${month}/${year}`
    },
  },
  { match: ['cvv', 'cvc'], generate: () => faker.finance.creditCardCVV() },
  { match: ['cardtype'], generate: () => faker.finance.creditCardIssuer() },
  {
    match: ['Day'],
    generate: (elem) =>
      elem.maxLength === 2
        ? faker.date.birthdate().getDate().toString().padStart(2, '0')
        : faker.date.birthdate().getDate().toString(),
  },
]

const handleDefaultInputs = (type: HTMLInputTypeAttribute | 'contenteditable', elem: SupportedInputsType | Element) => {
  const config = getEffectiveConfig()

  switch (type) {
    case 'text': {
      if (elem instanceof HTMLInputElement) {
        for (const rule of textFieldRules) {
          if (rule.match.some((keyword) => matchElement(elem, keyword))) {
            return rule.generate(elem)
          }
        }
        return sliceToMax(faker.lorem.word(), elem)
      }
      return faker.lorem.word()
    }
    case 'search': {
      return faker.lorem.word()
    }
    case 'password': {
      if (elem instanceof HTMLInputElement) {
        if (matchElement(elem, 'confirm') || matchElement(elem, 'reenter') || matchElement(elem, 're-enter')) {
          return handlePasswordGeneration(elem, true)
        }
        return handlePasswordGeneration(elem)
      }
      return faker.internet.password({ length: 8 })
    }
    case 'email': {
      return generateEmail()
    }
    case 'number': {
      if (elem instanceof HTMLInputElement) {
        const min = elem.min ? parseInt(elem.min, 10) : 1
        const max = elem.max ? parseInt(elem.max, 10) : 100
        return faker.number.int({ min, max }).toString()
      }
      return faker.number.int({ min: 1, max: 100 }).toString()
    }
    case 'url': {
      return faker.internet.url()
    }
    case 'tel': {
      return faker.helpers.fromRegExp('501-[0-9]{3}-[0-9]{3}')
    }
    case 'date': {
      if (elem instanceof HTMLInputElement) {
        const min = elem.min ? new Date(elem.min) : new Date('1970-01-01')
        const max = elem.max ? new Date(elem.max) : new Date()
        return faker.date.between({ from: min, to: max }).toISOString()?.split('T')[0]
      }
      return faker.date.recent().toISOString()?.split('T')[0]
    }
    case 'time': {
      if (elem instanceof HTMLInputElement) {
        const min = elem.min ? elem.min : '00:00'
        const max = elem.max ? elem.max : '23:59'
        const [minHour, _minMinute] = min.split(':').map(Number)
        const [maxHour, maxMinute] = max.split(':').map(Number)
        const hour = faker.number.int({ min: minHour, max: maxHour })
        const minute =
          hour === maxHour ? faker.number.int({ min: 0, max: maxMinute }) : faker.number.int({ min: 0, max: 59 })
        return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      }
      return faker.date.recent().toTimeString()?.split(' ')[0].slice(0, 5)
    }
    case 'datetime-local': {
      if (elem instanceof HTMLInputElement) {
        const min = elem.min ? new Date(elem.min) : new Date('1970-01-01T00:00')
        const max = elem.max ? new Date(elem.max) : new Date()
        const date = faker.date.between({ from: min, to: max })
        return date.toISOString().slice(0, 16).replace('T', ' ')
      }
      return faker.date.recent().toISOString().slice(0, 16).replace('T', ' ')
    }
    case 'month': {
      if (elem instanceof HTMLInputElement) {
        const min = elem.min ? new Date(elem.min + '-01') : new Date('1970-01-01')
        const max = elem.max ? new Date(elem.max + '-01') : new Date()
        return faker.date.between({ from: min, to: max }).toISOString().slice(0, 7)
      }
      return faker.date.recent().toISOString().slice(0, 7)
    }
    case 'week': {
      if (elem instanceof HTMLInputElement) {
        const min = elem.min ? new Date(elem.min.replace('W', '-')) : new Date('1970-01-01')
        const max = elem.max ? new Date(elem.max.replace('W', '-')) : new Date()
        const d = faker.date.between({ from: min, to: max })
        const onejan = new Date(d.getFullYear(), 0, 1)
        const weekNum = Math.ceil(((d.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7)
        return `${d.getFullYear()}-W${weekNum.toString().padStart(2, '0')}`
      }
      const d = faker.date.recent()
      const onejan = new Date(d.getFullYear(), 0, 1)
      const weekNum = Math.ceil(((d.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7)
      return `${d.getFullYear()}-W${weekNum.toString().padStart(2, '0')}`
    }
    case 'textarea': {
      if (elem instanceof HTMLTextAreaElement && elem.maxLength > 0) {
        return faker.lorem.paragraph().slice(0, elem.maxLength)
      }
      return faker.lorem.paragraph()
    }
    case 'select': {
      if (elem instanceof HTMLSelectElement) {
        const options = Array.from(elem.options)
        return faker.helpers.arrayElement(options).value
      }
      return ''
    }
    case 'checkbox': {
      if (elem instanceof HTMLInputElement) {
        // Check if the field matches any in alwaysCheckFields
        if (config?.alwaysCheckFields?.split(',').some((field) => matchElement(elem, field.trim()))) {
          return true
        }

        if (elem.name) {
          const checkboxes = document.querySelectorAll(`input[name="${elem.name}"][type="checkbox"]`)
          if (checkboxes.length > 1) {
            // If multiple checkboxes with the same name, randomly check one
            const randomCheckbox = faker.helpers.arrayElement(Array.from(checkboxes)) as HTMLInputElement
            return randomCheckbox === elem
          }
        }

        // For single checkboxes or those without a name, randomly set to true or false
        return faker.datatype.boolean()
      }
      return faker.datatype.boolean()
    }
    case 'radio': {
      if (elem instanceof HTMLInputElement && elem.name) {
        const radios = document.querySelectorAll(`input[name="${elem.name}"][type="radio"]`)
        const randomRadio = faker.helpers.arrayElement(Array.from(radios)) as HTMLInputElement
        return randomRadio === elem
      }
      return faker.datatype.boolean()
    }
    case 'color': {
      return faker.color.rgb({ format: 'hex', prefix: '#' })
    }
    case 'range': {
      if (elem instanceof HTMLInputElement) {
        const min = elem.min ? parseInt(elem.min, 10) : 1
        const max = elem.max ? parseInt(elem.max, 10) : 100
        return faker.number.int({ min, max }).toString()
      }
      return ''
    }
    case 'contenteditable': {
      return faker.lorem.sentence()
    }
    default: {
      return ''
    }
  }
}

const handlePasswordGeneration = async (elem: HTMLInputElement, reenter = false) => {
  let generatedPassword: string = ''
  const config = getEffectiveConfig()
  const contentScriptState = contentScriptStore.getState()
  const maxLength = elem.maxLength > 0 ? elem.maxLength : 8
  const minLength = elem.minLength > 0 ? elem.minLength : undefined
  const samePasswordEverytime = config.samePasswordEverytime

  // TODO: Handle is common PIN or Password is less or more then max/min length
  if (reenter) {
    const { lastGeneratedPassword } = contentScriptState

    if (lastGeneratedPassword) {
      generatedPassword = elem.maxLength > 0 ? lastGeneratedPassword.slice(0, elem.maxLength) : lastGeneratedPassword
    }
  } else if (matchElement(elem, 'pin')) {
    const hardcodedPin = '111111'
    const pinLength = minLength || maxLength

    if (samePasswordEverytime && hardcodedPin.length <= maxLength) {
      generatedPassword = hardcodedPin.slice(0, pinLength)
    } else {
      generatedPassword = faker.number
        .int({ min: Math.pow(10, pinLength - 1), max: Math.pow(10, pinLength) - 1 })
        .toString()
    }

    clientLog('Generated PIN: ', generatedPassword)
    contentScriptStore.setState({ lastGeneratedPassword: generatedPassword })
  } else {
    const hardcodedPassword = config.commonPassword
    const passwordLength = minLength || maxLength

    if (samePasswordEverytime && hardcodedPassword.length <= maxLength) {
      generatedPassword = hardcodedPassword.slice(0, passwordLength)
    } else {
      generatedPassword = faker.internet.password({
        length: passwordLength,
        pattern: elem?.pattern ? new RegExp(elem.pattern) : undefined,
      })
    }

    clientLog('Generated password: ', generatedPassword)
    contentScriptStore.setState({ lastGeneratedPassword: generatedPassword })
  }

  return generatedPassword
}
