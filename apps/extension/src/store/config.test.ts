import { beforeEach, describe, expect, it } from 'vitest'

import { DEFAULT_CONFIG } from '@/consts'
import { useConfigStore } from '@/store/config'

beforeEach(() => {
  useConfigStore.setState({ ...DEFAULT_CONFIG }, false)
})

describe('useConfigStore', () => {
  it('initializes with DEFAULT_CONFIG', () => {
    const state = useConfigStore.getState()
    expect(state.typingEffect).toBe(DEFAULT_CONFIG.typingEffect)
    expect(state.typingSpeed).toBe(DEFAULT_CONFIG.typingSpeed)
    expect(state.commonPassword).toBe(DEFAULT_CONFIG.commonPassword)
  })

  it('replaces config fields via saveConfig', () => {
    useConfigStore.getState().saveConfig({
      ...DEFAULT_CONFIG,
      typingEffect: false,
      typingSpeed: 200,
    })

    const state = useConfigStore.getState()
    expect(state.typingEffect).toBe(false)
    expect(state.typingSpeed).toBe(200)
  })
})
