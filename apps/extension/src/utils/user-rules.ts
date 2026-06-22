export type UserRuleEntry = {
  fieldPattern: string
  value: string
}

export type UserRule = {
  id: string
  siteMatcher: string
  rules: UserRuleEntry[]
}
