import { useEffect, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'

import { usePopupStore } from '@/store/popup'
import { getSiteRule, SiteRule } from '@/utils/site-rules'
import { Button } from '@/components/ui/button'

const SpecialButtons = () => {
  const [siteRule, setSiteRule] = useState<SiteRule>()

  const { isAutofilling, currentTab, fillData } = usePopupStore(
    useShallow(({ isAutofilling, fillData, currentTab }) => ({ isAutofilling, fillData, currentTab })),
  )

  useEffect(() => {
    if (!currentTab?.url) return

    getSiteRule(currentTab.url).then((rule) => setSiteRule(rule))
  }, [currentTab])

  if (!siteRule) return null

  return (
    <div className="space-y-4 bg-background text-foreground">
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground">{siteRule.name}</h2>
        <div className="grid gap-2">
          {siteRule.rules.map(({ match, name, messageId, action }) => (
            <Button
              key={messageId}
              variant="secondary"
              disabled={isAutofilling}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => fillData({ fillType: 'site', messageId })}
            >
              {name}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default SpecialButtons
