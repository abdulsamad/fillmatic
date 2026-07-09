import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { toastSuccess } = vi.hoisted(() => ({ toastSuccess: vi.fn() }))
vi.mock('sonner', () => ({ toast: { success: toastSuccess } }))
vi.mock('@/components/Options/ProfilesTab', () => ({ default: () => <div data-testid="profiles-tab" /> }))
vi.mock('@/components/Options/FieldRulesTab', () => ({ default: () => <div data-testid="field-rules-tab" /> }))
vi.mock('@/components/Options/ActionsTab', () => ({ default: () => <div data-testid="actions-tab" /> }))
vi.mock('@/components/Options/RecipesTab', () => ({ default: () => <div data-testid="recipes-tab" /> }))

const { isFeatureEnabled } = vi.hoisted(() => ({ isFeatureEnabled: vi.fn().mockReturnValue(true) }))
vi.mock('@/utils/featureFlags', () => ({ isFeatureEnabled }))

import { TooltipProvider } from '@fillmatic/ui'

import OptionsForm from '@/components/Options/Form'
import { DEFAULT_CONFIG } from '@/consts'
import { useConfigStore } from '@/store/config'
import { DEFAULT_PROFILE, DEFAULT_PROFILE_ID, useProfileStore } from '@/store/profiles'

const renderForm = () => render(<OptionsForm />, { wrapper: TooltipProvider })

beforeEach(() => {
  toastSuccess.mockClear()
  isFeatureEnabled.mockReturnValue(true)
  useConfigStore.setState({ ...DEFAULT_CONFIG }, false)
  useProfileStore.setState({ profiles: [DEFAULT_PROFILE], activeProfileId: DEFAULT_PROFILE_ID })
})

describe('OptionsForm (Recipes tab, feature-flagged)', () => {
  it('shows the Recipes tab by default', () => {
    renderForm()

    expect(screen.getByRole('tab', { name: 'Recipes' })).toBeInTheDocument()
  })

  it('hides the Recipes tab entirely when the recipes feature flag is off', () => {
    isFeatureEnabled.mockReturnValue(false)
    renderForm()

    expect(screen.queryByRole('tab', { name: 'Recipes' })).not.toBeInTheDocument()
  })
})

describe('OptionsForm (General tab)', () => {
  it('shows the typing speed slider by default (typingEffect is on) and hides it when toggled off', async () => {
    const user = userEvent.setup()
    renderForm()

    expect(screen.getByText('Typing Speed')).toBeInTheDocument()

    const switches = screen.getAllByRole('switch')
    await user.click(switches[0]) // typingEffect

    expect(screen.queryByText('Typing Speed')).not.toBeInTheDocument()
  })

  it('reveals the common-password input only when "same password everytime" is on', async () => {
    const user = userEvent.setup()
    renderForm()

    expect(screen.queryByPlaceholderText('Enter default password')).not.toBeInTheDocument()

    const switches = screen.getAllByRole('switch')
    await user.click(switches[2]) // samePasswordEverytime

    expect(screen.getByPlaceholderText('Enter default password')).toBeInTheDocument()
  })

  it('disables Save Changes until the form is dirty', async () => {
    const user = userEvent.setup()
    renderForm()

    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeDisabled()

    await user.type(screen.getByPlaceholderText('Enter fields to ignore'), 'x')

    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeEnabled()
  })

  it('shows the default-settings banner when the default profile is active', () => {
    renderForm()

    expect(screen.getByText(/used by all profiles unless overridden/i)).toBeInTheDocument()
  })

  it('shows the custom-profile banner naming the active profile when a non-default profile is active', () => {
    useProfileStore.setState({
      profiles: [DEFAULT_PROFILE, { id: 'p1', name: 'Work' }],
      activeProfileId: 'p1',
    })

    renderForm()

    expect(screen.getByText(/Editing/)).toBeInTheDocument()
    expect(screen.getByText('Work')).toBeInTheDocument()
  })

  it('saves everything to the shared config when submitting with the default profile active', async () => {
    const user = userEvent.setup()
    renderForm()

    const ignoredFieldsInput = screen.getByPlaceholderText('Enter fields to ignore')
    await user.clear(ignoredFieldsInput)
    await user.type(ignoredFieldsInput, 'captcha,otp')
    await user.click(screen.getByRole('button', { name: 'Save Changes' }))

    expect(useConfigStore.getState().ignoredFields).toBe('captcha,otp')
    expect(toastSuccess).toHaveBeenCalledWith('Settings saved!')
  })

  it('splits the save between config (typing/forceAutofill) and the active profile (overridable fields) for a custom profile', async () => {
    useProfileStore.setState({
      profiles: [DEFAULT_PROFILE, { id: 'p1', name: 'Work' }],
      activeProfileId: 'p1',
    })
    const user = userEvent.setup()
    renderForm()

    const ignoredFieldsInput = screen.getByPlaceholderText('Enter fields to ignore')
    await user.clear(ignoredFieldsInput)
    await user.type(ignoredFieldsInput, 'profile-only-field')
    await user.click(screen.getByRole('button', { name: 'Save Changes' }))

    // The override field goes to the profile, not the shared config.
    expect(useConfigStore.getState().ignoredFields).toBe(DEFAULT_CONFIG.ignoredFields)
    const updatedProfile = useProfileStore.getState().profiles.find((p) => p.id === 'p1')
    expect(updatedProfile?.ignoredFields).toBe('profile-only-field')
  })

  it('resets the form and config to defaults when "Reset to Defaults" is clicked', async () => {
    useConfigStore.setState({ ignoredFields: 'something-custom' }, false)
    const user = userEvent.setup()
    renderForm()

    await user.click(screen.getByRole('button', { name: 'Reset to Defaults' }))

    expect(useConfigStore.getState().ignoredFields).toBe(DEFAULT_CONFIG.ignoredFields)
    expect(toastSuccess).toHaveBeenCalledWith('Settings reset to defaults!')
  })

  it('resets the visible form values when the active profile changes', () => {
    useProfileStore.setState({
      profiles: [DEFAULT_PROFILE, { id: 'p1', name: 'Work', ignoredFields: 'profile-specific' }],
      activeProfileId: DEFAULT_PROFILE_ID,
    })
    renderForm()

    expect(screen.getByPlaceholderText('Enter fields to ignore')).toHaveValue(DEFAULT_CONFIG.ignoredFields)

    act(() => {
      useProfileStore.getState().setActiveProfile('p1')
    })

    expect(screen.getByPlaceholderText('Enter fields to ignore')).toHaveValue('profile-specific')
  })

  it('renders the other tabs (mocked) so tab navigation stays wired up', () => {
    renderForm()

    expect(screen.getByRole('tab', { name: 'Profiles' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Field Rules' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Actions' })).toBeInTheDocument()
  })
})
