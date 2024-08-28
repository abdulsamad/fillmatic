import { getCurrentTab, log } from '@/utils'

log('BACKGROUND SCRIPT is running...')

chrome.action.onClicked.addListener(async () => {
  const tab = await getCurrentTab()

  if (!tab.id) return null

  const response = chrome.tabs.sendMessage(tab.id, { greeting: 'hello' })

  // do something with response here, not outside the function
  console.log(response)
})
