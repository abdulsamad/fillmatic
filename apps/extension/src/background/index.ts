import { getCurrentTab, log } from '@/utils'
import { MESSAGES } from '@/consts'

log('BACKGROUND SCRIPT is running...')

chrome.action.onClicked.addListener(async () => {
  const tab = await getCurrentTab()

  if (!tab.id) return null

  const { INIT_AUTOFILL_ALL } = MESSAGES

  // chrome.tabs.sendMessage(tab.id, INIT_AUTOFILL_ALL)
})
