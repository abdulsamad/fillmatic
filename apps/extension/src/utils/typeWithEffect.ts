export const typeWithEffect = (text: string, cb: (str: string) => void): Promise<void> => {
  return new Promise((resolve) => {
    const textArr = text.split('')
    const delay = 40

    textArr.forEach((str: string, index) => {
      const slice = textArr.slice(0, index + 1).join('')

      setTimeout(() => {
        cb(slice)

        if (textArr.length === index + 1) {
          resolve()
        }
      }, delay * index)
    })
  })
}
