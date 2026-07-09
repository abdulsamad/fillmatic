import { afterEach, describe, expect, it, vi } from 'vitest'

import { getLocalModelAvailability, inferFieldMap, type FieldDescriptor } from '@/utils/localModel'

type GlobalWithModel = { LanguageModel?: unknown }

const setLanguageModel = (value: unknown) => {
  ;(globalThis as GlobalWithModel).LanguageModel = value
}

afterEach(() => {
  delete (globalThis as GlobalWithModel).LanguageModel
})

const FIELDS: FieldDescriptor[] = [{ ref: 0, label: 'Email address', kind: 'input:email' }]

describe('getLocalModelAvailability', () => {
  it('reports unavailable when the Prompt API is missing', async () => {
    await expect(getLocalModelAvailability()).resolves.toBe('unavailable')
  })

  it('passes through the API availability state', async () => {
    setLanguageModel({ availability: vi.fn().mockResolvedValue('downloadable') })
    await expect(getLocalModelAvailability()).resolves.toBe('downloadable')
  })

  it('reports unavailable when the availability call throws', async () => {
    setLanguageModel({ availability: vi.fn().mockRejectedValue(new Error('nope')) })
    await expect(getLocalModelAvailability()).resolves.toBe('unavailable')
  })
})

describe('inferFieldMap', () => {
  it('returns [] when the model is missing or there is nothing to infer', async () => {
    await expect(inferFieldMap(FIELDS)).resolves.toEqual([])

    setLanguageModel({ create: vi.fn() })
    await expect(inferFieldMap([])).resolves.toEqual([])
  })

  it('prompts with a JSON-schema constraint and returns valid suggestions', async () => {
    const prompt = vi.fn().mockResolvedValue(
      JSON.stringify({
        fields: [
          { ref: 0, valueType: 'email', valueStrategy: 'random' },
          { ref: 1, valueType: 'not-a-type', valueStrategy: 'random' }, // dropped
          { valueType: 'email', valueStrategy: 'random' }, // no ref -> dropped
        ],
      }),
    )
    const destroy = vi.fn()
    setLanguageModel({ create: vi.fn().mockResolvedValue({ prompt, destroy }) })

    const result = await inferFieldMap(FIELDS)

    expect(result).toEqual([{ ref: 0, valueType: 'email', valueStrategy: 'random' }])
    expect(prompt).toHaveBeenCalledWith(JSON.stringify(FIELDS), {
      responseConstraint: expect.objectContaining({ type: 'object' }),
    })
    expect(destroy).toHaveBeenCalled()
  })

  it('reports download progress through the monitor', async () => {
    const listeners: ((e: { loaded: number }) => void)[] = []
    setLanguageModel({
      create: vi.fn().mockImplementation(async (options) => {
        options?.monitor?.({
          addEventListener: (_type: string, listener: (e: { loaded: number }) => void) => listeners.push(listener),
        })
        return { prompt: vi.fn().mockResolvedValue('{"fields":[]}') }
      }),
    })

    const onProgress = vi.fn()
    await inferFieldMap(FIELDS, onProgress)
    listeners.forEach((l) => l({ loaded: 0.5 }))

    expect(onProgress).toHaveBeenCalledWith(0.5)
  })

  it('returns [] when the model responds with malformed JSON or the session throws', async () => {
    setLanguageModel({ create: vi.fn().mockResolvedValue({ prompt: vi.fn().mockResolvedValue('not json') }) })
    await expect(inferFieldMap(FIELDS)).resolves.toEqual([])

    setLanguageModel({ create: vi.fn().mockRejectedValue(new Error('boom')) })
    await expect(inferFieldMap(FIELDS)).resolves.toEqual([])
  })
})
