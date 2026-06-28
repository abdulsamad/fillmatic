import { type FieldTarget } from '@/utils/actions'

export type UserRule = {
  id: string
  siteMatcher: string
  rules: FieldTarget[]
}
