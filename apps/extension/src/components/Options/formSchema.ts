import { z } from 'zod'

export const formSchema = z.object({
  typingEffect: z.boolean(),
  typingSpeed: z
    .number()
    .min(40, { message: `Typing speed must be at least 40 characters per minute` })
    .max(800, { message: `Typing speed cannot exceed 400 characters per minute` }),
  forceAutofill: z.boolean(),
  samePasswordEverytime: z.boolean(),
  commonPassword: z
    .string()
    .min(8, { message: `Password must be at least 8 characters long` })
    .max(256, { message: `Password cannot exceed 256 characters` }),
  ignoredFields: z
    .string()
    .max(2000, { message: `Ignored fields cannot exceed 2000 characters` })
    .refine((value) => (value === '' ? true : value.split(`,`).every((field) => field.trim().length > 0)), {
      message: `Each ignored field must not be empty`,
    }),
  tempEmailProvider: z.enum([`mailinator.com`, `mailsac.com`, `yopmail.com`]),
  alwaysCheckFields: z
    .string()
    .max(2000, { message: `Always check fields cannot exceed 2000 characters` })
    .refine((value) => (value === '' ? true : value.split(`,`).every((field) => field.trim().length > 0)), {
      message: `Each "always check fields" must not be empty`,
    }),
})

export type formSchemaType = z.infer<typeof formSchema>
