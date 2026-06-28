import { useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'

import { usePopupStore } from '@/store/popup'
import { useActionsStore } from '@/store/actions'
import { getMatchingActions, type Action } from '@/utils/actions'
import { Button } from '@/components/ui/button'

const SpecialButtons = () => {
  const actions = useActionsStore((state) => state.actions)

  const { isAutofilling, currentTab, fillData } = usePopupStore(
    useShallow(({ isAutofilling, fillData, currentTab }) => ({ isAutofilling, fillData, currentTab })),
  )

  const groups = useMemo(() => {
    if (!currentTab?.url) return [] as Array<{ label: string; actions: Action[] }>

    const matching = getMatchingActions(actions, currentTab.url)

    // Preserve order while grouping by the optional `group` label
    const order: string[] = []
    const map = new Map<string, Action[]>()
    for (const action of matching) {
      const label = action.group || 'Actions'
      if (!map.has(label)) {
        map.set(label, [])
        order.push(label)
      }
      map.get(label)!.push(action)
    }
    return order.map((label) => ({ label, actions: map.get(label)! }))
  }, [actions, currentTab?.url])

  if (groups.length === 0) return null

  return (
    <div className="space-y-4 bg-background text-foreground">
      {groups.map((group) => (
        <div key={group.label} className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground">{group.label}</h2>
          <div className="grid gap-2">
            {group.actions.map((action) => (
              <Button
                key={action.id}
                variant="secondary"
                disabled={isAutofilling}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => fillData({ fillType: 'site', messageId: action.id })}
              >
                {action.name}
              </Button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default SpecialButtons
