import { log } from '@/utils'

const sampleFiles = {
  aac: 'sample.aac',
  csv: 'sample.csv',
  doc: 'sample.doc',
  docx: 'sample.docx',
  gif: 'sample.gif',
  html: 'sample.html',
  jpg: 'sample.jpg',
  mp3: 'sample.mp3',
  mp4: 'sample.mp4',
  pdf: 'sample.pdf',
  png: 'sample.png',
  txt: 'sample.txt',
}

export async function handleFileInput(input: HTMLInputElement) {
  const acceptTypes = input.accept ? input.accept.split(',') : []
  let file: File

  if (acceptTypes.length > 0) {
    file = await createFileByAcceptType(acceptTypes)
  } else {
    // Randomly choose between txt, jpg, and csv if no accept attribute is specified
    const defaultTypes = ['txt', 'jpg', 'csv']
    const randomType = defaultTypes[Math.floor(Math.random() * defaultTypes.length)]
    file = await createFileFromSample(randomType)
  }

  // Create a DataTransfer object and add the file
  const dataTransfer = new DataTransfer()
  dataTransfer.items.add(file)

  // Set the file input's files
  input.files = dataTransfer.files

  // Dispatch events
  const events = ['change', 'input', 'focus', 'blur']

  events.forEach((eventType) => {
    const event = new Event(eventType, { bubbles: true })
    input.dispatchEvent(event)
  })
}

const createFileByAcceptType = async (acceptTypes: string[]): Promise<File> => {
  const supportedTypes = Object.keys(sampleFiles)
  const matchingTypes = acceptTypes.flatMap((type) => {
    const fileType = getFileTypeFromAccept(type.trim().toLowerCase())
    return fileType && supportedTypes.includes(fileType) ? [fileType] : []
  })

  if (matchingTypes.length > 0) {
    const randomType = matchingTypes[Math.floor(Math.random() * matchingTypes.length)]
    return await createFileFromSample(randomType)
  }

  // If no matching types, choose a random supported type
  const randomType = supportedTypes[Math.floor(Math.random() * supportedTypes.length)]
  return await createFileFromSample(randomType)
}

const getFileTypeFromAccept = (acceptType: string): string | null => {
  const typeMap: { [key: string]: string } = {
    '.aac': 'aac',
    '.csv': 'csv',
    '.doc': 'doc',
    '.docx': 'docx',
    '.gif': 'gif',
    '.html': 'html',
    '.jpg': 'jpg',
    '.jpeg': 'jpg',
    '.mp3': 'mp3',
    '.mp4': 'mp4',
    '.pdf': 'pdf',
    '.png': 'png',
    '.txt': 'txt',
    'audio/aac': 'aac',
    'text/csv': 'csv',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'image/gif': 'gif',
    'text/html': 'html',
    'image/jpeg': 'jpg',
    'audio/mpeg': 'mp3',
    'video/mp4': 'mp4',
    'application/pdf': 'pdf',
    'image/png': 'png',
    'text/plain': 'txt',
    'image/*': 'jpg',
  }

  return typeMap[acceptType] || null
}

const createFileFromSample = async (fileType: string): Promise<File> => {
  const url = chrome.runtime.getURL(`/samples/${sampleFiles[fileType as keyof typeof sampleFiles]}`)
  const response = await fetch(url)
  const blob = await response.blob()
  return new File([blob], `sample.${fileType}`, { type: getMimeType(fileType) })
}

const getMimeType = (extension: string): string => {
  const mimeTypes: { [key: string]: string } = {
    aac: 'audio/aac',
    csv: 'text/csv',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    gif: 'image/gif',
    html: 'text/html',
    jpg: 'image/jpeg',
    mp3: 'audio/mpeg',
    mp4: 'video/mp4',
    pdf: 'application/pdf',
    png: 'image/png',
    txt: 'text/plain',
  }

  return mimeTypes[extension] || 'application/octet-stream'
}
