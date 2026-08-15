import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getLocalModelAvailability, inferFieldMap } = vi.hoisted(() => ({
  getLocalModelAvailability: vi.fn().mockResolvedValue('unavailable'),
  inferFieldMap: vi.fn().mockResolvedValue([]),
}))
vi.mock('@/utils/localModel', () => ({ getLocalModelAvailability, inferFieldMap }))

const { isFeatureEnabled } = vi.hoisted(() => ({ isFeatureEnabled: vi.fn().mockReturnValue(true) }))
vi.mock('@/utils/featureFlags', () => ({ isFeatureEnabled }))

const { can } = vi.hoisted(() => ({ can: vi.fn().mockReturnValue(true) }))
vi.mock('@/utils/entitlements', () => ({ can }))

const { downloadJson, readJsonFile } = vi.hoisted(() => ({
  downloadJson: vi.fn(),
  readJsonFile: vi.fn(),
}))
vi.mock('@/utils/json-io', () => ({ downloadJson, readJsonFile }))

import { MESSAGES } from '@/consts'
import { useAiMappingsStore } from '@/store/ai-mappings'
import { SidePanel } from '@/sidepanel/SidePanel'
import type { PageField } from '@/autofill/pageFields'

const PAGE_FIELDS: PageField[] = [
  {
    ref: 0,
    label: 'Email address',
    kind: 'input:email',
    attribute: 'id',
    match: 'email',
    suggested: { valueStrategy: 'random', valueType: 'email' },
  },
]

// chrome.tabs.* are overloaded (callback vs. Promise forms); cast to the Promise
// shape we use, mirroring the asAsyncMock pattern in Popup.test.tsx.
type AsyncMock<T> = { mockResolvedValue: (value: T) => void }
const asAsyncMock = <T,>(fn: unknown) => fn as AsyncMock<T>

const mockActiveTab = () => {
  asAsyncMock<chrome.tabs.Tab[]>(chrome.tabs.query).mockResolvedValue([
    { id: 7, url: 'https://example.com/signup' } as chrome.tabs.Tab,
  ])
  vi.mocked(chrome.tabs.sendMessage).mockImplementation(async (_tabId, message) => {
    if ((message as { type: string }).type === MESSAGES.GET_PAGE_FIELDS) {
      return { type: MESSAGES.GET_PAGE_FIELDS, fields: PAGE_FIELDS, url: 'https://example.com/signup' }
    }
    return undefined
  })
}

beforeEach(() => {
  vi.mocked(chrome.tabs.query).mockReset()
  asAsyncMock<chrome.tabs.Tab[]>(chrome.tabs.query).mockResolvedValue([])
  vi.mocked(chrome.tabs.sendMessage).mockReset()
  getLocalModelAvailability.mockReset().mockResolvedValue('unavailable')
  inferFieldMap.mockReset().mockResolvedValue([])
  isFeatureEnabled.mockReturnValue(true)
  can.mockReturnValue(true)
  downloadJson.mockReset()
  readJsonFile.mockReset()
  useAiMappingsStore.setState({ snapshots: [] })
})

describe('SidePanel feature flag', () => {
  it('shows a disabled message and never scans the page when aiMapping is off', async () => {
    isFeatureEnabled.mockReturnValue(false)
    render(<SidePanel />)

    expect(await screen.findByText(/field mapping is currently disabled/i)).toBeInTheDocument()
    expect(chrome.tabs.sendMessage).not.toHaveBeenCalled()
  })

  it('shows the plan gate when the user is not entitled', async () => {
    can.mockReturnValue(false)
    render(<SidePanel />)

    expect(await screen.findByText(/not part of your current plan/i)).toBeInTheDocument()
    expect(chrome.tabs.sendMessage).not.toHaveBeenCalled()
  })
})

describe('SidePanel', () => {
  it('shows the heuristics-only status when on-device AI is unavailable', async () => {
    render(<SidePanel />)

    expect(await screen.findByText(/heuristics only/i)).toBeInTheDocument()
  })

  it('scans the page and shows the heuristic prefill without any AI', async () => {
    mockActiveTab()
    const user = userEvent.setup()
    render(<SidePanel />)

    await user.click(screen.getByRole('button', { name: /scan page/i }))

    expect(await screen.findByText('Email address')).toBeInTheDocument()
    expect(inferFieldMap).not.toHaveBeenCalled()
    // The prefilled row is fillable, so the fill button reflects one target.
    expect(screen.getByRole('button', { name: /fill \(1\)/i })).toBeEnabled()
  })

  it('enhances the prefill with model inferences when AI is available', async () => {
    mockActiveTab()
    getLocalModelAvailability.mockResolvedValue('available')
    inferFieldMap.mockResolvedValue([{ ref: 0, valueType: 'phone', valueStrategy: 'random' }])

    const user = userEvent.setup()
    render(<SidePanel />)
    await screen.findByText(/on-device ai ready/i)

    await user.click(screen.getByRole('button', { name: /scan page/i }))

    await waitFor(() => expect(inferFieldMap).toHaveBeenCalled())
    // The value-type select now shows the model's suggestion.
    expect(await screen.findByText('phone')).toBeInTheDocument()
  })

  it('shows download progress and refreshes availability after a downloadable model is initialized', async () => {
    mockActiveTab()
    getLocalModelAvailability.mockResolvedValueOnce('downloadable').mockResolvedValueOnce('available')
    let finishInference: (value: []) => void = () => undefined
    inferFieldMap.mockImplementation(async (_fields: unknown, onProgress: (progress: number) => void) => {
      onProgress(0.456)
      return await new Promise<[]>((resolve) => {
        finishInference = resolve
      })
    })
    const user = userEvent.setup()
    render(<SidePanel />)
    expect(await screen.findByText(/available to download/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /scan page/i }))
    expect(await screen.findByText(/downloading on-device ai.*46%/i)).toBeInTheDocument()

    finishInference([])
    expect(await screen.findByText(/on-device ai ready/i)).toBeInTheDocument()
  })

  it('recovers cleanly when there is no active tab or the content script is unavailable', async () => {
    const user = userEvent.setup()
    render(<SidePanel />)

    await user.click(screen.getByRole('button', { name: /scan page/i }))
    expect(screen.queryByText('Email address')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /scan page/i })).toBeEnabled()

    asAsyncMock<chrome.tabs.Tab[]>(chrome.tabs.query).mockResolvedValue([{ id: 7 } as chrome.tabs.Tab])
    vi.mocked(chrome.tabs.sendMessage).mockRejectedValue(new Error('no receiving end'))
    await user.click(screen.getByRole('button', { name: /scan page/i }))
    expect(screen.queryByText('Email address')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /scan page/i })).toBeEnabled()
  })

  it('sends the mapped fields to the page on fill', async () => {
    mockActiveTab()
    const user = userEvent.setup()
    render(<SidePanel />)

    await user.click(screen.getByRole('button', { name: /scan page/i }))
    await screen.findByText('Email address')
    await user.click(screen.getByRole('button', { name: /fill \(1\)/i }))

    await waitFor(() =>
      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(7, {
        type: MESSAGES.APPLY_MAPPING,
        fields: [
          {
            attribute: 'id',
            operator: 'exact',
            match: 'email',
            value: '',
            valueStrategy: 'random',
            valueType: 'email',
          },
        ],
      }),
    )
  })

  it('saves the current map as a snapshot for the site', async () => {
    mockActiveTab()
    const user = userEvent.setup()
    render(<SidePanel />)

    await user.click(screen.getByRole('button', { name: /scan page/i }))
    await screen.findByText('Email address')

    await user.type(screen.getByPlaceholderText('Snapshot name'), 'Signup map')
    await user.click(screen.getByRole('button', { name: /save snapshot/i }))

    const { snapshots } = useAiMappingsStore.getState()
    expect(snapshots).toHaveLength(1)
    expect(snapshots[0]).toMatchObject({ name: 'Signup map', siteMatcher: 'example.com' })
    expect(screen.getByText(/saved snapshots/i)).toBeInTheDocument()
  })

  it('highlights, edits, and removes scanned rows', async () => {
    mockActiveTab()
    const user = userEvent.setup()
    render(<SidePanel />)
    await user.click(screen.getByRole('button', { name: /scan page/i }))

    const row = (await screen.findByText('Email address')).closest('.rounded-md') as HTMLElement
    fireEvent.mouseEnter(row)
    fireEvent.mouseLeave(row)
    await waitFor(() =>
      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(7, { type: MESSAGES.HIGHLIGHT_FIELD, ref: 0 }),
    )
    await waitFor(() =>
      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(7, { type: MESSAGES.HIGHLIGHT_FIELD, ref: -1 }),
    )

    const match = screen.getByRole('textbox', { name: /match value/i })
    await user.clear(match)
    await user.type(match, 'contact_email')
    expect(match).toHaveValue('contact_email')

    await user.click(screen.getByRole('button', { name: /remove email address/i }))
    expect(screen.queryByText('Email address')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /fill \(0\)/i })).toBeDisabled()
  })

  it('uses the hostname as the default snapshot name', async () => {
    mockActiveTab()
    const user = userEvent.setup()
    render(<SidePanel />)
    await user.click(screen.getByRole('button', { name: /scan page/i }))
    await screen.findByText('Email address')
    await user.click(screen.getByRole('button', { name: /save snapshot/i }))

    expect(useAiMappingsStore.getState().snapshots[0]).toMatchObject({
      name: 'example.com',
      siteMatcher: 'example.com',
    })
  })

  it('loads and deletes saved snapshots', async () => {
    useAiMappingsStore.setState({
      snapshots: [
        {
          id: 'snap-1',
          name: 'Old map',
          siteMatcher: 'example.com',
          createdAt: '2026-07-09T00:00:00.000Z',
          fields: [{ attribute: 'name', operator: 'exact', match: 'city', value: 'Berlin' }],
        },
      ],
    })

    const user = userEvent.setup()
    render(<SidePanel />)

    await user.click(await screen.findByRole('button', { name: /^old map/i }))
    expect(screen.getByDisplayValue('Berlin')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /delete old map/i }))
    expect(useAiMappingsStore.getState().snapshots).toEqual([])
  })

  it('imports only valid, non-duplicate snapshots and clears the file input', async () => {
    useAiMappingsStore.setState({
      snapshots: [
        {
          id: 'existing',
          name: 'Existing',
          siteMatcher: 'example.com',
          createdAt: '2026-08-16T00:00:00.000Z',
          fields: [],
        },
      ],
    })
    readJsonFile.mockResolvedValue([
      { id: 'missing-site', fields: [] },
      { id: 'missing-fields', siteMatcher: 'example.com' },
      { id: 'existing', name: 'Duplicate', siteMatcher: 'example.com', fields: [] },
      { id: 'new', name: 'Imported', siteMatcher: 'example.com', fields: [] },
    ])
    const user = userEvent.setup()
    render(<SidePanel />)
    const fileInput = screen.getByLabelText(/import snapshots file/i) as HTMLInputElement

    await user.upload(fileInput, new File(['[]'], 'snapshots.json', { type: 'application/json' }))

    expect(useAiMappingsStore.getState().snapshots.map((snapshot) => snapshot.id)).toEqual(['existing', 'new'])
    expect(fileInput.value).toBe('')
  })

  it('ignores non-array and unreadable snapshot imports', async () => {
    const user = userEvent.setup()
    render(<SidePanel />)
    const fileInput = screen.getByLabelText(/import snapshots file/i)

    readJsonFile.mockResolvedValueOnce({ id: 'not-an-array' }).mockRejectedValueOnce(new Error('invalid json'))
    await user.upload(fileInput, new File(['{}'], 'object.json', { type: 'application/json' }))
    await user.upload(fileInput, new File(['bad'], 'bad.json', { type: 'application/json' }))
    fireEvent.change(fileInput, { target: { files: [] } })

    expect(useAiMappingsStore.getState().snapshots).toEqual([])
  })

  it('exports the current snapshots', async () => {
    const snapshots = [
      {
        id: 'exported',
        name: 'Exported',
        siteMatcher: 'example.com',
        createdAt: '2026-08-16T00:00:00.000Z',
        fields: [],
      },
    ]
    useAiMappingsStore.setState({ snapshots })
    const user = userEvent.setup()
    render(<SidePanel />)
    await screen.findByText(/heuristics only/i)

    await user.click(screen.getByRole('button', { name: /^export$/i }))
    expect(downloadJson).toHaveBeenCalledWith('fillmatic-snapshots.json', snapshots)
  })
})
