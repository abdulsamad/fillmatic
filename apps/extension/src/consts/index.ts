import { type formSchemaType } from '@/components/Options/formSchema'

export enum MESSAGES {
  POPUP_OPENED = 'POPUP_OPENED',
  GET_FORMS = 'GET_FORMS',
  SCROLL_FORM_INTO_VIEW = 'SCROLL_FORM_INTO_VIEW',
  INIT_AUTOFILL_ALL = 'INIT_AUTOFILL_ALL',
  INIT_AUTOFILL_FORM = 'INIT_AUTOFILL_FORM',
  INIT_AUTOFILL_INPUT = 'INIT_AUTOFILL_INPUT',
  AUTOFILL_RUNNING = 'AUTOFILL_RUNNING',
  AUTOFILL_COMPLETE = 'AUTOFILL_COMPLETE',
  AUTOFILL_ERROR = 'AUTOFILL_ERROR',
}

export const DEFAULT_CONFIG: formSchemaType = {
  typingEffect: true,
  typingSpeed: 410,
  samePasswordEverytime: false,
  forceAutofill: false,
  commonPassword: 'pass@123',
  ignoredFields: 'captcha',
  tempEmailProvider: 'mailinator.com',
  alwaysCheckFields: 'terms, conditions, privacy, policy',
}

export const EXTENSION_ID = chrome.i18n.getMessage('@@extension_id')
