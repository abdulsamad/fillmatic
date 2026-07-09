import { useFieldArray, useFormContext, useWatch, type Control } from 'react-hook-form'
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

import { STEP_KIND_OPTIONS, type ActionStep } from '@/utils/actions'

import { EMPTY_ACTION_STEP } from './actionSteps'

const GRID_COLS = 'grid-cols-[130px_1fr_1fr_auto]'

/** Placeholder/config for the kind-specific third column. */
const EXTRA_FIELD: Record<ActionStep['kind'], { name: string; placeholder: string } | null> = {
  click: null,
  clickRandom: null,
  waitFor: { name: 'timeoutMs', placeholder: 'timeout ms (default 5000)' },
  type: { name: 'value', placeholder: 'text or {{faker.internet.email}}' },
  selectOption: { name: 'option', placeholder: 'option label' },
  press: { name: 'key', placeholder: 'e.g. Enter, Escape' },
}

interface ActionStepRowProps {
  control: Control
  name: string
  index: number
  onRemove: () => void
}

const ActionStepRow = ({ control, name, index, onRemove }: ActionStepRowProps) => {
  const kind: ActionStep['kind'] = useWatch({ control, name: `${name}.${index}.kind` }) ?? 'click'
  const extra = EXTRA_FIELD[kind]

  return (
    <div className={`grid ${GRID_COLS} gap-2 items-start`}>
      <FormField
        control={control}
        name={`${name}.${index}.kind`}
        render={({ field }) => (
          <FormItem>
            <Select value={field.value} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger><SelectValue /></SelectTrigger>
              </FormControl>
              <SelectContent>
                {STEP_KIND_OPTIONS.map((k) => (
                  <SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name={`${name}.${index}.selector`}
        render={({ field }) => (
          <FormItem>
            <FormControl><Input placeholder="CSS selector" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      {extra ? (
        <FormField
          control={control}
          name={`${name}.${index}.${extra.name}`}
          render={({ field }) => (
            <FormItem>
              <FormControl><Input placeholder={extra.placeholder} {...field} value={field.value ?? ''} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ) : (
        <span />
      )}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-9 w-9 text-muted-foreground hover:text-destructive"
        onClick={onRemove}
      >
        <XIcon className="h-4 w-4" />
      </Button>
    </div>
  )
}

interface ActionStepsEditorProps {
  /** The form path of the steps array (e.g. "steps"). */
  name: string
}

/**
 * Renders the declarative-steps editor for an Action (advanced, optional). Steps run
 * before the field fill — the escape hatch for widgets the built-in adapters miss.
 * Must be rendered inside a react-hook-form <FormProvider>.
 */
const ActionStepsEditor = ({ name }: ActionStepsEditorProps) => {
  const { control } = useFormContext()
  const { fields, append, remove } = useFieldArray({ control, name })

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-medium">Steps (advanced, optional)</label>
          <p className="text-xs text-muted-foreground">Run in order before the field fill. A failed step stops the rest.</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => append({ ...EMPTY_ACTION_STEP })}>
          <PlusIcon className="h-3.5 w-3.5 mr-1" /> Add step
        </Button>
      </div>
      {fields.length > 0 && (
        <div className={`grid ${GRID_COLS} gap-2 text-xs font-medium text-muted-foreground px-1`}>
          <span>Step</span><span>Selector</span><span>Details</span><span />
        </div>
      )}
      {fields.map((f, i) => (
        <ActionStepRow key={f.id} control={control} name={name} index={i} onRemove={() => remove(i)} />
      ))}
    </div>
  )
}

export default ActionStepsEditor
