import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { PlusIcon, PencilIcon, Trash2Icon, UserCircleIcon, LockIcon } from 'lucide-react'

import { useProfileStore, DEFAULT_PROFILE_ID } from '@/store/profiles'
import { useConfigStore } from '@/store/config'
import { type Profile } from '@/utils/user-profiles'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form'
import { Badge } from '@/components/ui/badge'

const EMAIL_PROVIDERS = [
  { value: 'yopmail.com', label: 'YOPmail' },
  { value: 'mailinator.com', label: 'Mailinator' },
  { value: 'mailsac.com', label: 'mailsac' },
]

const profileSchema = z.object({
  name: z.string().min(1, 'Profile name is required'),
  tempEmailProvider: z.string().optional(),
  commonPassword: z.string().optional(),
  samePasswordEverytime: z.enum(['inherit', 'true', 'false']).optional(),
  ignoredFields: z.string().optional(),
  alwaysCheckFields: z.string().optional(),
})

type ProfileFormValues = z.infer<typeof profileSchema>

const profileToForm = (p: Profile): ProfileFormValues => ({
  name: p.name,
  tempEmailProvider: p.tempEmailProvider ?? '',
  commonPassword: p.commonPassword ?? '',
  samePasswordEverytime:
    p.samePasswordEverytime === undefined ? 'inherit' : p.samePasswordEverytime ? 'true' : 'false',
  ignoredFields: p.ignoredFields ?? '',
  alwaysCheckFields: p.alwaysCheckFields ?? '',
})

const formToProfile = (id: string, values: ProfileFormValues): Profile => ({
  id,
  name: values.name,
  tempEmailProvider: values.tempEmailProvider || undefined,
  commonPassword: values.commonPassword || undefined,
  samePasswordEverytime:
    values.samePasswordEverytime === 'inherit' ? undefined : values.samePasswordEverytime === 'true',
  ignoredFields: values.ignoredFields || undefined,
  alwaysCheckFields: values.alwaysCheckFields || undefined,
})

const getProfileSummary = (p: Profile): string => {
  const parts: string[] = []
  if (p.tempEmailProvider) parts.push(p.tempEmailProvider)
  if (p.commonPassword) parts.push(`pw: ${p.commonPassword}`)
  if (p.samePasswordEverytime !== undefined) parts.push(p.samePasswordEverytime ? 'same pw' : 'random pw')
  if (p.ignoredFields) parts.push(`ignore: ${p.ignoredFields}`)
  return parts.join(' · ')
}

interface ProfileDialogProps {
  open: boolean
  onClose: () => void
  initial?: Profile
}

const ProfileDialog = ({ open, onClose, initial }: ProfileDialogProps) => {
  const { addProfile, updateProfile } = useProfileStore()
  const generalConfig = useConfigStore()

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: initial ? profileToForm(initial) : { name: '', samePasswordEverytime: 'inherit' },
  })

  const onSubmit = (values: ProfileFormValues) => {
    const id = initial?.id ?? crypto.randomUUID()
    const profile = formToProfile(id, values)
    if (initial) {
      updateProfile(profile)
    } else {
      addProfile(profile)
    }
    form.reset()
    onClose()
  }

  const handleClose = () => {
    form.reset(initial ? profileToForm(initial) : { name: '', samePasswordEverytime: 'inherit' })
    onClose()
  }

  const providerLabel = EMAIL_PROVIDERS.find((p) => p.value === generalConfig.tempEmailProvider)?.label ?? generalConfig.tempEmailProvider

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? 'Edit profile' : 'New profile'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Profile name <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Work, Personal, Staging" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tempEmailProvider"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email provider</FormLabel>
                  <Select value={field.value ?? ''} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={`Use General (${providerLabel})`} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">Use General ({providerLabel})</SelectItem>
                      {EMAIL_PROVIDERS.map((p) => (
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="samePasswordEverytime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password mode</FormLabel>
                  <Select value={field.value ?? 'inherit'} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="inherit">Use General setting</SelectItem>
                      <SelectItem value="true">Always use same password</SelectItem>
                      <SelectItem value="false">Always random password</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            {form.watch('samePasswordEverytime') === 'true' && (
              <FormField
                control={form.control}
                name="commonPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Common password</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder={generalConfig.commonPassword || 'Enter password'}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Leave empty to inherit from General.</FormDescription>
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="ignoredFields"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ignore fields</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={generalConfig.ignoredFields || 'Use General setting'}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Comma-separated. Overrides General when set.</FormDescription>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="alwaysCheckFields"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Always check fields</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={generalConfig.alwaysCheckFields || 'Use General setting'}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Comma-separated checkboxes to always tick. Overrides General when set.</FormDescription>
                </FormItem>
              )}
            />

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
              <Button type="submit">{initial ? 'Save changes' : 'Add profile'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

const ProfilesTab = () => {
  const { profiles, activeProfileId, setActiveProfile, deleteProfile } = useProfileStore()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Profile | undefined>(undefined)

  const openAdd = () => { setEditing(undefined); setDialogOpen(true) }
  const openEdit = (p: Profile) => { setEditing(p); setDialogOpen(true) }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">Profiles</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            Each profile overrides specific General settings. Ideal for switching between work, personal, or staging environments.
          </p>
        </div>
        <Button size="sm" onClick={openAdd}>
          <PlusIcon className="h-4 w-4 mr-1" /> Add profile
        </Button>
      </div>

      <div className="space-y-2">
        {profiles.map((profile) => {
          const isActive = profile.id === activeProfileId
          const summary = getProfileSummary(profile)
          const isDefault = profile.id === DEFAULT_PROFILE_ID

          return (
            <div
              key={profile.id}
              className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${isActive ? 'border-primary bg-primary/5' : 'hover:bg-muted/30'}`}
            >
              <button
                className="flex items-center gap-3 flex-1 text-left"
                onClick={() => setActiveProfile(isActive && !isDefault ? DEFAULT_PROFILE_ID : profile.id)}
              >
                <UserCircleIcon className={`h-8 w-8 shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">{profile.name}</span>
                    {isActive && <Badge variant="outline" className="text-xs text-primary border-primary/40 py-0">Active</Badge>}
                    {isDefault && (
                      <Badge variant="secondary" className="text-xs font-normal py-0 gap-1">
                        <LockIcon className="h-2.5 w-2.5" /> Default
                      </Badge>
                    )}
                  </div>
                  {isDefault && !summary ? (
                    <p className="text-xs text-muted-foreground">Uses General settings. Edit to override specific ones.</p>
                  ) : (
                    summary && <p className="text-xs text-muted-foreground truncate">{summary}</p>
                  )}
                </div>
              </button>
              <div className="flex items-center gap-1 ml-2 shrink-0">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(profile)}>
                  <PencilIcon className="h-3.5 w-3.5" />
                </Button>
                {!isDefault && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive">
                        <Trash2Icon className="h-3.5 w-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete "{profile.name}"?</AlertDialogTitle>
                        <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteProfile(profile.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <ProfileDialog open={dialogOpen} onClose={() => setDialogOpen(false)} initial={editing} />
    </div>
  )
}

export default ProfilesTab
