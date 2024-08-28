import { log, gatherVisibleInputsInOrder, autofillElement } from '@/utils'
import { Inputs } from '@/types'

async function autofillSequentially(inputs: Inputs[]) {
  for (const input of inputs) {
    await autofillElement(input)
  }
}

export async function initiateAutofill() {
  const inputs = gatherVisibleInputsInOrder()

  log(`Found ${inputs.length} visible input elements`)

  await autofillSequentially(inputs)
}
