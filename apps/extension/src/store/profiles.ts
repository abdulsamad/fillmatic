import { create } from 'zustand'
import { persist, createJSONStorage, devtools } from 'zustand/middleware'

import { useConfigStore as configStore } from '@/store/config'
import { type Profile } from '@/utils/user-profiles'

export const DEFAULT_PROFILE_ID = '__default__'

export const DEFAULT_PROFILE: Profile = {
  id: DEFAULT_PROFILE_ID,
  name: 'Default',
}

interface ProfileStore {
  profiles: Profile[]
  activeProfileId: string
  addProfile: (profile: Profile) => void
  updateProfile: (profile: Profile) => void
  deleteProfile: (id: string) => void
  setActiveProfile: (id: string) => void
}

export const useProfileStore = create(
  devtools(
    persist<ProfileStore>(
      (set) => ({
        profiles: [DEFAULT_PROFILE],
        activeProfileId: DEFAULT_PROFILE_ID,

        addProfile: (profile) => set((state) => ({ profiles: [...state.profiles, profile] })),
        updateProfile: (profile) =>
          set((state) => ({
            profiles: state.profiles.map((p) => (p.id === profile.id ? profile : p)),
          })),
        deleteProfile: (id) =>
          set((state) => ({
            profiles: state.profiles.filter((p) => p.id !== id || p.id === DEFAULT_PROFILE_ID),
            activeProfileId: state.activeProfileId === id ? DEFAULT_PROFILE_ID : state.activeProfileId,
          })),
        setActiveProfile: (id) => set({ activeProfileId: id }),
      }),
      {
        name: 'profiles',
        storage: createJSONStorage(() => ({
          getItem: async (name: string) => {
            const value = await chrome.storage.local.get(name)
            return (value[name] as string) || null
          },
          setItem: async (name: string, value: string) => {
            await chrome.storage.local.set({ [name]: value })
          },
          removeItem: async (name: string) => {
            await chrome.storage.local.remove(name)
          },
        })),
        version: 0,
        merge: (persisted, current) => {
          const state = persisted as ProfileStore
          const hasDefault = state.profiles?.some((p) => p.id === DEFAULT_PROFILE_ID)
          return {
            ...current,
            ...state,
            profiles: hasDefault ? state.profiles : [DEFAULT_PROFILE, ...(state.profiles ?? [])],
          }
        },
      },
    ),
  ),
)

/** Returns config merged with the active profile's overrides. Use this in the autofill pipeline instead of configStore.getState(). */
export const getEffectiveConfig = () => {
  const config = configStore.getState()
  const { profiles, activeProfileId } = useProfileStore.getState()
  const profile = profiles.find((p) => p.id === activeProfileId)
  if (!profile) return config
  return {
    ...config,
    ...(profile.tempEmailProvider !== undefined && { tempEmailProvider: profile.tempEmailProvider }),
    ...(profile.commonPassword !== undefined && { commonPassword: profile.commonPassword }),
    ...(profile.samePasswordEverytime !== undefined && { samePasswordEverytime: profile.samePasswordEverytime }),
    ...(profile.ignoredFields !== undefined && { ignoredFields: profile.ignoredFields }),
    ...(profile.alwaysCheckFields !== undefined && { alwaysCheckFields: profile.alwaysCheckFields }),
  }
}
