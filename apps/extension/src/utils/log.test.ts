import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.doUnmock('@/utils')
  vi.resetModules()
  vi.restoreAllMocks()
})

describe('log (isDev = true)', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.doMock('@/utils', () => ({ isDev: true }))
  })

  it('logs when onlyInDev is true (default) and isDev is true', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const { log } = await import('@/utils/log')

    log('hello')

    expect(logSpy).toHaveBeenCalled()
  })

  it('clientLog does not log when isDev is true', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const { clientLog } = await import('@/utils/log')

    clientLog('hello')

    expect(logSpy).not.toHaveBeenCalled()
  })
})

describe('log (isDev = false)', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.doMock('@/utils', () => ({ isDev: false }))
  })

  it('skips logging when onlyInDev is true (default) and isDev is false', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const { log } = await import('@/utils/log')

    log('hello')

    expect(logSpy).not.toHaveBeenCalled()
  })

  it('still logs when onlyInDev is explicitly false, regardless of isDev', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const { log } = await import('@/utils/log')

    log('hello', false)

    expect(logSpy).toHaveBeenCalled()
  })

  it('clientLog logs when isDev is false', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const { clientLog } = await import('@/utils/log')

    clientLog('hello')

    expect(logSpy).toHaveBeenCalled()
  })
})
