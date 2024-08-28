const createFileByAcceptType = (acceptTypes: string[]): File => {
  for (const type of acceptTypes) {
    const trimmedType = type.trim().toLowerCase()

    console.log(acceptTypes)

    if (trimmedType === '.txt' || trimmedType === 'text/plain') {
      return createFile('txt', 'sample.txt', 'This is a sample text file.')
    } else if (trimmedType === '.pdf' || trimmedType === 'application/pdf') {
      return createFile('pdf', 'sample.pdf', '%PDF-1.5\n%������\n')
    } else if (
      trimmedType === '.jpg' ||
      trimmedType === '.jpeg' ||
      trimmedType === 'image/jpeg' ||
      trimmedType === 'image/*'
    ) {
      return createFile('jpg', 'sample.jpg', '\xFF\xD8\xFF\xE0\x00\x10JFIF\x00')
    } else if (trimmedType === '.png' || trimmedType === 'image/png') {
      return createFile('png', 'sample.png', '\x89PNG\r\n\x1A\n')
    } else if (
      trimmedType === '.docx' ||
      trimmedType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      return createFile('docx', 'sample.docx', 'PK\x03\x04')
    } else if (trimmedType === '.doc' || trimmedType === 'application/msword') {
      return createFile('doc', 'sample.doc', '\xD0\xCF\x11\xE0\xA1\xB1\x1A\xE1')
    }
  }

  // Default to txt if no matching type is found
  return createFile('txt', 'sample.txt', 'This is a sample text file.')
}

const createFile = (extension: string, name: string, content: string): File => {
  const blob = new Blob([content], { type: getMimeType(extension) })
  return new File([blob], name, { type: getMimeType(extension) })
}

const getMimeType = (extension: string): string => {
  switch (extension) {
    case 'txt':
      return 'text/plain'
    case 'pdf':
      return 'application/pdf'
    case 'jpg':
      return 'image/jpeg'
    case 'png':
      return 'image/png'
    case 'docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    case 'doc':
      return 'application/msword'
    default:
      return 'text/plain'
  }
}

export async function handleFileInput(input: HTMLInputElement) {
  const acceptTypes = input.accept ? input.accept.split(',') : []
  let file: File

  console.log('DEBUG index:', acceptTypes)

  if (acceptTypes.length > 0) {
    file = createFileByAcceptType(acceptTypes)
  } else {
    // Default to txt if no accept attribute is specified
    file = createFile('txt', 'sample.txt', 'This is a sample text file.')
  }

  // Create a DataTransfer object and add the file
  const dataTransfer = new DataTransfer()
  dataTransfer.items.add(file)

  // Set the file input's files
  input.files = dataTransfer.files

  // Dispatch a change event
  const event = new Event('change', { bubbles: true })
  input.dispatchEvent(event)

  console.log(`File "${file.name}" added to input`)
}
