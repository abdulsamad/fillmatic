import { useFieldArray, useFormContext } from 'react-hook-form'
import { PlusIcon, XIcon } from 'lucide-react'

import {
  Button,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@fillmatic/ui'

import { ATTRIBUTE_OPTIONS, OPERATOR_OPTIONS } from '@/utils/actions'

import { EMPTY_FIELD_TARGET } from './fieldTargets'

interface FieldTargetsEditorProps {
  /** The form path of the field-target array (e.g. "fields" or "rules"). */
  name: string
  label?: string
}

/**
 * Renders the attribute/operator/match/value rows editor for a field-target array.
 * Must be rendered inside a react-hook-form <FormProvider> (the shadcn <Form> wrapper).
 */
const FieldTargetsEditor = ({ name, label = 'Fields to fill' }: FieldTargetsEditorProps) => {
  const { control, formState } = useFormContext()
  const { fields, append, remove } = useFieldArray({ control, name })
  const rootError = (formState.errors as Record<string, { root?: { message?: string } }>)?.[name]?.root?.message

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">{label}</label>
        <Button type="button" variant="outline" size="sm" onClick={() => append({ ...EMPTY_FIELD_TARGET })}>
          <PlusIcon className="h-3.5 w-3.5 mr-1" /> Add field
        </Button>
      </div>
      <div className="grid grid-cols-[120px_110px_1fr_1fr_auto] gap-2 text-xs font-medium text-muted-foreground px-1">
        <span>Attribute</span><span>Operator</span><span>Match</span><span>Value to fill</span><span />
      </div>
      {fields.map((f, i) => (
        <div key={f.id} className="grid grid-cols-[120px_110px_1fr_1fr_auto] gap-2 items-start">
          <FormField
            control={control}
            name={`${name}.${i}.attribute`}
            render={({ field }) => (
              <FormItem>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {ATTRIBUTE_OPTIONS.map((a) => (
                      <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={`${name}.${i}.operator`}
            render={({ field }) => (
              <FormItem>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {OPERATOR_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={`${name}.${i}.match`}
            render={({ field }) => (
              <FormItem>
                <FormControl><Input placeholder="e.g. cardNumber" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={`${name}.${i}.value`}
            render={({ field }) => (
              <FormItem>
                <FormControl><Input placeholder="e.g. 4242424242424242" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-muted-foreground hover:text-destructive"
            onClick={() => remove(i)}
            disabled={fields.length === 1}
          >
            <XIcon className="h-4 w-4" />
          </Button>
        </div>
      ))}
      {rootError && <p className="text-xs text-destructive">{rootError}</p>}
    </div>
  )
}

export default FieldTargetsEditor
