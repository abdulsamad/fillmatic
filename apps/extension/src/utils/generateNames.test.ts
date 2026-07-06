import { afterEach, describe, expect, it, vi } from 'vitest'

import { generateNames } from '@/utils/generateNames'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('generateNames', () => {
  it('defaults to generating a single name when count is omitted', () => {
    const names = generateNames()

    expect(names).toHaveLength(1)
    expect(names[0]).toHaveProperty('firstName')
    expect(names[0]).toHaveProperty('lastName')
  })

  it('generates the requested count when no region cap is hit', () => {
    const names = generateNames(3)

    expect(names).toHaveLength(3)
  })

  it('only pulls names from the specified region', () => {
    const names = generateNames(2, 'spanish')
    const spanishFirstNames = ['Miguel', 'María', 'José', 'Carmen', 'Carlos', 'Isabella']
    const spanishLastNames = ['Hernández', 'García', 'Martínez', 'Rodríguez', 'González', 'López']

    for (const name of names) {
      expect(spanishFirstNames).toContain(name.firstName)
      expect(spanishLastNames).toContain(name.lastName)
    }
  })

  it('caps output at the region size and warns once the cap is hit for a specific region', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    // "spanish" has 6 first/last names, so requesting more than that should stop at 6.
    const names = generateNames(10, 'spanish')

    expect(names.length).toBeLessThanOrEqual(6)
    expect(warnSpy).toHaveBeenCalled()
  })

  it('does not cap output when no specific region is requested, even for a large count', () => {
    const names = generateNames(50)

    expect(names).toHaveLength(50)
  })
})
