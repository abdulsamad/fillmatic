import { Button } from '@/components/ui/button'

import { getCurrentTab } from '@/utils'
import { MESSAGES } from '@/consts'

export const Popup = () => {
  const fillAllForms = async () => {
    const tab = await getCurrentTab()

    if (!tab.id) return null

    const { INIT_AUTOFILL_ALL } = MESSAGES

    chrome.tabs.sendMessage(tab.id, INIT_AUTOFILL_ALL)
  }

  return (
    <div className="relative w-[250px] h-[400px] bg-gray-100 p-4 box-border">
      <div className="h-full w-full">
        <h1 className="text-xl font-semibold mb-4">Popup</h1>
        <div className="flex gap-2 items-center justify-center flex-col">
          <Button onClick={fillAllForms}>Fill All Forms</Button>
        </div>
      </div>
    </div>
  )
}

export default Popup
