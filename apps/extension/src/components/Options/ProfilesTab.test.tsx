import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import ProfilesTab from '@/components/Options/ProfilesTab'
import { DEFAULT_PROFILE, DEFAULT_PROFILE_ID, useProfileStore } from '@/store/profiles'
import { type Profile } from '@/utils/user-profiles'

const WORK_PROFILE: Profile = {
  id: 'p1',
  name: 'Work',
  tempEmailProvider: 'mailsac.com',
  commonPassword: 'x',
  samePasswordEverytime: true,
  ignoredFields: 'captcha',
}

beforeEach(() => {
  useProfileStore.setState({ profiles: [DEFAULT_PROFILE], activeProfileId: DEFAULT_PROFILE_ID })
})

describe('ProfilesTab', () => {
  it('renders the default profile as locked, active, with the general-settings placeholder', () => {
    render(<ProfilesTab />)

    // "Default" renders twice: once as the profile name, once inside the lock badge.
    expect(screen.getByText('Default', { selector: 'span.text-sm.font-medium' })).toBeInTheDocument()
    expect(screen.getAllByText('Default')).toHaveLength(2)
    expect(screen.getByText('Active')).toBeInTheDocument()
    expect(screen.getByText('Uses General settings. Select a custom profile to override them.')).toBeInTheDocument()

    // Only the "Add profile" trigger and the profile row button render; the default
    // profile's disabled lock button replaces the edit button, and no delete button renders.
    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(3)
    // The row button also contains a lock icon (inside the "Default" badge), so filter for
    // the disabled one specifically — that's the lock button replacing edit/delete controls.
    const lockedButton = buttons.find((b) => (b as HTMLButtonElement).disabled && b.querySelector('svg.lucide-lock'))
    expect(lockedButton).toBeDisabled()
    expect(buttons.some((b) => b.querySelector('svg.lucide-pencil'))).toBe(false)
    expect(buttons.some((b) => b.querySelector('svg.lucide-trash2'))).toBe(false)
  })

  it('renders a joined summary line for a non-default profile with overrides set', () => {
    useProfileStore.setState({ profiles: [DEFAULT_PROFILE, WORK_PROFILE] })

    render(<ProfilesTab />)

    const summary = screen.getByText(/mailsac\.com/)
    expect(summary).toBeInTheDocument()
    expect(summary.textContent).toContain('mailsac.com')
    expect(summary.textContent).toContain('pw: x')
    expect(summary.textContent).toContain('same pw')
    expect(summary.textContent).toContain('ignore: captcha')
  })

  it('shows working edit and delete icon buttons (not locked) for a non-default profile', () => {
    useProfileStore.setState({ profiles: [DEFAULT_PROFILE, WORK_PROFILE] })

    render(<ProfilesTab />)

    const buttons = screen.getAllByRole('button')
    const editButton = buttons.find((b) => b.querySelector('svg.lucide-pencil'))
    const deleteButton = buttons.find((b) => b.querySelector('svg.lucide-trash2'))

    expect(editButton).toBeDefined()
    expect(editButton).not.toBeDisabled()
    expect(deleteButton).toBeDefined()
    expect(deleteButton).not.toBeDisabled()
  })

  it('sets a non-active, non-default profile as active when its row is clicked', async () => {
    const user = userEvent.setup()
    useProfileStore.setState({ profiles: [DEFAULT_PROFILE, WORK_PROFILE], activeProfileId: DEFAULT_PROFILE_ID })

    render(<ProfilesTab />)
    await user.click(screen.getByRole('button', { name: /Work/ }))

    expect(useProfileStore.getState().activeProfileId).toBe('p1')
  })

  it('toggles an already-active, non-default profile back to the default profile when clicked again', async () => {
    const user = userEvent.setup()
    useProfileStore.setState({ profiles: [DEFAULT_PROFILE, WORK_PROFILE], activeProfileId: 'p1' })

    render(<ProfilesTab />)
    await user.click(screen.getByRole('button', { name: /Work/ }))

    expect(useProfileStore.getState().activeProfileId).toBe(DEFAULT_PROFILE_ID)
  })

  it('deletes a non-default profile after confirming in the alert dialog', async () => {
    const user = userEvent.setup()
    useProfileStore.setState({ profiles: [DEFAULT_PROFILE, WORK_PROFILE] })

    render(<ProfilesTab />)
    const buttons = screen.getAllByRole('button')
    const deleteButton = buttons.find((b) => b.querySelector('svg.lucide-trash2'))!
    await user.click(deleteButton)

    const confirmButton = await screen.findByRole('button', { name: 'Delete' })
    await user.click(confirmButton)

    expect(useProfileStore.getState().profiles).not.toContainEqual(WORK_PROFILE)
    expect(useProfileStore.getState().profiles).toEqual([DEFAULT_PROFILE])
  })

  it('leaves the profile untouched when the delete confirmation is cancelled', async () => {
    const user = userEvent.setup()
    useProfileStore.setState({ profiles: [DEFAULT_PROFILE, WORK_PROFILE] })

    render(<ProfilesTab />)
    const buttons = screen.getAllByRole('button')
    const deleteButton = buttons.find((b) => b.querySelector('svg.lucide-trash2'))!
    await user.click(deleteButton)

    const cancelButton = await screen.findByRole('button', { name: 'Cancel' })
    await user.click(cancelButton)

    expect(useProfileStore.getState().profiles).toEqual([DEFAULT_PROFILE, WORK_PROFILE])
  })

  it('adds a new profile with the entered name', async () => {
    const user = userEvent.setup()

    render(<ProfilesTab />)
    await user.click(screen.getByRole('button', { name: /Add profile/ }))

    const dialog = await screen.findByRole('dialog')
    const input = within(dialog).getByPlaceholderText('e.g. Work, Personal, Staging')
    await user.type(input, 'Staging')
    await user.click(within(dialog).getByRole('button', { name: 'Add profile' }))

    const profiles = useProfileStore.getState().profiles
    expect(profiles).toHaveLength(2)
    expect(profiles[1].name).toBe('Staging')
  })

  it('renames a non-default profile via the edit dialog', async () => {
    const user = userEvent.setup()
    useProfileStore.setState({ profiles: [DEFAULT_PROFILE, WORK_PROFILE] })

    render(<ProfilesTab />)
    const buttons = screen.getAllByRole('button')
    const editButton = buttons.find((b) => b.querySelector('svg.lucide-pencil'))!
    await user.click(editButton)

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByRole('heading', { name: 'Rename profile' })).toBeInTheDocument()
    const input = within(dialog).getByPlaceholderText('e.g. Work, Personal, Staging')

    await user.type(input, 'Work Renamed')
    await user.click(within(dialog).getByRole('button', { name: 'Save' }))

    const updated = useProfileStore.getState().profiles.find((p) => p.id === 'p1')
    expect(updated?.name).toBe('Work Renamed')
  })

  it('does not add a profile when the name is left empty', async () => {
    const user = userEvent.setup()

    render(<ProfilesTab />)
    await user.click(screen.getByRole('button', { name: /Add profile/ }))

    const dialog = await screen.findByRole('dialog')
    within(dialog).getByPlaceholderText('e.g. Work, Personal, Staging')
    await user.click(within(dialog).getByRole('button', { name: 'Add profile' }))

    expect(useProfileStore.getState().profiles).toEqual([DEFAULT_PROFILE])
  })
})
