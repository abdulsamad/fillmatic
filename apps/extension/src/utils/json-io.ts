/** Downloads `data` as a pretty-printed JSON file via a temporary object URL. */
export const downloadJson = (filename: string, data: unknown) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()

  URL.revokeObjectURL(url)
}

/** Reads a user-picked file and parses it as JSON. Throws on unreadable/invalid input. */
export const readJsonFile = (file: File): Promise<unknown> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read the file'))
    reader.onload = () => {
      try {
        resolve(JSON.parse(reader.result as string))
      } catch {
        reject(new Error('The file is not valid JSON'))
      }
    }
    reader.readAsText(file)
  })
