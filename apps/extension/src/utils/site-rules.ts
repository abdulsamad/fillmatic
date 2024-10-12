import { isDev } from '.'

export type MatcherType = 'hostname' | 'startsWith' | 'regex'

export type SiteRule = {
  name: string
  matcher: {
    type: MatcherType
    value: string
  }
  rules: Array<{
    match: string
    messageId: string
    name: string
    value: string
    action?: () => void
  }>
  // formFill?: {
  //   identifier: string
  //   fields: Record<string, string>
  //   submit?: boolean
  // }
}

const siteRules: SiteRule[] = [
  // {
  //   name: 'Fillmatic Demo',
  //   matcher: {
  //     type: 'startsWith',
  //     value: isDev ? 'http://localhost:3000' : 'https://fillmatic.pages.dev/demo/',
  //   },
  //   rules: [
  //     {
  //       match: 'text',
  //       name: 'Fill Specific Data',
  //       messageId: 'kmY6E',
  //       value: 'FillMatic Special Demo Data',
  //     },
  //   ],
  //   // formFill: {
  //   //   identifier: '#demo-form',
  //   //   fields: {
  //   //     name: 'John Doe',
  //   //     email: 'john@example.com',
  //   //     message: 'This is a demo message',
  //   //   },
  //   //   submit: true,
  //   // },
  // },
  {
    name: 'Stripe Actions',
    matcher: {
      type: 'startsWith',
      value: 'https://checkout.stripe.com/c/pay/cs_test',
    },
    rules: [
      {
        match: 'cardNumber',
        name: 'Fill Success Card',
        messageId: 'kmY6E',
        value: '4242424242424242',
      },
      {
        match: 'cardNumber',
        name: 'Fill Declined Card',
        messageId: 'LSZt3',
        value: '4000000000000002',
      },
    ],
  },
  {
    name: 'Lemon Squeezy Actions',
    matcher: {
      type: 'startsWith',
      value: 'https://abdulsamad.lemonsqueezy.com',
    },
    rules: [
      {
        match: 'Field-numberInput',
        name: 'Fill Success Card',
        messageId: 'kmY6F',
        value: '4242424242424242',
      },
      {
        match: 'Field-numberInput',
        name: 'Fill Declined Card',
        messageId: 'LSZtL',
        value: '4000000000000002',
      },
    ],
  },
]

export const getSiteRule = async (url: string): Promise<SiteRule | undefined> => {
  return siteRules.find((rule) => {
    switch (rule.matcher.type) {
      case 'hostname':
        return new URL(url).hostname === rule.matcher.value
      case 'startsWith':
        return url.startsWith(rule.matcher.value)
      case 'regex':
        return new RegExp(rule.matcher.value).test(url)
      default:
        return false
    }
  })
}

export const addSiteRule = (rule: SiteRule) => {
  siteRules.push(rule)
}

export const removeSiteRule = (index: number) => {
  siteRules.splice(index, 1)
}

export const updateSiteRule = (index: number, rule: SiteRule) => {
  siteRules[index] = rule
}

export const getAllSiteRules = () => siteRules
