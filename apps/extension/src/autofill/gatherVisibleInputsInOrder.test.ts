import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { isInViewport } from './gatherVisibleInputsInOrder'

describe('isInViewport', () => {
  let elem: HTMLElement

  beforeEach(() => {
    elem = document.createElement('div')
  })

  afterEach(() => {
    elem.getBoundingClientRect = HTMLElement.prototype.getBoundingClientRect
  })

  const stubRect = (rect: Partial<DOMRect>) => {
    elem.getBoundingClientRect = () => ({
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      width: 0,
      height: 0,
      x: 0,
      y: 0,
      toJSON: () => ({}),
      ...rect,
    })
  }

  it('is true for an element comfortably inside the viewport', () => {
    stubRect({ top: 100, bottom: 200, left: 10, right: 100 })
    expect(isInViewport(elem)).toBe(true)
  })

  it('is true for a sliver overlap with no margin', () => {
    // Only the top 2px of the element peek above the bottom edge of the viewport.
    stubRect({ top: window.innerHeight - 2, bottom: window.innerHeight + 50, left: 10, right: 100 })
    expect(isInViewport(elem)).toBe(true)
  })

  it('treats the same sliver overlap as not-in-view once a safe margin is applied', () => {
    stubRect({ top: window.innerHeight - 2, bottom: window.innerHeight + 50, left: 10, right: 100 })
    expect(isInViewport(elem, 24)).toBe(false)
  })

  it('is still true with a margin when the element sits well clear of every edge', () => {
    stubRect({ top: 50, bottom: 150, left: 10, right: 100 })
    expect(isInViewport(elem, 24)).toBe(true)
  })

  it('is false when the element is entirely outside the viewport', () => {
    stubRect({ top: window.innerHeight + 100, bottom: window.innerHeight + 200, left: 10, right: 100 })
    expect(isInViewport(elem)).toBe(false)
  })
})
