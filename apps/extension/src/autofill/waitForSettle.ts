interface WaitForSettleOptions {
  /** How long the subtree must stay mutation-free before resolving. */
  quietMs?: number
  /** Hard cap — resolve unconditionally after this long. */
  timeoutMs?: number
}

/**
 * Resolves once `root`'s subtree has stopped mutating for `quietMs`, or after
 * `timeoutMs` regardless. The primitive async widget interactions build on: after
 * clicking a combobox/date-picker trigger, the portaled popover has finished
 * rendering when the DOM goes quiet.
 */
export const waitForSettle = (
  root: Node,
  { quietMs = 150, timeoutMs = 2000 }: WaitForSettleOptions = {},
): Promise<void> =>
  new Promise((resolve) => {
    let quietTimer: ReturnType<typeof setTimeout>

    const observer = new MutationObserver(() => {
      clearTimeout(quietTimer)
      quietTimer = setTimeout(finish, quietMs)
    })

    const hardTimer = setTimeout(() => finish(), timeoutMs)

    const finish = () => {
      observer.disconnect()
      clearTimeout(quietTimer)
      clearTimeout(hardTimer)
      resolve()
    }

    observer.observe(root, { childList: true, subtree: true, attributes: true })
    quietTimer = setTimeout(finish, quietMs)
  })
