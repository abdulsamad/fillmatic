import { describe, expect, it } from 'vitest'

import { applyInferences, fieldsFromSnapshot, hostnameOf, toFieldTargets, type MapperField } from '@/sidepanel/mapper'

const row = (target: Partial<MapperField['target']> = {}): MapperField => ({
  ref: 0,
  label: 'Email',
  kind: 'input:email',
  target: { attribute: 'id', operator: 'exact', match: 'email', value: '', valueStrategy: 'random', valueType: 'email', ...target },
})

describe('toFieldTargets', () => {
  it('drops rows without a matcher and exact rows without a value', () => {
    const random = row()
    const noMatch = row({ match: '' })
    const exactNoValue = row({ valueStrategy: 'exact', value: '' })
    const exactWithValue = row({ valueStrategy: 'exact', value: 'hi' })

    expect(toFieldTargets([random, noMatch, exactNoValue, exactWithValue])).toEqual([
      random.target,
      exactWithValue.target,
    ])
  })
})

describe('applyInferences', () => {
  it('merges suggestions by ref and leaves other rows untouched', () => {
    const fields = [row(), { ...row(), ref: 1 }]

    const result = applyInferences(fields, [{ ref: 1, valueType: 'phone', valueStrategy: 'random' }])

    expect(result[0].target.valueType).toBe('email')
    expect(result[1].target.valueType).toBe('phone')
  })
})

describe('fieldsFromSnapshot / hostnameOf', () => {
  it('turns snapshot targets into rows without live refs', () => {
    const [field] = fieldsFromSnapshot([{ attribute: 'name', operator: 'exact', match: 'city', value: 'Berlin' }])
    expect(field).toMatchObject({ ref: -1, label: 'city', kind: 'saved' })
  })

  it('extracts the hostname and falls back to the raw string', () => {
    expect(hostnameOf('https://app.example.com/x?y=1')).toBe('app.example.com')
    expect(hostnameOf('not a url')).toBe('not a url')
  })
})
