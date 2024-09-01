import { getCurrentTab, log } from '@/utils'
import { MESSAGES } from '@/consts'

log('BACKGROUND SCRIPT is running...')

chrome.action.onClicked.addListener(async () => {
  const tab = await getCurrentTab()

  if (!tab.id) return null
})
