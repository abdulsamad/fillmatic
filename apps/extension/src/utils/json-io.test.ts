import { afterEach, describe, expect, it, vi } from 'vitest'

import { downloadJson, readJsonFile } from '@/utils/json-io'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('downloadJson', () => {
  it('creates an object URL, clicks a download link, then revokes the URL', () => {
    const createSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock')
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    downloadJson('recipes.json', [{ id: 'r-1' }])

    expect(createSpy).toHaveBeenCalledOnce()
    expect(clickSpy).toHaveBeenCalledOnce()
    expect(revokeSpy).toHaveBeenCalledWith('blob:mock')
  })
})

describe('readJsonFile', () => {
  it('parses a JSON file', async () => {
    const file = new File([JSON.stringify({ ok: true })], 'data.json', { type: 'application/json' })
    await expect(readJsonFile(file)).resolves.toEqual({ ok: true })
  })

  it('rejects on invalid JSON', async () => {
    const file = new File(['not json'], 'data.json', { type: 'application/json' })
    await expect(readJsonFile(file)).rejects.toThrow('not valid JSON')
  })
})
