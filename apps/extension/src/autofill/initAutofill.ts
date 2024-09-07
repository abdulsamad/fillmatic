import { log } from '@/utils'
import { gatherVisibleInputsInOrder, fillElement } from '@/autofill'
import { Inputs } from '@/types'

async function autofillSequentially(inputs: Inputs[]) {
  for (const input of inputs) {
    await fillElement(input)
  }
}

export async function initiateAutofill() {
  let inputs = gatherVisibleInputsInOrder()

  log(`Initially found ${inputs.length} visible input elements`)

  await autofillSequentially(inputs)

  // Check for any inputs that have mounted after focus (for eg: Stripe checkout form)
  const finalInputs = gatherVisibleInputsInOrder()
  const newInputs = finalInputs.filter((input) => !inputs.includes(input))
  if (newInputs.length > 0) {
    await autofillSequentially(newInputs)
  }
}
