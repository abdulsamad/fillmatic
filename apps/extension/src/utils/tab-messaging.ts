export type FrameMessageResult<T> = {
  frameId: number
  response: T
}

/**
 * Sends one message to every frame Chrome has registered in a tab. Frames can
 * disappear during navigation, so individual delivery failures are ignored while
 * successful responses are retained for callers that need them.
 */
export const sendMessageToAllFrames = async <T = unknown>(
  tabId: number,
  message: unknown,
): Promise<FrameMessageResult<T>[]> => {
  const frames = (await chrome.webNavigation.getAllFrames({ tabId })) ?? []
  const frameIds = [...new Set(frames.map(({ frameId }) => frameId))]

  const results = await Promise.allSettled(
    frameIds.map(async (frameId) => ({
      frameId,
      response: (await chrome.tabs.sendMessage(tabId, message, { frameId })) as T,
    })),
  )

  return results
    .filter((result): result is PromiseFulfilledResult<FrameMessageResult<T>> => result.status === 'fulfilled')
    .map(({ value }) => value)
}
