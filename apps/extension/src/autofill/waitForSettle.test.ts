import { afterEach, describe, expect, it } from 'vitest'

import { waitForSettle } from '@/autofill/waitForSettle'

afterEach(() => {
  document.body.innerHTML = ''
})

describe('waitForSettle', () => {
  it('resolves after quietMs when the subtree never mutates', async () => {
    const start = Date.now()
    await waitForSettle(document.body, { quietMs: 20, timeoutMs: 500 })
    expect(Date.now() - start).toBeLessThan(400)
  })

  it('waits for mutations to stop before resolving', async () => {
    let mutating = true
    const interval = setInterval(() => {
      if (mutating) document.body.appendChild(document.createElement('div'))
    }, 5)

    setTimeout(() => {
      mutating = false
      clearInterval(interval)
    }, 60)

    await waitForSettle(document.body, { quietMs: 25, timeoutMs: 1000 })

    // Must not have resolved while mutations were still happening.
    expect(mutating).toBe(false)
  })

  it('resolves at timeoutMs even when mutations never stop', async () => {
    const interval = setInterval(() => {
      document.body.appendChild(document.createElement('div'))
    }, 5)

    const start = Date.now()
    await waitForSettle(document.body, { quietMs: 25, timeoutMs: 100 })
    const elapsed = Date.now() - start

    clearInterval(interval)
    expect(elapsed).toBeLessThan(1000)
  })
})
