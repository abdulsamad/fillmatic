import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { PlusIcon, Trash2Icon, GlobeIcon, UserCircleIcon } from 'lucide-react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  Input,
} from '@fillmatic/ui'

import { useProfileStore, DEFAULT_PROFILE_ID } from '@/store/profiles'
import { type UserRule } from '@/utils/user-rules'
import FieldTargetsEditor from './FieldTargetsEditor'
import { fieldTargetsSchema, EMPTY_FIELD_TARGET } from './fieldTargets'

const ruleSchema = z.object({
  siteMatcher: z.string().min(1, 'Site matcher is required'),
  rules: fieldTargetsSchema,
})

type RuleFormValues = z.infer<typeof ruleSchema>

const EMPTY_FORM: RuleFormValues = { siteMatcher: '', rules: [{ ...EMPTY_FIELD_TARGET }] }

interface RuleDialogProps {
  open: boolean
  onClose: () => void
  initial?: UserRule
  onSave: (rule: UserRule) => void
}

const RuleDialog = ({ open, onClose, initial, onSave }: RuleDialogProps) => {
  const form = useForm<RuleFormValues>({
    resolver: zodResolver(ruleSchema),
    defaultValues: initial ? { siteMatcher: initial.siteMatcher, rules: initial.rules } : EMPTY_FORM,
  })

  const onSubmit = (values: RuleFormValues) => {
    onSave({ id: initial?.id ?? crypto.randomUUID(), ...values })
    form.reset(EMPTY_FORM)
    onClose()
  }

  const handleClose = () => {
    form.reset(initial ? { siteMatcher: initial.siteMatcher, rules: initial.rules } : EMPTY_FORM)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? 'Edit site rule' : 'Add site rule'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="siteMatcher"
              render={({ field }) => (
                <FormItem>
                  <label className="text-sm font-medium">Site matcher <span className="text-destructive">*</span></label>
                  <FormControl>
                    <Input placeholder="e.g. checkout.myapp.com" {...field} />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    Matched against the page URL using <code>includes()</code>. Use a hostname or path fragment.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FieldTargetsEditor name="rules" label="Field rules" />

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
              <Button type="submit">{initial ? 'Save changes' : 'Add rule'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

const FieldRulesTab = () => {
  const { profiles, activeProfileId, updateProfile } = useProfileStore()
  const activeProfile = profiles.find((p) => p.id === activeProfileId)
  const profileRules = activeProfile?.rules ?? []
  const isDefault = activeProfileId === DEFAULT_PROFILE_ID

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<UserRule | undefined>(undefined)

  const openAdd = () => { setEditing(undefined); setDialogOpen(true) }
  const openEdit = (r: UserRule) => { setEditing(r); setDialogOpen(true) }

  const handleSave = (rule: UserRule) => {
    if (!activeProfile) return
    const existing = profileRules.find((r) => r.id === rule.id)
    const updatedRules = existing
      ? profileRules.map((r) => (r.id === rule.id ? rule : r))
      : [...profileRules, rule]
    updateProfile({ ...activeProfile, rules: updatedRules })
  }

  const handleDelete = (id: string) => {
    if (!activeProfile) return
    updateProfile({ ...activeProfile, rules: profileRules.filter((r) => r.id !== id) })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">Field rules</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            Override specific fields on matching sites with fixed values.
          </p>
        </div>
        <Button size="sm" onClick={openAdd}>
          <PlusIcon className="h-4 w-4 mr-1" /> Add rule
        </Button>
      </div>

      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/40 border text-sm">
        <UserCircleIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="text-muted-foreground">Rules for:</span>
        <span className="font-medium">{activeProfile?.name ?? 'Unknown'}</span>
        {isDefault && <Badge variant="secondary" className="text-xs font-normal py-0">Default</Badge>}
      </div>

      {profileRules.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg bg-muted/30">
          <GlobeIcon className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-sm font-medium">No field rules for this profile</p>
          <p className="text-xs text-muted-foreground mt-1">
            Add a rule to fill specific fields with fixed values on chosen sites.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {profileRules.map((rule) => (
            <div key={rule.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <GlobeIcon className="h-5 w-5 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{rule.siteMatcher}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {rule.rules.slice(0, 3).map((r, idx) => (
                      <Badge key={`${r.attribute}-${r.match}-${idx}`} variant="secondary" className="text-xs font-normal py-0">
                        {r.match} → {r.value}
                      </Badge>
                    ))}
                    {rule.rules.length > 3 && (
                      <Badge variant="secondary" className="text-xs font-normal py-0">
                        +{rule.rules.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 ml-2 shrink-0">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(rule)}>
                  <PlusIcon className="h-3.5 w-3.5 rotate-45" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive">
                      <Trash2Icon className="h-3.5 w-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete rule for "{rule.siteMatcher}"?</AlertDialogTitle>
                      <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(rule.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}

      <RuleDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        initial={editing}
        onSave={handleSave}
      />
    </div>
  )
}

export default FieldRulesTab
