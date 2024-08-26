import { useState } from 'react'

import { Button } from '@/components/ui/button'

export const SidePanel = () => {
  const [countSync, setCountSync] = useState(0)

  return (
    <div className="w-full h-screen bg-gray-100 p-4">
      <h1 className="text-xl font-semibold mb-4">Side Panel</h1>
      <p className="text-gray-700 mb-4">
        This is your side panel content. You can add more components as needed.
      </p>
      <div className="h-full flex gap-2 items-center justify-center flex-col">
        <div className="y-5 text-xl">{countSync}</div>
        <Button onClick={() => setCountSync((c) => c + 1)}>Click Me</Button>
      </div>
    </div>
  )
}

export default SidePanel
