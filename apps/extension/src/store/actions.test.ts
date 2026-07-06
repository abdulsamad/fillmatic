import { beforeEach, describe, expect, it } from 'vitest'

import { useActionsStore } from '@/store/actions'
import { type Action } from '@/utils/actions'

const makeAction = (overrides: Partial<Action> = {}): Action => ({
  id: 'a1',
  name: 'Test action',
  matcher: { type: 'startsWith', value: 'https://example.com' },
  active: true,
  fields: [],
  ...overrides,
})

beforeEach(() => {
  useActionsStore.setState({ actions: [] })
})

describe('useActionsStore', () => {
  it('appends a new action via addAction', () => {
    const action = makeAction()
    useActionsStore.getState().addAction(action)

    expect(useActionsStore.getState().actions).toEqual([action])
  })

  it('replaces the matching action by id via updateAction, leaving others untouched', () => {
    const a1 = makeAction({ id: 'a1', name: 'Original' })
    const a2 = makeAction({ id: 'a2', name: 'Other' })
    useActionsStore.setState({ actions: [a1, a2] })

    const updated = { ...a1, name: 'Updated' }
    useActionsStore.getState().updateAction(updated)

    expect(useActionsStore.getState().actions).toEqual([updated, a2])
  })

  it('removes only the action matching the given id via deleteAction', () => {
    const a1 = makeAction({ id: 'a1' })
    const a2 = makeAction({ id: 'a2' })
    useActionsStore.setState({ actions: [a1, a2] })

    useActionsStore.getState().deleteAction('a1')

    expect(useActionsStore.getState().actions).toEqual([a2])
  })
})
