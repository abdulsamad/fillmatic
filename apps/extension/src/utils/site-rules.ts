import { SupportedInputsType } from '@/types'

type SiteRule = {
  matcher: (url: string) => boolean
  rules: {
    [key: string]: (element: SupportedInputsType) => string | boolean
  }
}

const siteRules: SiteRule[] = [
  {
    matcher: (url: string) => url.startsWith('https://checkout.stripe.com/c/pay/cs_test'),
    rules: {
      cardNumber: () => '4242424242424242',
    },
  },
]

export const getSiteRule = (url: string): SiteRule | undefined => {
  return siteRules.find((rule) => rule.matcher(url))
}
