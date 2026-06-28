import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { PlusIcon, PencilIcon, Trash2Icon, UserCircleIcon, LockIcon } from 'lucide-react'

import { useProfileStore, DEFAULT_PROFILE_ID } from '@/store/profiles'
import { type Profile } from '@/utils/user-profiles'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form'
import { Badge } from '@/components/ui/badge'

const profileSchema = z.object({
  name: z.string().min(1, 'Profile name is required'),
})

type ProfileFormValues = z.infer<typeof profileSchema>

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

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: initial?.name ?? '' },
  })

  const onSubmit = (values: ProfileFormValues) => {
    if (initial) {
      updateProfile({ ...initial, name: values.name })
    } else {
      addProfile({ id: crypto.randomUUID(), name: values.name })
    }
    form.reset()
    onClose()
  }

  const handleClose = () => {
    form.reset({ name: initial?.name ?? '' })
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{initial ? 'Rename profile' : 'New profile'}</DialogTitle>
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
                    <Input placeholder="e.g. Work, Personal, Staging" autoFocus {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
              <Button type="submit">{initial ? 'Save' : 'Add profile'}</Button>
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
            Switch profiles to use different settings per environment. Edit settings for a profile by selecting it, then going to the General tab.
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
                    <p className="text-xs text-muted-foreground">Uses General settings. Select a custom profile to override them.</p>
                  ) : (
                    summary && <p className="text-xs text-muted-foreground truncate">{summary}</p>
                  )}
                </div>
              </button>

              <div className="flex items-center gap-1 ml-2 shrink-0">
                {!isDefault && (
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(profile)}>
                    <PencilIcon className="h-3.5 w-3.5" />
                  </Button>
                )}
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
