import { isDev } from '@/utils'

export const log = (msg: string, onlyInDev = true) => {
  if (!isDev && onlyInDev) return

  console.log(
    `%c${msg}`,
    `color: #0f0f0f; font-weight: 600; font-size: 12px;padding: 2px 12px; border-radius: 4px; background-color: #FBC02D`,
  )
}
