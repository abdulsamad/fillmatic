import { HTMLInputTypeAttribute } from 'react'
import { faker } from '@faker-js/faker'

import { log, typeWithEffect, clientLog } from '@/utils'
import { handleFileInput } from '@/autofill'
import { DEFAULT_CONFIG } from '@/consts'
import { Inputs } from '@/types'

const getElementType = (element: HTMLElement): HTMLInputTypeAttribute | 'select' | 'textarea' => {
  switch (true) {
    case element instanceof HTMLInputElement:
      return element.type
    case element instanceof HTMLSelectElement:
      return 'select'
    case element instanceof HTMLTextAreaElement:
      return 'textarea'
    default:
      return ''
  }
}

// Generate appropriate value based on input type
const generateValue = (type: HTMLInputTypeAttribute, element: Inputs): string | boolean => {
  switch (type) {
    case 'text':
    case 'search':
      if (element instanceof HTMLInputElement && element.maxLength > 0) {
        return faker.lorem.word().slice(0, element.maxLength)
      }
      return faker.lorem.word()
    case 'password':
      const password = faker.internet.password()
      clientLog('Generated password: ', password)
      return password
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
      return faker.phone.number('501-###-###')
    case 'date':
      return faker.date.recent().toISOString().split('T')[0]
    case 'time':
      return faker.date.recent().toTimeString().split(' ')[0].slice(0, 5)
    case 'datetime-local':
      return faker.date.recent().toISOString().slice(0, -1)
    case 'month':
      return faker.date.recent().toISOString().slice(0, 7)
    case 'week':
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
      const isSpecificCheckbox = (element: HTMLInputElement, regex: RegExp): boolean => {
        const label = element.labels
          ? Array.from(element.labels)
              .map((label) => label.textContent)
              .join(' ')
          : ''
        return regex.test(label) || regex.test(element.name)
      }

      if (element instanceof HTMLInputElement) {
        const termsRegex = /agree|terms|conditions/i
        if (isSpecificCheckbox(element, termsRegex)) {
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

// Autofill a single element based on its type
export const autofillElement = async (elem: Inputs, config = DEFAULT_CONFIG) => {
  const type = getElementType(elem)

  if (type === 'file') {
    await handleFileInput(elem as HTMLInputElement)
    return
  }

  // Types that already have a value
  const typesToIgnore = ['radio', 'checkbox', 'color', 'range', 'select']

  if (!config.forceAutofill && elem.value && !typesToIgnore.includes(type)) {
    log(`Skipping autofill for ${type} as it already has a value`)
    return
  }

  const value = generateValue(type, elem)

  switch (type) {
    case 'checkbox':
    case 'radio':
      if (elem instanceof HTMLInputElement) {
        elem.checked = value as boolean
        log(`${type} set to: ${value}`)
      }
      break

    case 'color':
      elem.value = value as string
      log(`Color set to: ${value}`)
      break

    default:
      if (type !== 'button' && type !== 'submit' && type !== 'reset') {
        try {
          const elemsWithoutTypeEffect = ['week', 'month', 'date', 'time', 'datetime-local']

          await typeWithEffect(
            value as string,
            (val) => {
              if (elem instanceof HTMLInputElement || elem instanceof HTMLTextAreaElement) {
                elem.value = val
              } else if (elem instanceof HTMLSelectElement) {
                const option = Array.from(elem.options).find((opt) => opt.value === val || opt.text === val)
                if (option) {
                  elem.value = option.value
                }
              }
            },
            !elemsWithoutTypeEffect.includes(type),
          )
        } catch (error) {
          log(`Error during type effect: ${error}`)
        }
      }
  }
}
