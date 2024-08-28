import { log, gatherVisibleInputsInOrder, autofillElement } from '@/utils'

async function autofillSequentially(inputs: HTMLElement[]) {
  for (const input of inputs) {
    log('Autofilling element: ' + input)
    await autofillElement(input)
  }
}

export async function initiateAutofill() {
  log('Initiating autofill...')

  const inputs = gatherVisibleInputsInOrder()

  log(`Found ${inputs.length} visible input elements`)

  await autofillSequentially(inputs)

  log('Autofill complete')
}
