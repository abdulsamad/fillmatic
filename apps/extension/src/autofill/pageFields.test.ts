import { afterEach, describe, expect, it } from 'vitest'

import { buildPageFields } from '@/autofill/pageFields'

const makeVisible = (elem: HTMLElement) => {
  Object.defineProperty(elem, 'offsetWidth', { value: 100, configurable: true })
  Object.defineProperty(elem, 'offsetHeight', { value: 20, configurable: true })
  elem.getClientRects = () => [{}] as unknown as DOMRectList
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('buildPageFields', () => {
  it('describes native inputs, widgets and contenteditable hosts with parallel element refs', () => {
    const input = document.createElement('input')
    input.type = 'email'
    input.id = 'user_email'
    makeVisible(input)

    const widget = document.createElement('button')
    widget.setAttribute('role', 'combobox')
    widget.setAttribute('aria-label', 'Country')
    makeVisible(widget)

    const editable = document.createElement('div')
    editable.setAttribute('contenteditable', 'true')
    makeVisible(editable)

    document.body.append(input, widget, editable)

    const { fields, elements } = buildPageFields()

    expect(fields).toHaveLength(3)
    expect(elements).toEqual([input, widget, editable])
    expect(fields.map((f) => f.ref)).toEqual([0, 1, 2])
    expect(fields.map((f) => f.kind)).toEqual(['input:email', 'widget:option-picker', 'contenteditable'])
  })

  it('suggests the most stable match attribute available', () => {
    const withId = document.createElement('input')
    withId.id = 'email'
    withId.name = 'contact[email]'
    makeVisible(withId)

    const withPlaceholder = document.createElement('input')
    withPlaceholder.placeholder = 'Your city'
    makeVisible(withPlaceholder)

    document.body.append(withId, withPlaceholder)

    const { fields } = buildPageFields()

    expect(fields[0]).toMatchObject({ attribute: 'id', match: 'email' })
    expect(fields[1]).toMatchObject({ attribute: 'placeholder', match: 'Your city' })
  })

  it('suggests value types from the input type and from label keywords', () => {
    const email = document.createElement('input')
    email.type = 'email'
    makeVisible(email)

    const phone = document.createElement('input')
    phone.placeholder = 'Mobile number'
    makeVisible(phone)

    const name = document.createElement('input')
    name.setAttribute('aria-label', 'Full name')
    makeVisible(name)

    const plain = document.createElement('input')
    makeVisible(plain)

    document.body.append(email, phone, name, plain)

    const { fields } = buildPageFields()

    expect(fields.map((f) => f.suggested.valueType)).toEqual(['email', 'phone', 'fullName', 'string'])
    expect(fields.every((f) => f.suggested.valueStrategy === 'random')).toBe(true)
  })

  it('skips unfillable input types and scopes to the root element', () => {
    const submit = document.createElement('input')
    submit.type = 'submit'
    makeVisible(submit)

    const inside = document.createElement('input')
    makeVisible(inside)
    const outside = document.createElement('input')
    makeVisible(outside)

    const root = document.createElement('form')
    root.append(submit, inside)
    document.body.append(root, outside)

    const { fields, elements } = buildPageFields(root)

    expect(elements).toEqual([inside])
    expect(fields).toHaveLength(1)
  })
})
