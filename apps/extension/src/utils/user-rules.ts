import { SupportedInputsType } from '@/types'

export type UserRule = {
  siteMatcher: string
  rules: {
    [key: string]: string | ((element: SupportedInputsType) => string | boolean)
  }
}

// This would be stored in the user's settings and loaded here
export const userRules: UserRule[] = []

export const getUserRule = (url: string): UserRule | undefined => {
  return userRules.find((rule) => new RegExp(rule.siteMatcher).test(url))
}
