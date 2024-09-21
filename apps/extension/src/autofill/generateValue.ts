import { HTMLInputTypeAttribute } from 'react'
import { faker } from '@faker-js/faker'

import { clientLog, matchElement } from '@/utils'
import { Inputs } from '@/types'
import { useConfigStore as configStore } from '@/store/config'

export const generateValue = async (type: HTMLInputTypeAttribute, element: Inputs): Promise<string | boolean> => {
  switch (type) {
    case 'text':
      if (element instanceof HTMLInputElement) {
        switch (true) {
          case matchElement(element, 'full name') ||
            matchElement(element, 'first name') ||
            matchElement(element, 'last name') ||
            matchElement(element, 'name'):
            if (matchElement(element, 'full name')) {
              const fullName = faker.person.fullName()
              return element.maxLength > 0 ? fullName.slice(0, element.maxLength) : fullName
            } else if (matchElement(element, 'first name')) {
              const firstName = faker.person.firstName()
              return element.maxLength > 0 ? firstName.slice(0, element.maxLength) : firstName
            } else if (matchElement(element, 'last name')) {
              const lastName = faker.person.lastName()
              return element.maxLength > 0 ? lastName.slice(0, element.maxLength) : lastName
            }
            break
          case matchElement(element, 'email') || matchElement(element, 'e-mail') || matchElement(element, 'mail'):
            return faker.internet.email()
          case matchElement(element, 'phone') ||
            matchElement(element, 'tel') ||
            matchElement(element, 'mobile') ||
            matchElement(element, 'cell'):
            return faker.phone.number()
          case matchElement(element, 'date'):
            const isDateOfBirth = matchElement(element, 'birth') || matchElement(element, 'dob')
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
                return date.toISOString().split('T')[0]
              }
            }

            return formatDate(date, element.placeholder?.toLowerCase())

          case matchElement(element, 'address') ||
            matchElement(element, 'street') ||
            matchElement(element, 'city') ||
            matchElement(element, 'state') ||
            matchElement(element, 'zip') ||
            matchElement(element, 'postal'):
            if (matchElement(element, 'street')) {
              return faker.location.streetAddress()
            } else if (matchElement(element, 'city')) {
              return faker.location.city()
            } else if (matchElement(element, 'state')) {
              return faker.location.state()
            } else if (matchElement(element, 'zip') || matchElement(element, 'postal')) {
              return faker.location.zipCode()
            } else {
              return faker.location.streetAddress()
            }
          case matchElement(element, 'company') || matchElement(element, 'organization'):
            return faker.company.name()
          case matchElement(element, 'job title') || matchElement(element, 'job'):
            return faker.person.jobTitle()
          case matchElement(element, 'department'):
            return faker.commerce.department()
          case matchElement(element, 'cardnumber'):
            return faker.finance.creditCardNumber({
              issuer: 'visa',
            })
          case matchElement(element, 'cardExpiry'):
            const futureDate = faker.date.future()
            const month = (futureDate.getMonth() + 1).toString().padStart(2, '0')
            const year = futureDate.getFullYear().toString().slice(-2)
            return `${month}/${year}`
          case matchElement(element, 'cvv') || matchElement(element, 'cvc'):
            return faker.finance.creditCardCVV()
          case matchElement(element, 'cardtype'):
            return faker.finance.creditCardIssuer()
          case matchElement(element, 'confirm password') ||
            matchElement(element, 'reenter password') ||
            matchElement(element, 'reenter') ||
            matchElement(element, 'confirm reenter') ||
            matchElement(element, 'reenter PIN') ||
            matchElement(element, 're-enter') ||
            matchElement(element, 'confirm re-enter') ||
            matchElement(element, 're-enter PIN') ||
            matchElement(element, 'confirm'):
            return handlePasswordGeneration(element, true)
          default:
            return element.maxLength > 0 ? faker.lorem.word().slice(0, element.maxLength) : faker.lorem.word()
        }
      }
      return faker.lorem.word()
    case 'search':
      return faker.lorem.word()
    case 'password':
      if (element instanceof HTMLInputElement) {
        if (matchElement(element, 'confirm') || matchElement(element, 'reenter') || matchElement(element, 're-enter')) {
          return handlePasswordGeneration(element, true)
        }
        return handlePasswordGeneration(element)
      }
      return faker.internet.password({ length: 8 })
    case 'email':
      return faker.internet.email()
    case 'number':
      if (element instanceof HTMLInputElement) {
        const min = element.min ? parseInt(element.min, 10) : 1
        const max = element.max ? parseInt(element.max, 10) : 100
        return faker.number.int({ min, max }).toString()
      }
      return faker.number.int({ min: 1, max: 100 }).toString()
    case 'url':
      return faker.internet.url()
    case 'tel':
      return faker.helpers.fromRegExp('501-[0-9]{3}-[0-9]{3}')
    case 'date':
      if (element instanceof HTMLInputElement) {
        const min = element.min ? new Date(element.min) : new Date('1970-01-01')
        const max = element.max ? new Date(element.max) : new Date()
        return faker.date.between({ from: min, to: max }).toISOString().split('T')[0]
      }
      return faker.date.recent().toISOString().split('T')[0]
    case 'time':
      if (element instanceof HTMLInputElement) {
        const min = element.min ? element.min : '00:00'
        const max = element.max ? element.max : '23:59'
        const [minHour, minMinute] = min.split(':').map(Number)
        const [maxHour, maxMinute] = max.split(':').map(Number)
        const hour = faker.number.int({ min: minHour, max: maxHour })
        const minute =
          hour === maxHour ? faker.number.int({ min: 0, max: maxMinute }) : faker.number.int({ min: 0, max: 59 })
        return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      }
      return faker.date.recent().toTimeString().split(' ')[0].slice(0, 5)
    case 'datetime-local':
      if (element instanceof HTMLInputElement) {
        const min = element.min ? new Date(element.min) : new Date('1970-01-01T00:00')
        const max = element.max ? new Date(element.max) : new Date()
        const date = faker.date.between({ from: min, to: max })
        return date.toISOString().slice(0, 16).replace('T', ' ')
      }
      return faker.date.recent().toISOString().slice(0, 16).replace('T', ' ')
    case 'month':
      if (element instanceof HTMLInputElement) {
        const min = element.min ? new Date(element.min + '-01') : new Date('1970-01-01')
        const max = element.max ? new Date(element.max + '-01') : new Date()
        return faker.date.between({ from: min, to: max }).toISOString().slice(0, 7)
      }
      return faker.date.recent().toISOString().slice(0, 7)
    case 'week':
      if (element instanceof HTMLInputElement) {
        const min = element.min ? new Date(element.min.replace('W', '-')) : new Date('1970-01-01')
        const max = element.max ? new Date(element.max.replace('W', '-')) : new Date()
        const d = faker.date.between({ from: min, to: max })
        const onejan = new Date(d.getFullYear(), 0, 1)
        const weekNum = Math.ceil(((d.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7)
        return `${d.getFullYear()}-W${weekNum.toString().padStart(2, '0')}`
      }
      const d = faker.date.recent()
      const onejan = new Date(d.getFullYear(), 0, 1)
      const weekNum = Math.ceil(((d.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7)
      return `${d.getFullYear()}-W${weekNum.toString().padStart(2, '0')}`
    case 'textarea':
      if (element instanceof HTMLTextAreaElement && element.maxLength > 0) {
        return faker.lorem.paragraph().slice(0, element.maxLength)
      }
      return faker.lorem.paragraph()
    case 'select':
      if (element instanceof HTMLSelectElement) {
        const options = Array.from(element.options)
        return faker.helpers.arrayElement(options).value
      }
      return ''
    case 'checkbox':
      if (element instanceof HTMLInputElement) {
        const termsRegex = /agree|terms|conditions/i
        if (matchElement(element, termsRegex.source)) {
          return true
        }
        if (element.name) {
          const checkboxes = document.querySelectorAll(`input[name="${element.name}"][type="checkbox"]`)
          const randomCheckbox = faker.helpers.arrayElement(Array.from(checkboxes)) as HTMLInputElement
          return randomCheckbox === element
        }
      }
      return faker.datatype.boolean()
    case 'radio':
      if (element instanceof HTMLInputElement && element.name) {
        const radios = document.querySelectorAll(`input[name="${element.name}"][type="radio"]`)
        const randomRadio = faker.helpers.arrayElement(Array.from(radios)) as HTMLInputElement
        return randomRadio === element
      }
      return faker.datatype.boolean()
    case 'color':
      return faker.color.rgb({ format: 'hex', prefix: '#' })
    case 'range':
      if (element instanceof HTMLInputElement) {
        const min = element.min ? parseInt(element.min, 10) : 1
        const max = element.max ? parseInt(element.max, 10) : 100
        return faker.number.int({ min, max }).toString()
      }
      return ''
    default:
      return ''
  }
}

const handlePasswordGeneration = async (element: HTMLInputElement, reenter = false) => {
  let generatedPassword: string = ''
  const maxLength = element.maxLength > 0 ? element.maxLength : 8
  const minLength = element.minLength > 0 ? element.minLength : undefined
  const samePasswordEverytime = true

  if (reenter) {
    const { lastGeneratedPassword } = configStore.getState()

    if (lastGeneratedPassword) {
      generatedPassword = lastGeneratedPassword.slice(0, element.maxLength || lastGeneratedPassword.length)
    }
  } else if (matchElement(element, 'pin')) {
    const hardcodedPin = '1234'
    const pinLength = minLength || maxLength

    if (samePasswordEverytime && hardcodedPin.length <= maxLength) {
      generatedPassword = hardcodedPin.slice(0, pinLength)
    } else {
      generatedPassword = faker.number
        .int({ min: Math.pow(10, pinLength - 1), max: Math.pow(10, pinLength) - 1 })
        .toString()
    }

    clientLog('Generated PIN: ', generatedPassword)
    configStore.setState({ lastGeneratedPassword: generatedPassword })
  } else {
    const hardcodedPassword = 'Pass@123'
    const passwordLength = minLength || maxLength

    if (samePasswordEverytime && hardcodedPassword.length <= maxLength) {
      generatedPassword = hardcodedPassword.slice(0, passwordLength)
    } else {
      generatedPassword = faker.internet.password({
        length: passwordLength,
        pattern: element?.pattern ? new RegExp(element.pattern) : undefined,
      })
    }

    clientLog('Generated password: ', generatedPassword)
    configStore.setState({ lastGeneratedPassword: generatedPassword })
  }

  return generatedPassword
}
