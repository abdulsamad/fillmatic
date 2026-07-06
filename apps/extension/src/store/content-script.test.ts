import { describe, expect, it } from 'vitest'

import { useContentScriptStore } from '@/store/content-script'

describe('useContentScriptStore', () => {
  it('starts with the expected initial shape', () => {
    expect(useContentScriptStore.getState()).toMatchObject({
      firstName: undefined,
      lastName: undefined,
      lastGeneratedPassword: '',
      activeAction: undefined,
    })
  })

  it('supports setting state directly via setState', () => {
    useContentScriptStore.setState({ firstName: 'Jane', lastGeneratedPassword: 'secret' })

    const state = useContentScriptStore.getState()
    expect(state.firstName).toBe('Jane')
    expect(state.lastGeneratedPassword).toBe('secret')
  })
})
