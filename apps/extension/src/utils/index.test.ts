import { describe, expect, it } from 'vitest'

import { cn, isContentEditable, isSupportedInput } from '.'

describe('cn', () => {
  it('merges class names and resolves tailwind conflicts', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })
})

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
})
