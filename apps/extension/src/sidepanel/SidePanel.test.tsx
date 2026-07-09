import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getLocalModelAvailability, inferFieldMap } = vi.hoisted(() => ({
  getLocalModelAvailability: vi.fn().mockResolvedValue('unavailable'),
  inferFieldMap: vi.fn().mockResolvedValue([]),
}))
vi.mock('@/utils/localModel', () => ({ getLocalModelAvailability, inferFieldMap }))

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
  useAiMappingsStore.setState({ snapshots: [] })
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
})
