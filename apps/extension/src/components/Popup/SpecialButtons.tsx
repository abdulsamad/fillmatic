import { useEffect, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'

import { usePopupStore } from '@/store/popup'
import { getSiteRule, SiteRule } from '@/utils/site-rules'
import { Button } from '@/components/ui/button'

const SpecialButtons = () => {
  const [siteRule, setSiteRule] = useState<SiteRule>()

  const { isAutofilling, setIsAutofilling, currentTab } = usePopupStore(
    useShallow(({ isAutofilling, setIsAutofilling, currentTab }) => ({ isAutofilling, setIsAutofilling, currentTab })),
  )

  useEffect(() => {
    if (!currentTab?.url) return
    setSiteRule(getSiteRule(currentTab.url))
  }, [currentTab])

  if (!siteRule) return null

  const autoFillSpecific = async ({ messageId, action }: Pick<SiteRule['rules'][number], 'messageId' | 'action'>) => {
    try {
      if (!currentTab?.id) return null

      setIsAutofilling(true)

      if (action) {
        // chrome.tabs.sendMessage(currentTab.id, { type: `SITE_AUTOFILL_${messageId}` })
      } else {
        await chrome.tabs.sendMessage(currentTab.id, { type: `SITE_AUTOFILL_${messageId}` })
      }

      setIsAutofilling(false)
    } catch (err) {
      console.error(err)
      setIsAutofilling(false)
    }
  }

  return (
    <div className="space-y-4 bg-background text-foreground">
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground">{siteRule.name}</h2>
        <div className="grid gap-2">
          {siteRule.rules.map(({ match, name, messageId, action }) => (
            <Button
              key={match}
              variant="secondary"
              disabled={isAutofilling}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => autoFillSpecific({ messageId, action })}
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
