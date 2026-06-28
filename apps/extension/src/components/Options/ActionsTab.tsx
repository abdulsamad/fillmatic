import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { PlusIcon, PencilIcon, Trash2Icon, ZapIcon, GlobeIcon, LockIcon } from 'lucide-react'

import { useActionsStore } from '@/store/actions'
import { type Action } from '@/utils/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Badge } from '@/components/ui/badge'
import FieldTargetsEditor from './FieldTargetsEditor'
import { fieldTargetsSchema, EMPTY_FIELD_TARGET } from './fieldTargets'

const MATCHER_TYPES = [
  { value: 'startsWith', label: 'URL starts with' },
  { value: 'hostname', label: 'Hostname equals' },
  { value: 'endsWith', label: 'URL ends with' },
  { value: 'regex', label: 'URL matches regex' },
] as const

const actionSchema = z.object({
  name: z.string().min(1, 'Button label is required'),
  group: z.string().optional(),
  matcherType: z.enum(['startsWith', 'hostname', 'endsWith', 'regex']),
  matcherValue: z.string().min(1, 'Matcher value is required'),
  active: z.boolean(),
  matchInIframe: z.boolean(),
  fields: fieldTargetsSchema,
})

type ActionFormValues = z.infer<typeof actionSchema>

const EMPTY_FORM: ActionFormValues = {
  name: '',
  group: '',
  matcherType: 'startsWith',
  matcherValue: '',
  active: true,
  matchInIframe: false,
  fields: [{ ...EMPTY_FIELD_TARGET }],
}

const actionToForm = (a: Action): ActionFormValues => ({
  name: a.name,
  group: a.group ?? '',
  matcherType: a.matcher.type,
  matcherValue: a.matcher.value,
  active: a.active,
  matchInIframe: a.matchInIframe ?? false,
  fields: a.fields.length ? a.fields : [{ ...EMPTY_FIELD_TARGET }],
})

const formToAction = (id: string, values: ActionFormValues): Action => ({
  id,
  name: values.name,
  group: values.group?.trim() || undefined,
  matcher: { type: values.matcherType, value: values.matcherValue },
  active: values.active,
  matchInIframe: values.matchInIframe || undefined,
  fields: values.fields,
})

interface ActionDialogProps {
  open: boolean
  onClose: () => void
  initial?: Action
}

const ActionDialog = ({ open, onClose, initial }: ActionDialogProps) => {
  const { addAction, updateAction } = useActionsStore()

  const form = useForm<ActionFormValues>({
    resolver: zodResolver(actionSchema),
    defaultValues: initial ? actionToForm(initial) : EMPTY_FORM,
  })

  const onSubmit = (values: ActionFormValues) => {
    const id = initial?.id ?? crypto.randomUUID()
    const action = formToAction(id, values)
    if (initial) {
      updateAction(action)
    } else {
      addAction(action)
    }
    form.reset(EMPTY_FORM)
    onClose()
  }

  const handleClose = () => {
    form.reset(initial ? actionToForm(initial) : EMPTY_FORM)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? 'Edit action' : 'New action'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Button label <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Fill Success Card" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="group"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Group</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Stripe (optional)" {...field} />
                    </FormControl>
                    <FormDescription>Buttons sharing a group are listed together.</FormDescription>
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-[180px_1fr] gap-3">
              <FormField
                control={form.control}
                name="matcherType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Match by</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MATCHER_TYPES.map((m) => (
                          <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="matcherValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Value <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. https://checkout.stripe.com/c/pay/cs_test" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex items-center gap-6">
              <FormField
                control={form.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="!mt-0">Active</FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="matchInIframe"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="!mt-0">Match in iframe</FormLabel>
                  </FormItem>
                )}
              />
            </div>

            <FieldTargetsEditor name="fields" />

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
              <Button type="submit">{initial ? 'Save changes' : 'Add action'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

const matcherSummary = (a: Action): string => {
  const labels: Record<Action['matcher']['type'], string> = {
    startsWith: 'starts with',
    hostname: 'host',
    endsWith: 'ends with',
    regex: 'regex',
  }
  return `${labels[a.matcher.type]}: ${a.matcher.value}`
}

const isDefaultAction = (a: Action) => a.id.startsWith('default-')

const ActionsTab = () => {
  const { actions, deleteAction } = useActionsStore()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Action | undefined>(undefined)

  const openAdd = () => { setEditing(undefined); setDialogOpen(true) }
  const openEdit = (a: Action) => { setEditing(a); setDialogOpen(true) }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">Actions</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            One-click buttons shown in the popup on matching URLs. Each runs a full autofill and overrides the fields you target with fixed values.
          </p>
        </div>
        <Button size="sm" onClick={openAdd}>
          <PlusIcon className="h-4 w-4 mr-1" /> Add action
        </Button>
      </div>

      {actions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg bg-muted/30">
          <ZapIcon className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-sm font-medium">No actions yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Add an action to show a one-click fill button on a matching site.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {actions.map((action) => {
            const locked = isDefaultAction(action)
            return (
            <div
              key={action.id}
              className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${action.active ? '' : 'opacity-60'} ${locked ? 'bg-muted/30' : 'hover:bg-muted/30'}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <ZapIcon className="h-5 w-5 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">{action.name}</span>
                    {action.group && (
                      <Badge variant="secondary" className="text-xs font-normal py-0">{action.group}</Badge>
                    )}
                    {!action.active && (
                      <Badge variant="outline" className="text-xs font-normal py-0">Disabled</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                    <GlobeIcon className="h-3 w-3 shrink-0" /> {matcherSummary(action)} · {action.fields.length} field{action.fields.length === 1 ? '' : 's'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 ml-2 shrink-0">
                {locked ? (
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground cursor-default" disabled>
                    <LockIcon className="h-3.5 w-3.5" />
                  </Button>
                ) : (
                  <>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(action)}>
                      <PencilIcon className="h-3.5 w-3.5" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive">
                          <Trash2Icon className="h-3.5 w-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete "{action.name}"?</AlertDialogTitle>
                          <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteAction(action.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                )}
              </div>
            </div>
            )
          })}
        </div>
      )}

      <ActionDialog open={dialogOpen} onClose={() => setDialogOpen(false)} initial={editing} />
    </div>
  )
}

export default ActionsTab
