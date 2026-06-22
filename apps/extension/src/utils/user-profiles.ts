import { type UserRule } from './user-rules'

export type Profile = {
  id: string
  name: string
  // Each field is optional — undefined means "inherit from General settings"
  tempEmailProvider?: string
  commonPassword?: string
  samePasswordEverytime?: boolean
  ignoredFields?: string
  alwaysCheckFields?: string
  // Per-profile field rules (same shape as global UserRule)
  rules?: UserRule[]
}
