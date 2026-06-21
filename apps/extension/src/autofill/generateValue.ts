import { HTMLInputTypeAttribute } from 'react'
import { faker } from '@faker-js/faker'

// import { getUserRule } from '@/utils/user-rules'
// import { getProfile } from '@/utils/user-profiles'

import { useConfigStore as configStore } from '@/store/config'
import { useContentScriptStore as contentScriptStore } from '@/store/content-script'
import { SupportedInputsType } from '@/types'
import { clientLog, isSupportedElement, isSupportedInput, matchElement } from '@/utils'

interface GenerateValueParams {
  type: HTMLInputTypeAttribute | 'contenteditable'
  elem: SupportedInputsType | Element
}

export const generateValue = async ({ type, elem }: GenerateValueParams): Promise<string | boolean | undefined> => {
  if (!isSupportedElement(elem)) return ''

  const siteRule = contentScriptStore.getState().siteRule
  const message = contentScriptStore.getState().message

  // const userRule = getUserRule(currentUrl)
  // const profile = config.selectedProfile ? getProfile(config.selectedProfile) : undefined

  if (!isSupportedElement(elem)) return ''

  /* Check profile rules first */
  // if (profile && element instanceof HTMLElement) {
  //   const elementName = element.name || element.id
  //   if (elementName && profile.rules[elementName]) {
  //     const rule = profile.rules[elementName]
  //     return typeof rule === 'function' ? rule(element as SupportedInputsType) : rule
  //   }
  // }

  /* Check for user-defined rules first */
  // if (userRule && element instanceof HTMLElement) {
  //   const elementName = element.name || element.id
  //   if (elementName && userRule.rules[elementName]) {
  //     const rule = userRule.rules[elementName]
  //     return typeof rule === 'function' ? rule(element as SupportedInputsType) : rule
  //   }
  // }

  /* Check for site-specific rules first */
  if (siteRule && message && isSupportedInput(elem)) {
    const elementName = elem.id || elem.name
    const matchingRule = siteRule.rules.find((rule) => rule.match === elementName && rule.messageId === message.id)

    if (matchingRule) {
      return matchingRule.value
    }
  }

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
    return handleAutocompleteToken(elem)
  }

  /* Fallback to default generation logic */
  return handleDefaultInputs(type, elem)
}

const handleAutocompleteToken = (elem: HTMLInputElement) => {
  const config = configStore.getState()
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
      const firstName = faker.person.firstName()
      const lastName = faker.person.lastName()

      contentScriptStore.setState({ firstName, lastName })

      return faker.internet.email({
        firstName: contentScriptState.firstName || firstName,
        lastName: contentScriptState.lastName || lastName,
        provider: config.tempEmailProvider,
      })
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
      const firstName = faker.person.firstName()
      const lastName = faker.person.lastName()

      contentScriptStore.setState({ firstName, lastName })

      return faker.internet.email({
        firstName: contentScriptState.firstName || firstName,
        lastName: contentScriptState.lastName || lastName,
        provider: config.tempEmailProvider,
      })
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

const handleDefaultInputs = (type: HTMLInputTypeAttribute | 'contenteditable', elem: SupportedInputsType | Element) => {
  const config = configStore.getState()
  const contentScriptState = contentScriptStore.getState()

  switch (type) {
    case 'text': {
      if (elem instanceof HTMLInputElement) {
        switch (true) {
          case matchElement(elem, 'full name') ||
            matchElement(elem, 'first name') ||
            matchElement(elem, 'given name') ||
            matchElement(elem, 'last name') ||
            matchElement(elem, 'surname') ||
            matchElement(elem, 'family name') ||
            matchElement(elem, 'name'): {
            if (matchElement(elem, 'full name')) {
              const fullName = faker.person.fullName()
              contentScriptStore.setState({ firstName: fullName })
              return elem.maxLength > 0 ? fullName.slice(0, elem.maxLength) : fullName
            } else if (matchElement(elem, 'first name') || matchElement(elem, 'given name')) {
              const firstName = faker.person.firstName()
              contentScriptStore.setState({ firstName })
              return elem.maxLength > 0 ? firstName.slice(0, elem.maxLength) : firstName
            } else if (
              matchElement(elem, 'last name') ||
              matchElement(elem, 'surname') ||
              matchElement(elem, 'family name')
            ) {
              const lastName = faker.person.lastName()
              contentScriptStore.setState({ lastName })
              return elem.maxLength > 0 ? lastName.slice(0, elem.maxLength) : lastName
            }
            break
          }
          case matchElement(elem, 'email') || matchElement(elem, 'e-mail') || matchElement(elem, 'mail'): {
            const firstName = faker.person.firstName()
            const lastName = faker.person.lastName()

            contentScriptStore.setState({ firstName, lastName })

            return faker.internet.email({
              firstName: contentScriptState.firstName || firstName,
              lastName: contentScriptState.lastName || lastName,
              provider: config.tempEmailProvider,
            })
          }
          case matchElement(elem, 'phone') ||
            matchElement(elem, 'tel') ||
            matchElement(elem, 'mobile') ||
            matchElement(elem, 'cell'): {
            return faker.phone.number()
          }
          case matchElement(elem, 'date'): {
            const isDateOfBirth = matchElement(elem, 'birth') || matchElement(elem, 'dob')
            let date: Date

            if (isDateOfBirth) {
              // Generate a date for someone over 18 years old
              date = faker.date.birthdate()
            } else {
              date = faker.date.recent()
            }

            // Function to format date based on placeholder or default to ISO
            const formatDate = (date: Date, format?: string) => {
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

                if (format.includes('yyyy')) {
                  formattedDate = formattedDate.replace('yyyy', year)
                } else {
                  formattedDate = formattedDate.replace('yy', shortYear)
                }

                return formattedDate
              } else {
                return date.toISOString()?.split('T')[0]
              }
            }

            return formatDate(date, elem.placeholder?.toLowerCase())
          }
          case matchElement(elem, 'address') ||
            matchElement(elem, 'street') ||
            matchElement(elem, 'city') ||
            matchElement(elem, 'state') ||
            matchElement(elem, 'zip') ||
            matchElement(elem, 'postal') ||
            matchElement(elem, 'suburb') ||
            matchElement(elem, 'district'): {
            if (matchElement(elem, 'street')) {
              return faker.location.streetAddress()
            } else if (matchElement(elem, 'city')) {
              return faker.location.city()
            } else if (matchElement(elem, 'suburb')) {
              // Using a combination of city and state for a more suburb-like result
              return `${faker.location.city()} ${faker.location.state({ abbreviated: true })}`
            } else if (matchElement(elem, 'state')) {
              return faker.location.state()
            } else if (matchElement(elem, 'zip') || matchElement(elem, 'postal') || matchElement(elem, 'postalCode')) {
              return faker.location.zipCode()
            } else if (matchElement(elem, 'district')) {
              return faker.location.county()
            } else {
              return faker.location.streetAddress()
            }
          }
          case matchElement(elem, 'confirm password') ||
            matchElement(elem, 'reenter password') ||
            matchElement(elem, 'reenter') ||
            matchElement(elem, 'confirm reenter') ||
            matchElement(elem, 'reenter PIN') ||
            matchElement(elem, 're-enter') ||
            matchElement(elem, 'confirm re-enter') ||
            matchElement(elem, 're-enter PIN') ||
            matchElement(elem, 'confirm'): {
            return handlePasswordGeneration(elem, true)
          }
          case matchElement(elem, 'company') || matchElement(elem, 'organization'): {
            return faker.company.name()
          }
          case matchElement(elem, 'job title') || matchElement(elem, 'job'): {
            return faker.person.jobTitle()
          }
          case matchElement(elem, 'department'): {
            return faker.commerce.department()
          }
          case matchElement(elem, 'cardnumber'): {
            return faker.finance.creditCardNumber({
              issuer: 'visa',
            })
          }
          case matchElement(elem, 'cardExpiry'): {
            const futureDate = faker.date.future()
            const month = (futureDate.getMonth() + 1).toString().padStart(2, '0')
            const year = futureDate.getFullYear().toString().slice(-2)
            return `${month}/${year}`
          }
          case matchElement(elem, 'cvv') || matchElement(elem, 'cvc'): {
            return faker.finance.creditCardCVV()
          }
          case matchElement(elem, 'cardtype'): {
            return faker.finance.creditCardIssuer()
          }
          case matchElement(elem, 'Day'): {
            if (elem instanceof HTMLInputElement && elem.maxLength === 2) {
              return faker.date.birthdate().getDate().toString().padStart(2, '0')
            } else {
              return faker.date.birthdate().getDate().toString()
            }
          }
          default: {
            return elem.maxLength > 0 ? faker.lorem.word().slice(0, elem.maxLength) : faker.lorem.word()
          }
        }
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
      const firstName = faker.person.firstName()
      const lastName = faker.person.lastName()

      contentScriptStore.setState({ firstName, lastName })

      return faker.internet.email({
        firstName: contentScriptState.firstName || firstName,
        lastName: contentScriptState.lastName || lastName,
        provider: config.tempEmailProvider,
      })
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
  const config = configStore.getState()
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
