import { beforeEach, describe, expect, it } from 'vitest'

import { DEFAULT_CONFIG } from '@/consts'
import { useConfigStore } from '@/store/config'
import { DEFAULT_PROFILE, DEFAULT_PROFILE_ID, getEffectiveConfig, useProfileStore } from '@/store/profiles'
import { type Profile } from '@/utils/user-profiles'

beforeEach(() => {
  useConfigStore.setState({ ...DEFAULT_CONFIG }, false)
  useProfileStore.setState({ profiles: [DEFAULT_PROFILE], activeProfileId: DEFAULT_PROFILE_ID })
})

describe('useProfileStore CRUD', () => {
  it('appends a new profile via addProfile', () => {
    const profile: Profile = { id: 'p1', name: 'Work' }
    useProfileStore.getState().addProfile(profile)

    expect(useProfileStore.getState().profiles).toEqual([DEFAULT_PROFILE, profile])
  })

  it('replaces the matching profile by id via updateProfile', () => {
    const profile: Profile = { id: 'p1', name: 'Work' }
    useProfileStore.setState({ profiles: [DEFAULT_PROFILE, profile] })

    const updated = { ...profile, name: 'Renamed' }
    useProfileStore.getState().updateProfile(updated)

    expect(useProfileStore.getState().profiles).toEqual([DEFAULT_PROFILE, updated])
  })

  it('deletes a non-default profile and falls back activeProfileId to default when it was active', () => {
    const profile: Profile = { id: 'p1', name: 'Work' }
    useProfileStore.setState({ profiles: [DEFAULT_PROFILE, profile], activeProfileId: 'p1' })

    useProfileStore.getState().deleteProfile('p1')

    expect(useProfileStore.getState().profiles).toEqual([DEFAULT_PROFILE])
    expect(useProfileStore.getState().activeProfileId).toBe(DEFAULT_PROFILE_ID)
  })

  it('never removes the default profile even if its id is passed to deleteProfile', () => {
    useProfileStore.getState().deleteProfile(DEFAULT_PROFILE_ID)

    expect(useProfileStore.getState().profiles).toEqual([DEFAULT_PROFILE])
  })

  it('sets the active profile id via setActiveProfile', () => {
    const profile: Profile = { id: 'p1', name: 'Work' }
    useProfileStore.setState({ profiles: [DEFAULT_PROFILE, profile] })

    useProfileStore.getState().setActiveProfile('p1')

    expect(useProfileStore.getState().activeProfileId).toBe('p1')
  })
})

describe('getEffectiveConfig', () => {
  it('returns plain config when the active profile has no overrides', () => {
    expect(getEffectiveConfig()).toEqual(useConfigStore.getState())
  })

  it('returns plain config when activeProfileId does not match any profile', () => {
    useProfileStore.setState({ profiles: [DEFAULT_PROFILE], activeProfileId: 'missing' })

    expect(getEffectiveConfig()).toEqual(useConfigStore.getState())
  })

  it('overlays each defined profile override field onto config independently', () => {
    const profile: Profile = {
      id: 'p1',
      name: 'Work',
      tempEmailProvider: 'mailsac.com',
    }
    useProfileStore.setState({ profiles: [DEFAULT_PROFILE, profile], activeProfileId: 'p1' })

    expect(getEffectiveConfig()).toEqual({ ...useConfigStore.getState(), tempEmailProvider: 'mailsac.com' })
  })

  it('overlays all optional override fields together when all are defined', () => {
    const profile: Profile = {
      id: 'p1',
      name: 'Work',
      tempEmailProvider: 'yopmail.com',
      commonPassword: 'custom-pass',
      samePasswordEverytime: true,
      ignoredFields: 'captcha,otp',
      alwaysCheckFields: 'terms',
    }
    useProfileStore.setState({ profiles: [DEFAULT_PROFILE, profile], activeProfileId: 'p1' })

    expect(getEffectiveConfig()).toEqual({
      ...useConfigStore.getState(),
      tempEmailProvider: 'yopmail.com',
      commonPassword: 'custom-pass',
      samePasswordEverytime: true,
      ignoredFields: 'captcha,otp',
      alwaysCheckFields: 'terms',
    })
  })
})

type PersistedProfileState = { profiles: Profile[]; activeProfileId: string }
type PersistApi = { persist: { getOptions: () => { merge: (persisted: unknown, current: unknown) => PersistedProfileState } } }

describe('persisted state merge (back-compat)', () => {
  it('prepends DEFAULT_PROFILE when persisted state predates it being present', () => {
    const persistOptions = (useProfileStore as unknown as PersistApi).persist.getOptions()
    const merged = persistOptions.merge(
      { profiles: [{ id: 'p1', name: 'Old profile' }], activeProfileId: 'p1' },
      useProfileStore.getState(),
    )

    expect(merged.profiles[0]).toEqual(DEFAULT_PROFILE)
    expect(merged.profiles).toHaveLength(2)
  })

  it('leaves profiles untouched when DEFAULT_PROFILE is already present', () => {
    const persistOptions = (useProfileStore as unknown as PersistApi).persist.getOptions()
    const persisted = { profiles: [DEFAULT_PROFILE, { id: 'p1', name: 'Work' }], activeProfileId: 'p1' }
    const merged = persistOptions.merge(persisted, useProfileStore.getState())

    expect(merged.profiles).toEqual(persisted.profiles)
  })
})
