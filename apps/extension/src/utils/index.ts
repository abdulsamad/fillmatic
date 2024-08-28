import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const isDev = import.meta.env.DEV

export * from './log'
export * from './getCurrentTab'
export * from './getName'
export * from './handleFileInput'
export * from './typeWithEffect'
export * from './gatherVisibleInputsInOrder'
export * from './autoFillElement'
export * from './initAutofill'
