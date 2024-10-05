import { SupportedInputsType } from '@/types'

export type Profile = {
  name: string
  rules: {
    [key: string]: string | ((element: SupportedInputsType) => string | boolean)
  }
}

// This would be stored in the user's settings and loaded here
export const profiles: Profile[] = [
  {
    name: 'Personal',
    rules: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
    },
  },
  {
    name: 'Work',
    rules: {
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@company.com',
    },
  },
]

export const getProfile = (name: string): Profile | undefined => {
  return profiles.find((profile) => profile.name === name)
}
