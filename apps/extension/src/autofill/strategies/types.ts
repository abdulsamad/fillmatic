/**
 * A fill strategy owns one class of fillable element (native inputs, contenteditable,
 * ARIA widgets). `fillElement` walks the registered strategies in order and hands the
 * element to the first one whose `canHandle` accepts it; a strategy may return `false`
 * from `fill` to signal it could not complete so the dispatcher falls through to the
 * next strategy instead of aborting the run.
 */
export interface FillStrategy {
  name: string
  canHandle(elem: Element): boolean
  fill(elem: Element): Promise<boolean>
}
