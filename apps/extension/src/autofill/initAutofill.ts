import { log } from '@/utils'
import { gatherVisibleInputsInOrder, fillElement } from '@/autofill'
import { Inputs } from '@/types'

async function autofillSequentially(inputs: Inputs[]) {
  for (const input of inputs) {
    await fillElement(input)
  }
}

export async function initiateAutofill() {
  const inputs = gatherVisibleInputsInOrder()

  log(`Found ${inputs.length} visible input elements`)

  await autofillSequentially(inputs)
}
