import { faker } from '@faker-js/faker'

import { isContentEditable, isSupportedInput, log, setNativeValue, triggerEvent, typeWithEffect } from '@/utils'
import type { ActionStep } from '@/utils/actions'

import { waitForSettle } from './waitForSettle'
import { isElementVisible } from './gatherVisibleInputsInOrder'
import {
  clickLikeUser,
  findOpenedPopover,
  findOptionByText,
  getSelectableOptions,
  getVisiblePopovers,
  normalizeText,
  pressKey,
} from './strategies/adapters/helpers'

/**
 * Generators a `{{token}}` in a step's `type` value may resolve to. A whitelist map —
 * never eval — so recipes stay Chrome-Web-Store-safe. Unknown tokens are left as-is
 * to make typos visible in the filled output.
 */
const FAKER_TOKENS: Record<string, () => string> = {
  'faker.person.fullName': () => faker.person.fullName(),
  'faker.person.firstName': () => faker.person.firstName(),
  'faker.person.lastName': () => faker.person.lastName(),
  'faker.internet.email': () => faker.internet.email(),
  'faker.internet.username': () => faker.internet.username(),
  'faker.internet.url': () => faker.internet.url(),
  'faker.phone.number': () => faker.phone.number(),
  'faker.lorem.word': () => faker.lorem.word(),
  'faker.lorem.sentence': () => faker.lorem.sentence(),
  'faker.lorem.paragraph': () => faker.lorem.paragraph(),
  'faker.location.streetAddress': () => faker.location.streetAddress(),
  'faker.location.city': () => faker.location.city(),
  'faker.location.zipCode': () => faker.location.zipCode(),
  'faker.location.country': () => faker.location.country(),
  'faker.company.name': () => faker.company.name(),
  'faker.number.int': () => faker.number.int({ min: 1, max: 100 }).toString(),
  'faker.string.uuid': () => faker.string.uuid(),
  'faker.date.recent': () => faker.date.recent().toISOString().split('T')[0],
}

export const resolveTemplateTokens = (value: string): string =>
  value.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (raw, token: string) => FAKER_TOKENS[token]?.() ?? raw)

const DEFAULT_WAIT_FOR_TIMEOUT_MS = 5000

/** Polls (mutation-paced) until the selector matches a visible element or the timeout passes. */
const waitForSelector = async (selector: string, timeoutMs: number): Promise<Element | null> => {
  const deadline = Date.now() + timeoutMs

  for (;;) {
    const elem = document.querySelector(selector)
    if (elem && isElementVisible(elem)) return elem

    const remaining = deadline - Date.now()
    if (remaining <= 0) return null

    await waitForSettle(document.body, { quietMs: 100, timeoutMs: Math.min(500, remaining) })
  }
}

const selectNativeOption = (select: HTMLSelectElement, optionText: string): boolean => {
  const target = normalizeText(optionText)
  const option = Array.from(select.options).find(
    (o) => normalizeText(o.textContent) === target || normalizeText(o.value) === target,
  )
  if (!option) return false

  setNativeValue(select, option.value)
  triggerEvent(select, 'input')
  triggerEvent(select, 'change')
  return true
}

/** Opens the popover a trigger controls and clicks the option with the given label. Deterministic: no match = failure. */
const selectWidgetOption = async (trigger: HTMLElement, optionText: string): Promise<boolean> => {
  const popoversBefore = new Set<Element>(getVisiblePopovers())

  clickLikeUser(trigger)
  await waitForSettle(document.body, { quietMs: 120, timeoutMs: 1500 })

  const popover = findOpenedPopover(trigger, popoversBefore)
  if (!popover) return false

  const option = findOptionByText(getSelectableOptions(popover), optionText)
  if (!option) {
    pressKey(trigger, 'Escape')
    return false
  }

  clickLikeUser(option)
  return true
}

const runStep = async (step: ActionStep): Promise<boolean> => {
  switch (step.kind) {
    case 'waitFor':
      return (await waitForSelector(step.selector, step.timeoutMs ?? DEFAULT_WAIT_FOR_TIMEOUT_MS)) !== null

    case 'click': {
      const elem = document.querySelector(step.selector)
      if (!(elem instanceof HTMLElement)) return false
      clickLikeUser(elem)
      return true
    }

    case 'type': {
      const elem = document.querySelector(step.selector)
      if (!(elem instanceof HTMLElement) || !(isSupportedInput(elem) || isContentEditable(elem))) return false
      await typeWithEffect(resolveTemplateTokens(step.value), elem, true)
      return true
    }

    case 'selectOption': {
      const elem = document.querySelector(step.selector)
      if (!(elem instanceof HTMLElement)) return false
      if (elem instanceof HTMLSelectElement) return selectNativeOption(elem, step.option)
      return selectWidgetOption(elem, step.option)
    }

    case 'press': {
      const elem = document.querySelector(step.selector)
      if (!(elem instanceof HTMLElement)) return false
      pressKey(elem, step.key)
      return true
    }

    default:
      return false
  }
}

/**
 * Runs an Action's declarative steps in order. A failed step aborts the remaining
 * steps (a half-run recipe is worse than an aborted one) but never throws — the
 * surrounding message handler continues either way.
 */
export const runActionSteps = async (steps: ActionStep[]): Promise<boolean> => {
  for (const [index, step] of steps.entries()) {
    let ok = false
    try {
      ok = await runStep(step)
    } catch (err) {
      log(`Action step ${index + 1} (${step.kind}) threw: ${err}`)
    }

    if (!ok) {
      log(`Action step ${index + 1} (${step.kind}) failed — aborting remaining steps`)
      return false
    }
  }

  return true
}
