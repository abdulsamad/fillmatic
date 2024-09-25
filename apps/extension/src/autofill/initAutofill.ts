import { log } from '@/utils'
import { gatherVisibleInputsInOrder, fillElement } from '@/autofill'
import { SupportedInputsType } from '@/types'

export const initiateAutofill = async (rootElement: Element | null = null) => {
  /* Inputs */
  let inputs = gatherVisibleInputsInOrder(rootElement)

  log(`Initially found ${inputs.length} visible input elements`)

  await autoFillInputsSequentially(inputs)

  // Check for any inputs that have mounted after focus (for eg: Stripe checkout form)
  const finalInputs = gatherVisibleInputsInOrder()
  const newInputs = finalInputs.filter((input) => !inputs.includes(input))

  if (newInputs.length > 0) await autoFillInputsSequentially(newInputs)

  /* Contenteditable */
  const contenteditableElements = document.querySelectorAll(`[contenteditable='true']`)

  await autoFillContenteditableSequentially(contenteditableElements)

  /* iframe */
  // const iframes = document.querySelectorAll('iframe')
  // const iframesWithForms = Array.from(iframes).filter((iframe) => {
  //   try {
  //     const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
  //     return iframeDoc && (iframeDoc.querySelector('input') !== null || iframeDoc.querySelector('form') !== null)
  //   } catch (e) {
  //     // If we can't access the iframe's content due to same-origin policy, ignore it
  //     return false
  //   }
  // })

  // console.log(iframesWithForms)

  // log(`Found ${iframesWithForms.length} iframes with input or form elements`)
}

const autoFillInputsSequentially = async (inputs: SupportedInputsType[]) => {
  for (const input of inputs) {
    await fillElement(input)
  }
}

const autoFillContenteditableSequentially = async (elems: NodeListOf<Element>) => {
  for (const elem of elems) {
    await fillElement(elem)
  }
}
