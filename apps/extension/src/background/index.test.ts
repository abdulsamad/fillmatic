import { beforeEach, describe, expect, it, vi } from 'vitest'

type InstalledListener = (details: chrome.runtime.InstalledDetails) => Promise<void> | void
type CommandListener = (command: string, tab: chrome.tabs.Tab) => Promise<void> | void

const importBackground = () => import('@/background/index')

const getLastCall = <T>(fn: unknown): T => {
  const mockFn = fn as { mock: { calls: T[][] } }
  return mockFn.mock.calls.at(-1)![0]
}

// chrome.tabs.sendMessage is overloaded (callback vs. Promise-returning forms), which makes TS
// infer `void` for vi.mocked(...).mockResolvedValueOnce(...). Cast to the shape we actually use.
type AsyncMock<T> = { mockResolvedValueOnce: (value: T) => void }
const asAsyncMock = <T>(fn: unknown) => fn as AsyncMock<T>

beforeEach(() => {
  vi.resetModules()
  vi.clearAllMocks()
})

describe('background/index (load-time side effects)', () => {
  it('sets a DEV badge on load (current test env runs in dev mode)', async () => {
    await importBackground()

    expect(chrome.action.setBadgeText).toHaveBeenCalledWith({ text: 'DEV' })
    expect(chrome.action.setBadgeBackgroundColor).toHaveBeenCalledWith({ color: '#FF3B30' })
  })

  it('opens the demo tab only when the install reason is "install"', async () => {
    await importBackground()
    const listener = getLastCall<InstalledListener>(chrome.runtime.onInstalled.addListener)

    await listener({ reason: 'install' } as chrome.runtime.InstalledDetails)

    expect(chrome.tabs.create).toHaveBeenCalledWith({ url: 'https://fillmatic.pages.dev/demo/' })
  })

  it('does not open a tab for a non-install reason (e.g. update)', async () => {
    await importBackground()
    const listener = getLastCall<InstalledListener>(chrome.runtime.onInstalled.addListener)

    await listener({ reason: 'update' } as chrome.runtime.InstalledDetails)

    expect(chrome.tabs.create).not.toHaveBeenCalled()
  })
})

describe('background/index onCommand', () => {
  const getCommandListener = async () => {
    await importBackground()
    return getLastCall<CommandListener>(chrome.commands.onCommand.addListener)
  }

  it('ignores commands when there is no tab', async () => {
    const listener = await getCommandListener()

    await listener('AUTOFILL_ALL', undefined as unknown as chrome.tabs.Tab)

    expect(chrome.tabs.sendMessage).not.toHaveBeenCalled()
  })

  it('ignores commands when the tab has no id', async () => {
    const listener = await getCommandListener()

    await listener('AUTOFILL_ALL', {} as chrome.tabs.Tab)

    expect(chrome.tabs.sendMessage).not.toHaveBeenCalled()
  })

  it('sends INIT_AUTOFILL_ALL for the AUTOFILL_ALL command', async () => {
    const listener = await getCommandListener()

    await listener('AUTOFILL_ALL', { id: 1 } as chrome.tabs.Tab)

    expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(1, { type: 'INIT_AUTOFILL_ALL' })
  })

  it('sends INIT_AUTOFILL_FORM for the currently focused form on AUTOFILL_CURRENT_FORM', async () => {
    asAsyncMock<{ forms: unknown[] }>(chrome.tabs.sendMessage).mockResolvedValueOnce({
      forms: [{ focused: false }, { focused: true, id: 'form-2' }],
    })
    const listener = await getCommandListener()

    await listener('AUTOFILL_CURRENT_FORM', { id: 1 } as chrome.tabs.Tab)

    expect(chrome.tabs.sendMessage).toHaveBeenLastCalledWith(1, {
      type: 'INIT_AUTOFILL_FORM',
      form: { focused: true, id: 'form-2' },
    })
  })

  it('does not send a fill message when no form is focused on AUTOFILL_CURRENT_FORM', async () => {
    asAsyncMock<{ forms: unknown[] }>(chrome.tabs.sendMessage).mockResolvedValueOnce({ forms: [{ focused: false }] })
    const listener = await getCommandListener()

    await listener('AUTOFILL_CURRENT_FORM', { id: 1 } as chrome.tabs.Tab)

    // Only the GET_FORMS lookup should have gone out, no follow-up fill message.
    expect(chrome.tabs.sendMessage).toHaveBeenCalledTimes(1)
  })

  it('sends INIT_AUTOFILL_INPUT for the AUTOFILL_CURRENT_INPUT command', async () => {
    const listener = await getCommandListener()

    await listener('AUTOFILL_CURRENT_INPUT', { id: 1 } as chrome.tabs.Tab)

    expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(1, { type: 'INIT_AUTOFILL_INPUT' })
  })

  it('does nothing for an unrecognized command', async () => {
    const listener = await getCommandListener()

    await listener('SOMETHING_ELSE', { id: 1 } as chrome.tabs.Tab)

    expect(chrome.tabs.sendMessage).not.toHaveBeenCalled()
  })
})
