import { afterEach, describe, expect, it } from 'vitest'

import {
  gatherVisibleInputsInOrder,
  gatherWidgetElements,
  isElementVisible,
  isInViewport,
  queryDeepAll,
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

  it('finds inputs inside open shadow roots', () => {
    const host = document.createElement('div')
    document.body.appendChild(host)
    const shadow = host.attachShadow({ mode: 'open' })

    const input = document.createElement('input')
    makeVisible(input)
    shadow.appendChild(input)

    expect(gatherVisibleInputsInOrder()).toContain(input)
  })
})

describe('queryDeepAll', () => {
  it('matches elements in the light DOM and in nested open shadow roots', () => {
    const light = document.createElement('button')
    light.setAttribute('role', 'switch')
    document.body.appendChild(light)

    const host = document.createElement('div')
    document.body.appendChild(host)
    const shadow = host.attachShadow({ mode: 'open' })

    const innerHost = document.createElement('div')
    shadow.appendChild(innerHost)
    const innerShadow = innerHost.attachShadow({ mode: 'open' })

    const deep = document.createElement('button')
    deep.setAttribute('role', 'switch')
    innerShadow.appendChild(deep)

    const results = queryDeepAll(document, '[role="switch"]')
    expect(results).toContain(light)
    expect(results).toContain(deep)
  })
})

describe('gatherWidgetElements', () => {
  it('collects visible ARIA widgets', () => {
    const combobox = document.createElement('button')
    combobox.setAttribute('role', 'combobox')
    makeVisible(combobox)

    const toggle = document.createElement('div')
    toggle.setAttribute('role', 'switch')
    makeVisible(toggle)

    document.body.append(combobox, toggle)

    expect(gatherWidgetElements()).toEqual([combobox, toggle])
  })

  it('leaves native inputs carrying widget roles to the native path', () => {
    const input = document.createElement('input')
    input.setAttribute('role', 'combobox')
    makeVisible(input)
    document.body.appendChild(input)

    expect(gatherWidgetElements()).toEqual([])
  })

  it('skips widgets wrapping a visible native input, keeps widgets syncing to a hidden one', () => {
    const wrappingVisible = document.createElement('div')
    wrappingVisible.setAttribute('role', 'combobox')
    makeVisible(wrappingVisible)
    const visibleInput = document.createElement('input')
    makeVisible(visibleInput)
    wrappingVisible.appendChild(visibleInput)

    const wrappingHidden = document.createElement('div')
    wrappingHidden.setAttribute('role', 'combobox')
    makeVisible(wrappingHidden)
    const hiddenInput = document.createElement('input')
    hiddenInput.type = 'hidden'
    wrappingHidden.appendChild(hiddenInput)

    document.body.append(wrappingVisible, wrappingHidden)

    expect(gatherWidgetElements()).toEqual([wrappingHidden])
  })

  it('skips disabled widgets and elements nested inside an already-collected widget', () => {
    const disabled = document.createElement('button')
    disabled.setAttribute('role', 'combobox')
    disabled.setAttribute('aria-disabled', 'true')
    makeVisible(disabled)

    const group = document.createElement('div')
    group.setAttribute('role', 'radiogroup')
    makeVisible(group)
    const nested = document.createElement('div')
    nested.setAttribute('role', 'switch')
    makeVisible(nested)
    group.appendChild(nested)

    document.body.append(disabled, group)

    expect(gatherWidgetElements()).toEqual([group])
  })

  it('scopes to the given root element', () => {
    const inside = document.createElement('button')
    inside.setAttribute('role', 'switch')
    makeVisible(inside)
    const outside = document.createElement('button')
    outside.setAttribute('role', 'switch')
    makeVisible(outside)

    const root = document.createElement('div')
    root.appendChild(inside)
    document.body.append(root, outside)

    expect(gatherWidgetElements(root)).toEqual([inside])
  })
})
