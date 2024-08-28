import { DEFAULT_CONFIG } from '@/consts'

export const typeWithEffect = (
  text: string,
  cb: (str: string) => void,
  typeEffect = true,
): Promise<void> => {
  return new Promise((resolve) => {
    if (typeEffect) {
      const textArr = text.split('')
      textArr.forEach((str: string, index) => {
        const slice = textArr.slice(0, index + 1).join('')
        setTimeout(() => {
          cb(slice)
          if (textArr.length === index + 1) {
            resolve()
          }
        }, DEFAULT_CONFIG.typeEffectSpeed * index)
      })

      return
    }

    cb(text)
    resolve()
  })
}
