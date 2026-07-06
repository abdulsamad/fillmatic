import { afterEach, describe, expect, it } from 'vitest'

import {
  gatherVisibleInputsInOrder,
  isElementVisible,
  isInViewport,
} from '@/autofill/gatherVisibleInputsInOrder'

const makeVisible = (elem: HTMLElement) => {
  Object.defineProperty(elem, 'offsetWidth', { value: 100, configurable: true })
  Object.defineProperty(elem, 'offsetHeight', { value: 20, configurable: true })
  elem.getClientRects = () => [{}] as unknown as DOMRectList
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('isElementVisible', () => {
  it('returns false for a non-HTMLElement', () => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    expect(isElementVisible(svg as unknown as Element)).toBe(false)
  })

  it('returns false when offsetWidth/offsetHeight/getClientRects are all zero (jsdom default, no layout)', () => {
    const input = document.createElement('input')
    document.body.appendChild(input)

    expect(isElementVisible(input)).toBe(false)
  })

  it('returns false when display is none, even if dimensions are stubbed visible', () => {
    const input = document.createElement('input')
    input.style.display = 'none'
    document.body.appendChild(input)
    makeVisible(input)

    expect(isElementVisible(input)).toBe(false)
  })

  it('returns false when visibility is hidden', () => {
    const input = document.createElement('input')
    input.style.visibility = 'hidden'
    document.body.appendChild(input)
    makeVisible(input)

    expect(isElementVisible(input)).toBe(false)
  })

  it('returns false when opacity is 0', () => {
    const input = document.createElement('input')
    input.style.opacity = '0'
    document.body.appendChild(input)
    makeVisible(input)

    expect(isElementVisible(input)).toBe(false)
  })

  it('returns true when the element has non-zero dimensions and no hiding styles', () => {
    const input = document.createElement('input')
    document.body.appendChild(input)
    makeVisible(input)

    expect(isElementVisible(input)).toBe(true)
  })
})

describe('isInViewport', () => {
  it('returns true when the element rect overlaps the viewport', () => {
    const input = document.createElement('input')
    input.getBoundingClientRect = () => ({ top: 10, bottom: 30, left: 10, right: 30 }) as DOMRect

    expect(isInViewport(input)).toBe(true)
  })

  it('returns false when the element is entirely above the viewport', () => {
    const input = document.createElement('input')
    input.getBoundingClientRect = () => ({ top: -100, bottom: -50, left: 10, right: 30 }) as DOMRect

    expect(isInViewport(input)).toBe(false)
  })

  it('returns false when the element is entirely below the viewport', () => {
    const input = document.createElement('input')
    const viewHeight = window.innerHeight || document.documentElement.clientHeight
    input.getBoundingClientRect = () => ({ top: viewHeight + 10, bottom: viewHeight + 50, left: 10, right: 30 }) as DOMRect

    expect(isInViewport(input)).toBe(false)
  })
})

describe('gatherVisibleInputsInOrder', () => {
  it('excludes disabled and readonly inputs via the selector, and hidden inputs via visibility filtering', () => {
    const container = document.createElement('div')

    const disabled = document.createElement('input')
    disabled.disabled = true
    makeVisible(disabled)

    const readonly = document.createElement('input')
    readonly.readOnly = true
    makeVisible(readonly)

    const hidden = document.createElement('input')
    // left un-stubbed -> zero dimensions -> invisible

    const visible = document.createElement('input')
    makeVisible(visible)

    container.append(disabled, readonly, hidden, visible)
    document.body.appendChild(container)

    expect(gatherVisibleInputsInOrder(container)).toEqual([visible])
  })

  it('falls back to searching the whole document when no rootElement is given', () => {
    const visible = document.createElement('textarea')
    makeVisible(visible)
    document.body.appendChild(visible)

    expect(gatherVisibleInputsInOrder()).toContain(visible)
  })
})
