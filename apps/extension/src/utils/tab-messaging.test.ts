import { beforeEach, describe, expect, it } from 'vitest'

import { sendMessageToAllFrames } from './tab-messaging'

type AsyncMock<T> = {
  mockReset(): AsyncMock<T>
  mockResolvedValue(value: T): AsyncMock<T>
  mockResolvedValueOnce(value: T): AsyncMock<T>
  mockRejectedValueOnce(error: unknown): AsyncMock<T>
}

const framesMock = chrome.webNavigation.getAllFrames as unknown as AsyncMock<Array<
  Pick<chrome.webNavigation.GetAllFrameResultDetails, 'frameId'>
> | null>
const messageMock = chrome.tabs.sendMessage as unknown as AsyncMock<unknown>

describe('sendMessageToAllFrames', () => {
  beforeEach(() => {
    framesMock.mockReset()
    messageMock.mockReset()
  })

  it('targets each distinct registered frame and returns successful responses', async () => {
    framesMock.mockResolvedValue([{ frameId: 0 }, { frameId: 4 }, { frameId: 4 }])
    messageMock.mockResolvedValue({ type: 'AUTOFILL_COMPLETE' })

    const results = await sendMessageToAllFrames(7, { type: 'INIT_AUTOFILL_ALL' })

    expect(chrome.tabs.sendMessage).toHaveBeenCalledTimes(2)
    expect(chrome.tabs.sendMessage).toHaveBeenNthCalledWith(1, 7, { type: 'INIT_AUTOFILL_ALL' }, { frameId: 0 })
    expect(chrome.tabs.sendMessage).toHaveBeenNthCalledWith(2, 7, { type: 'INIT_AUTOFILL_ALL' }, { frameId: 4 })
    expect(results).toEqual([
      { frameId: 0, response: { type: 'AUTOFILL_COMPLETE' } },
      { frameId: 4, response: { type: 'AUTOFILL_COMPLETE' } },
    ])
  })

  it('keeps filling other frames when one frame disappears', async () => {
    framesMock.mockResolvedValue([{ frameId: 0 }, { frameId: 2 }])
    messageMock.mockResolvedValueOnce('top').mockRejectedValueOnce(new Error('The frame was removed'))

    await expect(sendMessageToAllFrames(7, { type: 'PING' })).resolves.toEqual([{ frameId: 0, response: 'top' }])
  })

  it('returns an empty result when Chrome reports no frames', async () => {
    framesMock.mockResolvedValue(null)

    await expect(sendMessageToAllFrames(7, { type: 'PING' })).resolves.toEqual([])
    expect(chrome.tabs.sendMessage).not.toHaveBeenCalled()
  })
})
