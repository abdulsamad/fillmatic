import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'

export const Popup = () => {
  const [tabId, setTabId] = useState<number>()
  const [countSync, setCountSync] = useState(0)

  useEffect(() => {
    ;(async () => {
      let queryOptions = { active: true, lastFocusedWindow: true }
      let [tab] = await chrome.tabs.query(queryOptions)

      setTabId(tab?.id)
    })()
  }, [])

  return (
    <div className="relative w-[400px] h-[600px] bg-gray-100 p-4 box-border">
      <h1 className="text-xl font-semibold mb-4">Popup</h1>
      <p className="text-gray-700 mb-4">
        This is your popup content. You can add more components as needed.
      </p>
      <div className="flex gap-2 items-center justify-center flex-col">
        <div className="y-5 text-xl">{countSync}</div>
        <Button onClick={() => setCountSync((c) => c + 1)}>Click Me</Button>
      </div>
    </div>
  )
}

export default Popup
