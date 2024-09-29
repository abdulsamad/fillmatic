import { useState, useCallback, useRef } from 'react'

export const useTimeout = (delay = 800) => {
  const [isTimeoutActive, setIsTimeoutActive] = useState(false)

  const delayRef = useRef<NodeJS.Timeout | null>(null)

  const startDelay = useCallback(
    (callback: any) => {
      delayRef.current = setTimeout(callback, delay)
      setIsTimeoutActive(true)
      return delayRef.current
    },
    [delay],
  )

  const cancelDelay = useCallback(() => {
    if (delayRef.current) {
      clearTimeout(delayRef.current)
      setIsTimeoutActive(false)
    }
  }, [])

  return { startDelay, cancelDelay, isTimeoutActive }
}
