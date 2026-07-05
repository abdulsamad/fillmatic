import { useState } from 'react'

import { Toaster, TooltipProvider } from '@fillmatic/ui'

import OptionsForm from '@/components/Options/Form'

export const Options = () => {
  const [isLoggedIn] = useState(false)

  return (
    <TooltipProvider>
      <div className="container mx-auto p-4 max-w-3xl">
        <div className="my-5">
          <h1 className="text-3xl font-bold mb-6 text-center">FillMatic - Options</h1>
        </div>

        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-semibold">Welcome, {isLoggedIn ? '' : 'User'}</h2>
        </div>
        <div>
          <OptionsForm />
        </div>
      </div>
      <Toaster richColors theme="light" position="bottom-left" />
    </TooltipProvider>
  )
}

export default Options
