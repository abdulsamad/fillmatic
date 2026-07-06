import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { usePopupStore } from '@/store/popup'

const baseTab = { id: 1, url: 'https://example.com' } as chrome.tabs.Tab

beforeEach(() => {
  usePopupStore.setState({ isAutofilling: false, isDisabled: false, currentTab: baseTab, forms: [], commands: {} as never })
  vi.mocked(chrome.tabs.sendMessage).mockReset().mockResolvedValue(undefined)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('fillData', () => {
  it('sends INIT_AUTOFILL_ALL for the default fillType', async () => {
    await usePopupStore.getState().fillData({ fillType: 'all' })

    expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(
      baseTab.id,
      expect.objectContaining({ type: 'INIT_AUTOFILL_ALL' }),
    )
    expect(usePopupStore.getState().isAutofilling).toBe(false)
  })

  it('sends INIT_AUTOFILL_FORM with the given form for fillType "single"', async () => {
    const form = { id: 'form-1' } as never

    await usePopupStore.getState().fillData({ fillType: 'single', form })

    expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(
      baseTab.id,
      expect.objectContaining({ type: 'INIT_AUTOFILL_FORM', form }),
    )
  })

  it('sends an ACTION_AUTOFILL_<messageId> message for fillType "site"', async () => {
    await usePopupStore.getState().fillData({ fillType: 'site', messageId: 'my-action' })

    expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(
      baseTab.id,
      expect.objectContaining({ type: 'ACTION_AUTOFILL_my-action' }),
    )
  })

  it('leaves isAutofilling true and sends nothing when currentTab has no id', async () => {
    usePopupStore.setState({ currentTab: { id: undefined } as never })

    await usePopupStore.getState().fillData({ fillType: 'all' })

    expect(chrome.tabs.sendMessage).not.toHaveBeenCalled()
    expect(usePopupStore.getState().isAutofilling).toBe(true)
  })

  it('resets isAutofilling and logs when chrome.tabs.sendMessage rejects', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(chrome.tabs.sendMessage).mockReset().mockRejectedValue(new Error('boom'))

    await usePopupStore.getState().fillData({ fillType: 'all' })

    expect(errorSpy).toHaveBeenCalled()
    expect(usePopupStore.getState().isAutofilling).toBe(false)
  })
})
