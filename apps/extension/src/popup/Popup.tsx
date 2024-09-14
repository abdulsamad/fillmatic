import { useState, useLayoutEffect } from 'react'

import { Button } from '@/components/ui/button'
import { getCurrentTab, isInternalPage } from '@/utils'
import { MESSAGES } from '@/consts'

export const Popup = () => {
  const [isAutofilling, setIsAutofilling] = useState(false)
  const [isDisabled, setIsDisabled] = useState(false)

  useLayoutEffect(() => {
    isInternalPage()
      .then((res) => setIsDisabled(res))
      .catch(() => setIsDisabled(false))
  }, [])

  const fillAllForms = async () => {
    try {
      const tab = await getCurrentTab()

      if (!tab.id) return null

      setIsAutofilling(true)

      const { INIT_AUTOFILL_ALL } = MESSAGES

      await chrome.tabs.sendMessage(tab.id, INIT_AUTOFILL_ALL)

      setIsAutofilling(false)
    } catch (err) {
      console.error(err)
      setIsAutofilling(false)
    }
  }

  return (
    <div className="relative w-[250px] h-[400px] bg-gray-100 p-4 box-border ">
      <div className="h-full w-full">
        <h1 className="text-xl font-semibold mb-4">FillMatic</h1>
        <div className="flex gap-2 items-center justify-center flex-col mt-4">
          <div className="flex flex-col justify-between h-full">
            <div className="flex flex-col gap-2">
              <Button onClick={fillAllForms} disabled={isDisabled || isAutofilling}>
                {isAutofilling ? 'Autofilling...' : 'Fill All Forms'}
              </Button>
            </div>
          </div>
        </div>
      </div>
      {isDisabled && (
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 relative rounded-lg" role="alert">
            <span className="block sm:inline">
              You are on an internal page. Please visit a website to use FillMatic.
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default Popup
