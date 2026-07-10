import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { PRODUCT_NAME } from '@fillmatic/config'

const { isFeatureEnabled } = vi.hoisted(() => ({ isFeatureEnabled: vi.fn().mockReturnValue(true) }))
vi.mock('@/utils/featureFlags', () => ({ isFeatureEnabled }))

import Popup from '@/popup/Popup'
import { DEFAULT_PROFILE, DEFAULT_PROFILE_ID, useProfileStore } from '@/store/profiles'
import { usePopupStore } from '@/store/popup'
import { type Form } from '@/types'

// chrome.* is overloaded (callback vs. Promise-returning forms), which makes TS infer `void`
// for vi.mocked(...).mockResolvedValue(...). Cast to the Promise-returning shape we actually use.
type AsyncMock<T> = { mockResolvedValue: (value: T) => void; mockResolvedValueOnce: (value: T) => void }
const asAsyncMock = <T,>(fn: unknown) => fn as AsyncMock<T>

const baseTab = { id: 1, url: 'https://example.com' } as chrome.tabs.Tab
const makeForm = (overrides: Partial<Form> = {}): Form => ({ id: 'f1', index: 0, class: '', ...overrides })

const fillData = vi.fn().mockResolvedValue(undefined)

beforeEach(() => {
  vi.clearAllMocks()
  isFeatureEnabled.mockReturnValue(true)
  usePopupStore.setState({
    isAutofilling: false,
    isDisabled: false,
    currentTab: null,
    forms: [],
    commands: {} as never,
    fillData,
  })
  useProfileStore.setState({ profiles: [DEFAULT_PROFILE], activeProfileId: DEFAULT_PROFILE_ID })
  fillData.mockClear()

  asAsyncMock<chrome.tabs.Tab[]>(chrome.tabs.query).mockResolvedValue([baseTab])
  asAsyncMock<Record<string, unknown>>(chrome.tabs.sendMessage).mockResolvedValue({})
  asAsyncMock<chrome.commands.Command[]>(chrome.commands.getAll).mockResolvedValue([])
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('Popup mount effects', () => {
  it('loads the current tab, fetches forms, and renders a button per form', async () => {
    asAsyncMock<{ forms: Form[] }>(chrome.tabs.sendMessage).mockResolvedValue({
      forms: [makeForm({ id: 'f1', name: 'Login' })],
    })

    render(<Popup />)

    expect(await screen.findByRole('button', { name: /Fill Login form/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Fill all fields/i })).toBeEnabled()
  })

  it('disables actions and shows a banner on internal pages', async () => {
    asAsyncMock<chrome.tabs.Tab[]>(chrome.tabs.query).mockResolvedValue([
      { id: 1, url: 'chrome://extensions' } as chrome.tabs.Tab,
    ])

    render(<Popup />)

    await waitFor(() => expect(screen.getByRole('button', { name: /Fill all fields/i })).toBeDisabled())
    expect(screen.getByRole('alert')).toHaveTextContent(`${PRODUCT_NAME} cannot be used on internal pages.`)
  })

  it('does not fetch forms when the current tab has no id', async () => {
    asAsyncMock<chrome.tabs.Tab[]>(chrome.tabs.query).mockResolvedValue([
      { id: undefined, url: 'https://example.com' } as unknown as chrome.tabs.Tab,
    ])

    render(<Popup />)

    await waitFor(() => expect(chrome.tabs.query).toHaveBeenCalled())
    expect(chrome.tabs.sendMessage).not.toHaveBeenCalled()
  })

  it('recovers from a rejected tab query without leaving the UI stuck or crashing', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(chrome.tabs.query).mockRejectedValue(new Error('boom'))

    render(<Popup />)

    await waitFor(() => expect(errorSpy).toHaveBeenCalled())
    expect(screen.getByRole('button', { name: /Fill all fields/i })).toBeEnabled()
  })
})

describe('Popup profile selector', () => {
  it('is hidden when there is only one profile', async () => {
    render(<Popup />)
    await screen.findByRole('button', { name: /Fill all fields/i })

    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
  })

  it('is shown when there is more than one profile', async () => {
    useProfileStore.setState({ profiles: [DEFAULT_PROFILE, { id: 'p1', name: 'Work' }], activeProfileId: DEFAULT_PROFILE_ID })

    render(<Popup />)
    await screen.findByRole('button', { name: /Fill all fields/i })

    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })
})

describe('Popup actions', () => {
  it('calls fillData with fillType "all" when "Fill all fields" is clicked', async () => {
    const user = userEvent.setup()
    render(<Popup />)

    await user.click(await screen.findByRole('button', { name: /Fill all fields/i }))

    expect(fillData).toHaveBeenCalledWith({ fillType: 'all' })
  })

  it('calls fillData with fillType "single" and the form when a per-form button is clicked', async () => {
    const form = makeForm({ id: 'f1', name: 'Login' })
    asAsyncMock<{ forms: Form[] }>(chrome.tabs.sendMessage).mockResolvedValue({ forms: [form] })
    const user = userEvent.setup()
    render(<Popup />)

    await user.click(await screen.findByRole('button', { name: /Fill Login form/i }))

    expect(fillData).toHaveBeenCalledWith({ fillType: 'single', form })
  })

  it('opens the extension options page when Settings is clicked', async () => {
    const user = userEvent.setup()
    render(<Popup />)

    await user.click(await screen.findByRole('button', { name: 'Settings' }))

    expect(chrome.runtime.openOptionsPage).toHaveBeenCalled()
  })
})

describe('Popup field mapper button (feature-flagged)', () => {
  it('requests the sidePanel permission, opens the side panel, and closes the popup when granted', async () => {
    chrome.permissions = { request: vi.fn().mockResolvedValue(true) } as unknown as typeof chrome.permissions
    chrome.sidePanel = { open: vi.fn() } as unknown as typeof chrome.sidePanel
    const closeSpy = vi.spyOn(window, 'close').mockImplementation(() => {})
    const user = userEvent.setup()
    render(<Popup />)

    await user.click(await screen.findByRole('button', { name: 'Open field mapper' }))

    expect(chrome.permissions.request).toHaveBeenCalledWith({ permissions: ['sidePanel'] })
    await waitFor(() => expect(chrome.sidePanel.open).toHaveBeenCalledWith({ tabId: baseTab.id }))
    expect(closeSpy).toHaveBeenCalled()
  })

  it('does not open the side panel when the permission is denied', async () => {
    chrome.permissions = { request: vi.fn().mockResolvedValue(false) } as unknown as typeof chrome.permissions
    chrome.sidePanel = { open: vi.fn() } as unknown as typeof chrome.sidePanel
    const closeSpy = vi.spyOn(window, 'close').mockImplementation(() => {})
    const user = userEvent.setup()
    render(<Popup />)

    await user.click(await screen.findByRole('button', { name: 'Open field mapper' }))

    await waitFor(() => expect(chrome.permissions.request).toHaveBeenCalled())
    expect(chrome.sidePanel.open).not.toHaveBeenCalled()
    expect(closeSpy).not.toHaveBeenCalled()
  })

  it('is hidden entirely when the aiMapping feature flag is off', async () => {
    isFeatureEnabled.mockReturnValue(false)
    render(<Popup />)

    await screen.findByRole('button', { name: 'Settings' })
    expect(screen.queryByRole('button', { name: 'Open field mapper' })).not.toBeInTheDocument()
  })
})

describe('Popup scroll-into-view hover behavior', () => {
  // Use fireEvent (not userEvent) for the hover itself: userEvent's internal pointer simulation
  // relies on real timers, which conflicts with faking timers to control useTimeout's delay.
  it('sends SCROLL_FORM_INTO_VIEW after the hover delay elapses', async () => {
    const form = makeForm({ id: 'f1', name: 'Login' })
    asAsyncMock<{ forms: Form[] }>(chrome.tabs.sendMessage).mockResolvedValue({ forms: [form] })
    render(<Popup />)
    const button = await screen.findByRole('button', { name: /Fill Login form/i })
    vi.mocked(chrome.tabs.sendMessage).mockClear()

    vi.useFakeTimers()
    fireEvent.mouseEnter(button)
    await vi.advanceTimersByTimeAsync(600)

    expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(
      baseTab.id,
      expect.objectContaining({ type: 'SCROLL_FORM_INTO_VIEW', form }),
    )
  })

  it('does not send the message if the pointer leaves before the delay elapses', async () => {
    const form = makeForm({ id: 'f1', name: 'Login' })
    asAsyncMock<{ forms: Form[] }>(chrome.tabs.sendMessage).mockResolvedValue({ forms: [form] })
    render(<Popup />)
    const button = await screen.findByRole('button', { name: /Fill Login form/i })
    vi.mocked(chrome.tabs.sendMessage).mockClear()

    vi.useFakeTimers()
    fireEvent.mouseEnter(button)
    fireEvent.mouseLeave(button)
    await vi.advanceTimersByTimeAsync(600)

    expect(chrome.tabs.sendMessage).not.toHaveBeenCalledWith(
      baseTab.id,
      expect.objectContaining({ type: 'SCROLL_FORM_INTO_VIEW' }),
    )
  })
})
