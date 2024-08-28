import { HTMLInputTypeAttribute } from 'react'
import { faker } from '@faker-js/faker'

import { log, handleFileInput, typeWithEffect } from '@/utils'

// Autofill a single element based on its type
export async function autofillElement(element: HTMLElement) {
  const type = getElementType(element)
  log(`Autofilling ${type} element: ${element}`)

  if (type === 'file') {
    await handleFileInput(element as HTMLInputElement)
  } else {
    const value = generateValue(type, element)
    log('Generated value: ' + value)

    if (type === 'checkbox' || type === 'radio') {
      ;(element as HTMLInputElement).checked = value as boolean
      log(`${type} set to: ${value}`)
    } else if (type === 'color') {
      ;(element as HTMLInputElement).value = value as string
      log(`Color set to: ${value}`)
    } else if (type !== 'button' && type !== 'submit' && type !== 'reset') {
      try {
        await typeWithEffect(value as string, (val) => {
          if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
            element.value = val
          } else if (element instanceof HTMLSelectElement) {
            const option = Array.from(element.options).find(
              (opt) => opt.value === val || opt.text === val,
            )
            if (option) {
              element.value = option.value
            }
          }
        })
        log('Finished typing effect')
      } catch (error) {
        log(`Error during type effect: ${error}`)
      }
    }
  }
}

function getElementType(element: HTMLElement): string {
  if (element instanceof HTMLInputElement) {
    return element.type
  } else if (element instanceof HTMLSelectElement) {
    return 'select'
  } else if (element instanceof HTMLTextAreaElement) {
    return 'textarea'
  }
  return ''
}

// Generate appropriate value based on input type
function generateValue(type: HTMLInputTypeAttribute, element: HTMLElement): string | boolean {
  switch (type) {
    case 'text':
    case 'search':
      return faker.lorem.word()
    case 'password':
      return faker.internet.password()
    case 'email':
      return faker.internet.email()
    case 'number':
      return faker.number.int({ min: 1, max: 100 }).toString()
    case 'url':
      return faker.internet.url()
    case 'tel':
      return faker.phone.number()
    case 'date':
      return faker.date.recent().toISOString().split('T')[0]
    case 'time':
      return faker.date.recent().toTimeString().split(' ')[0]
    case 'datetime-local':
      return faker.date.recent().toISOString().slice(0, -1)
    case 'month':
      return faker.date.recent().toISOString().slice(0, 7)
    case 'week':
      const d = faker.date.recent()
      const onejan = new Date(d.getFullYear(), 0, 1)
      const weekNum = Math.ceil(
        ((d.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7,
      )
      return `${d.getFullYear()}-W${weekNum.toString().padStart(2, '0')}`
    case 'textarea':
      return faker.lorem.paragraph()
    case 'select':
      if (element instanceof HTMLSelectElement) {
        const options = Array.from(element.options)
        return faker.helpers.arrayElement(options).text
      }
      return ''
    case 'checkbox':
    case 'radio':
      return faker.datatype.boolean()
    case 'color':
      return faker.color.rgb({ format: 'hex', prefix: '#' })
    case 'range':
      return faker.number.int({ min: 1, max: 100 }).toString()
    default:
      return ''
  }
}
