import { SupportedInputsType } from '@/types'
import { log } from '@/utils'

import { gatherVisibleInputsInOrder, fillElement } from '.'

interface IinitiateAutofill {
  rootElement: Element | null
}

export const initiateAutofill = async ({ rootElement }: IinitiateAutofill) => {
  /* Inputs */
  const inputs = gatherVisibleInputsInOrder(rootElement)

  log(`Initially found ${inputs.length} visible input elements`)

  await autoFillInputsSequentially({ inputs })

  // Check for any inputs that have mounted after focus (for eg: Stripe checkout form)
  const finalInputs = gatherVisibleInputsInOrder(rootElement)
  const newInputs = finalInputs.filter((input) => !inputs.includes(input))

  if (newInputs.length > 0) await autoFillInputsSequentially({ inputs: newInputs })

  /* Contenteditable */
  const contenteditableElements = document.querySelectorAll(`[contenteditable='true']`)

  await autoFillContenteditableSequentially({ elems: contenteditableElements })

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

interface IautoFillInputsSequentially {
  inputs: SupportedInputsType[]
}

const autoFillInputsSequentially = async ({ inputs }: IautoFillInputsSequentially) => {
  for (const input of inputs) {
    await fillElement({ elem: input })
  }
}

interface IautoFillContenteditableSequentially {
  elems: NodeListOf<Element>
}

const autoFillContenteditableSequentially = async ({ elems }: IautoFillContenteditableSequentially) => {
  for (const elem of elems) {
    await fillElement({ elem })
  }
}
