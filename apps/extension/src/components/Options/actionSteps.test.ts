import { describe, expect, it } from 'vitest'

import { actionStepFormSchema, actionStepsToForm, formStepsToActionSteps } from '@/components/Options/actionSteps'

describe('actionStepFormSchema', () => {
  it('accepts each step kind with its required extras', () => {
    expect(actionStepFormSchema.safeParse({ kind: 'click', selector: '#a' }).success).toBe(true)
    expect(actionStepFormSchema.safeParse({ kind: 'waitFor', selector: '#a', timeoutMs: '3000' }).success).toBe(true)
    expect(actionStepFormSchema.safeParse({ kind: 'type', selector: '#a', value: 'hello' }).success).toBe(true)
    expect(actionStepFormSchema.safeParse({ kind: 'selectOption', selector: '#a', option: 'Chile' }).success).toBe(true)
    expect(actionStepFormSchema.safeParse({ kind: 'press', selector: '#a', key: 'Enter' }).success).toBe(true)
  })

  it('rejects a missing selector or missing kind-specific extra', () => {
    expect(actionStepFormSchema.safeParse({ kind: 'click', selector: '' }).success).toBe(false)
    expect(actionStepFormSchema.safeParse({ kind: 'type', selector: '#a', value: '' }).success).toBe(false)
    expect(actionStepFormSchema.safeParse({ kind: 'waitFor', selector: '#a', timeoutMs: 'abc' }).success).toBe(false)
  })
})

describe('form <-> ActionStep conversion', () => {
  it('converts timeoutMs between form string and stored number', () => {
    expect(formStepsToActionSteps([{ kind: 'waitFor', selector: '#a', timeoutMs: '2500' }])).toEqual([
      { kind: 'waitFor', selector: '#a', timeoutMs: 2500 },
    ])
    expect(formStepsToActionSteps([{ kind: 'waitFor', selector: '#a', timeoutMs: '' }])).toEqual([
      { kind: 'waitFor', selector: '#a', timeoutMs: undefined },
    ])
    expect(actionStepsToForm([{ kind: 'waitFor', selector: '#a', timeoutMs: 2500 }])).toEqual([
      { kind: 'waitFor', selector: '#a', timeoutMs: '2500' },
    ])
  })

  it('passes other kinds through unchanged and tolerates missing steps', () => {
    expect(formStepsToActionSteps([{ kind: 'click', selector: '#a' }])).toEqual([{ kind: 'click', selector: '#a' }])
    expect(actionStepsToForm(undefined)).toEqual([])
  })
})
