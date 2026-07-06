import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useTimeout } from '@/hooks/useTimeout'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useTimeout', () => {
  it('runs the callback after the given delay and marks isTimeoutActive', () => {
    const { result } = renderHook(() => useTimeout(500))
    const callback = vi.fn()

    act(() => {
      result.current.startDelay(callback)
    })

    expect(result.current.isTimeoutActive).toBe(true)
    expect(callback).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('cancels a pending timeout and resets isTimeoutActive', () => {
    const { result } = renderHook(() => useTimeout(500))
    const callback = vi.fn()

    act(() => {
      result.current.startDelay(callback)
    })
    act(() => {
      result.current.cancelDelay()
    })

    expect(result.current.isTimeoutActive).toBe(false)

    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(callback).not.toHaveBeenCalled()
  })

  it('cancelDelay is a no-op when no timeout is active', () => {
    const { result } = renderHook(() => useTimeout(500))

    expect(() => act(() => result.current.cancelDelay())).not.toThrow()
    expect(result.current.isTimeoutActive).toBe(false)
  })
})
