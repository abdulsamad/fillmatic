import { afterEach, describe, expect, it, vi } from 'vitest'

const { gatherVisibleInputsInOrder, fillElement } = vi.hoisted(() => ({
  gatherVisibleInputsInOrder: vi.fn(),
  fillElement: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('.', () => ({ gatherVisibleInputsInOrder, fillElement }))

import { useContentScriptStore as contentScriptStore } from '@/store/content-script'

import { initiateAutofill } from '@/autofill/initAutofill'

afterEach(() => {
  vi.clearAllMocks()
  document.body.innerHTML = ''
})

describe('initiateAutofill', () => {
  it('resets the per-run content-script state before filling', async () => {
    contentScriptStore.setState({ firstName: 'Stale', lastName: 'Name', lastGeneratedPassword: 'old-pass' })
    gatherVisibleInputsInOrder.mockReturnValue([])

    await initiateAutofill({ rootElement: null })

    const state = contentScriptStore.getState()
    expect(state.firstName).toBeUndefined()
    expect(state.lastName).toBeUndefined()
    expect(state.lastGeneratedPassword).toBe('')
  })

  it('fills each initially-gathered input sequentially', async () => {
    const inputA = document.createElement('input')
    const inputB = document.createElement('input')
    gatherVisibleInputsInOrder.mockReturnValue([inputA, inputB])

    await initiateAutofill({ rootElement: null })

    expect(fillElement).toHaveBeenCalledWith({ elem: inputA })
    expect(fillElement).toHaveBeenCalledWith({ elem: inputB })
  })

  it('does a second fill pass for inputs that mount after the first pass', async () => {
    const initial = document.createElement('input')
    const lateMounted = document.createElement('input')
    gatherVisibleInputsInOrder
      .mockReturnValueOnce([initial]) // first gather
      .mockReturnValueOnce([initial, lateMounted]) // re-gather after first fill pass

    await initiateAutofill({ rootElement: null })

    expect(fillElement).toHaveBeenCalledWith({ elem: initial })
    expect(fillElement).toHaveBeenCalledWith({ elem: lateMounted })
    expect(fillElement).toHaveBeenCalledTimes(2)
  })

  it('skips the second fill pass when no new inputs mounted', async () => {
    const initial = document.createElement('input')
    gatherVisibleInputsInOrder.mockReturnValue([initial])

    await initiateAutofill({ rootElement: null })

    expect(fillElement).toHaveBeenCalledTimes(1)
  })

  it('also fills contenteditable elements found on the page', async () => {
    gatherVisibleInputsInOrder.mockReturnValue([])
    const editable = document.createElement('div')
    editable.setAttribute('contenteditable', 'true')
    document.body.appendChild(editable)

    await initiateAutofill({ rootElement: null })

    expect(fillElement).toHaveBeenCalledWith({ elem: editable })
  })
})
