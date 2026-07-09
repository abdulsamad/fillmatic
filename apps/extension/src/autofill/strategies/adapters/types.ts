/**
 * A widget adapter knows how to drive one family of custom components (Radix, MUI…).
 * `detect` is checked in registry order and the generic ARIA adapter (detect: always)
 * closes the list, so unknown libraries still get the standards-based flow.
 * `fill` returns false when the widget could not be driven — the field is skipped.
 */
export interface WidgetAdapter {
  name: string
  detect(elem: HTMLElement): boolean
  fill(elem: HTMLElement): Promise<boolean>
}
