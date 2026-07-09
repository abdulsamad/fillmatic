import { log } from '@/utils'

import { strategies } from './strategies'

interface IFillElement {
  elem: Element
}

/**
 * Fills a single element by dispatching to the first strategy that can handle it
 * (native inputs → contenteditable → ARIA widgets). A strategy returning `false`
 * falls through to the next one; errors are logged so one bad element never
 * aborts the surrounding autofill run.
 */
export const fillElement = async ({ elem }: IFillElement) => {
  try {
    for (const strategy of strategies) {
      if (!strategy.canHandle(elem)) continue

      const handled = await strategy.fill(elem)
      if (handled) return
    }
  } catch (err) {
    log(`Error in fillElement: ${err}`)
    console.error('Errored Element', elem)
  }
}
