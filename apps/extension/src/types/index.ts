export type Inputs = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement

export type ExtensionCommands = 'AUTOFILL_ALL' | 'AUTOFILL_CURRENT_FORM' | 'AUTOFILL_CURRENT_INPUT'

export type Form = { name?: string; class?: string; id?: string; index: number }
