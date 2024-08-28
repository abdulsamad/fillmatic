import { isDev } from '@/utils'

const styles = `color: #0f0f0f; font-weight: 600; font-size: 12px;padding: 2px 12px; border-radius: 4px; background-color: #FBC02D`

export const log = (msg: string, onlyInDev = true, ...args: string[]) => {
  if (!isDev && onlyInDev) return

  console.log(`%c${msg}`, styles, ...args)
}

export const clientLog = (...logs: string[]) => {
  if (isDev) return

  console.log(`%cFormatic`, styles, ...logs)
}
