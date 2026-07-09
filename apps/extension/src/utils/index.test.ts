import { describe, expect, it } from 'vitest'

import { invalidateMatchCache, isContentEditable, isSupportedElement, isSupportedInput, matchElement } from '.'

describe('isSupportedInput', () => {
  it('recognizes input, textarea and select elements', () => {
    expect(isSupportedInput(document.createElement('input'))).toBe(true)
    expect(isSupportedInput(document.createElement('textarea'))).toBe(true)
    expect(isSupportedInput(document.createElement('select'))).toBe(true)
    expect(isSupportedInput(document.createElement('div'))).toBe(false)
  })
})

describe('isContentEditable', () => {
  it('recognizes contentEditable elements that are not native inputs', () => {
    const div = document.createElement('div')
    div.contentEditable = 'true'
    expect(isContentEditable(div)).toBe(true)
    expect(isContentEditable(document.createElement('div'))).toBe(false)
  })

  it('does not treat a supported input as content-editable even if the attribute is set', () => {
    const input = document.createElement('input')
    input.contentEditable = 'true'
    expect(isContentEditable(input)).toBe(false)
  })

  it('recognizes the empty-attribute and plaintext-only forms', () => {
    const bare = document.createElement('div')
    bare.setAttribute('contenteditable', '')
    expect(isContentEditable(bare)).toBe(true)

    const plaintext = document.createElement('div')
    plaintext.setAttribute('contenteditable', 'plaintext-only')
    expect(isContentEditable(plaintext)).toBe(true)
  })

  it('rejects contenteditable="false"', () => {
    const div = document.createElement('div')
    div.setAttribute('contenteditable', 'false')
    expect(isContentEditable(div)).toBe(false)
  })
})

describe('isSupportedElement', () => {
  it('accepts native inputs and contentEditable elements, rejects plain elements', () => {
    expect(isSupportedElement(document.createElement('input'))).toBe(true)

    const div = document.createElement('div')
    div.contentEditable = 'true'
    expect(isSupportedElement(div)).toBe(true)

    expect(isSupportedElement(document.createElement('span'))).toBe(false)
  })
})

describe('matchElement', () => {
  it('matches a keyword found in the placeholder', () => {
    const input = document.createElement('input')
    input.placeholder = 'Enter your email address'
    expect(matchElement(input, 'email')).toBe(true)
    expect(matchElement(input, 'phone')).toBe(false)
  })

  it('matches on name, id and class attributes', () => {
    const byName = document.createElement('input')
    byName.name = 'first_name'
    expect(matchElement(byName, 'first name')).toBe(true)

    const byId = document.createElement('input')
    byId.id = 'user-city'
    expect(matchElement(byId, 'city')).toBe(true)

    const byClass = document.createElement('input')
    byClass.className = 'form-zip-code'
    expect(matchElement(byClass, 'zip')).toBe(true)
  })

  it('matches text from an associated <label>', () => {
    const container = document.createElement('div')
    const label = document.createElement('label')
    label.htmlFor = 'dob'
    label.textContent = 'Date of Birth'
    const input = document.createElement('input')
    input.id = 'dob'
    container.append(label, input)
    document.body.appendChild(container)

    expect(matchElement(input, 'birth')).toBe(true)

    document.body.removeChild(container)
  })

  it('matches aria-label and title attributes', () => {
    const byAria = document.createElement('input')
    byAria.setAttribute('aria-label', 'Postal Code')
    expect(matchElement(byAria, 'postal')).toBe(true)

    const byTitle = document.createElement('input')
    byTitle.setAttribute('title', 'Company Name')
    expect(matchElement(byTitle, 'company')).toBe(true)
  })

  it('only matches whole words, not substrings', () => {
    const input = document.createElement('input')
    input.placeholder = 'emailed receipts'
    // "email" should not match inside "emailed" due to word-boundary matching.
    expect(matchElement(input, 'email')).toBe(false)
  })

  it('is case-insensitive', () => {
    const input = document.createElement('input')
    input.placeholder = 'EMAIL ADDRESS'
    expect(matchElement(input, 'email')).toBe(true)
  })

  it('does not throw and returns false for an element with no identifying attributes', () => {
    const input = document.createElement('input')
    expect(matchElement(input, 'email')).toBe(false)
  })

  it('picks up attribute changes after invalidateMatchCache is called', () => {
    const input = document.createElement('input')
    input.placeholder = 'City'
    expect(matchElement(input, 'zip')).toBe(false)

    input.placeholder = 'Zip Code'
    // Cached search text from the first call is stale until the cache is invalidated.
    expect(matchElement(input, 'zip')).toBe(false)

    invalidateMatchCache()
    expect(matchElement(input, 'zip')).toBe(true)
  })
})
