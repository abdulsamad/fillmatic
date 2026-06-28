import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { InfoIcon, UserCircleIcon } from 'lucide-react'
import { toast } from 'sonner'
import { useShallow } from 'zustand/react/shallow'

import { useConfigStore } from '@/store/config'
import { useProfileStore, DEFAULT_PROFILE_ID } from '@/store/profiles'
import { DEFAULT_CONFIG } from '@/consts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Slider } from '@/components/ui/slider'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

import { formSchema, formSchemaType, TYPING_SPEED_MIN, TYPING_SPEED_MAX } from './formSchema'
import ProfilesTab from './ProfilesTab'
import FieldRulesTab from './FieldRulesTab'
import ActionsTab from './ActionsTab'

const ProfileBanner = ({ profileName, isDefault }: { profileName: string; isDefault: boolean }) =>
  isDefault ? (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/60 border text-xs text-muted-foreground">
      <InfoIcon className="h-3.5 w-3.5 shrink-0" />
      These are your <strong>default</strong> settings — used by all profiles unless overridden.
    </div>
  ) : (
    <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800">
      <UserCircleIcon className="h-4 w-4 shrink-0" />
      <span>
        Editing <strong>{profileName}</strong> profile — changes here will be saved to this profile and won't affect your default settings.
      </span>
    </div>
  )

const OptionsForm = () => {
  const saveConfig = useConfigStore((state) => state.saveConfig)
  const config = useConfigStore(
    useShallow(
      ({
        typingEffect,
        typingSpeed,
        samePasswordEverytime,
        forceAutofill,
        commonPassword,
        ignoredFields,
        tempEmailProvider,
        alwaysCheckFields,
      }) => ({
        typingEffect,
        typingSpeed,
        samePasswordEverytime,
        forceAutofill,
        commonPassword,
        ignoredFields,
        tempEmailProvider,
        alwaysCheckFields,
      }),
    ),
  )

  const { profiles, activeProfileId, updateProfile } = useProfileStore(
    useShallow(({ profiles, activeProfileId, updateProfile }) => ({ profiles, activeProfileId, updateProfile })),
  )
  const isDefaultActive = activeProfileId === DEFAULT_PROFILE_ID
  const activeProfile = profiles.find((p) => p.id === activeProfileId)

  // Merges General config with active profile's overrides — what the form shows and saves from
  const effectiveValues = (): formSchemaType => ({
    ...config,
    tempEmailProvider: (activeProfile?.tempEmailProvider ?? config.tempEmailProvider) as formSchemaType['tempEmailProvider'],
    samePasswordEverytime: activeProfile?.samePasswordEverytime ?? config.samePasswordEverytime,
    commonPassword: activeProfile?.commonPassword ?? config.commonPassword,
    ignoredFields: activeProfile?.ignoredFields ?? config.ignoredFields,
    alwaysCheckFields: activeProfile?.alwaysCheckFields ?? config.alwaysCheckFields,
  })

  const form = useForm<formSchemaType>({
    resolver: zodResolver(formSchema),
    defaultValues: effectiveValues(),
  })

  // Reset form when the active profile changes so the form reflects the new effective values
  useEffect(() => {
    form.reset(effectiveValues())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProfileId])

  const onSubmit = async (values: formSchemaType) => {
    if (isDefaultActive) {
      // Default profile: everything goes to General
      saveConfig(values)
    } else if (activeProfile) {
      // Custom profile active: non-overridable fields (typing, forceAutofill) → General only
      saveConfig({ ...config, typingEffect: values.typingEffect, typingSpeed: values.typingSpeed, forceAutofill: values.forceAutofill })
      // Overridable fields → profile only (General keeps its own independent values)
      updateProfile({
        ...activeProfile,
        tempEmailProvider: values.tempEmailProvider,
        samePasswordEverytime: values.samePasswordEverytime,
        commonPassword: values.commonPassword,
        ignoredFields: values.ignoredFields,
        alwaysCheckFields: values.alwaysCheckFields,
      })
    }
    toast.success('Settings saved!')
  }

  const handleReset = () => {
    form.reset(DEFAULT_CONFIG)
    saveConfig(DEFAULT_CONFIG)
    toast.success('Settings reset to defaults!')
  }

  return (
    <Tabs defaultValue="general" className="mb-6">
      <TabsList className="mb-8">
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="profiles">Profiles</TabsTrigger>
        <TabsTrigger value="field-rules">Field Rules</TabsTrigger>
        <TabsTrigger value="actions">Actions</TabsTrigger>
      </TabsList>

      <TabsContent value="general" className="space-y-10">
        <ProfileBanner profileName={activeProfile?.name ?? 'Default'} isDefault={isDefaultActive} />
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="typingEffect"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between">
                  <FormLabel className="flex items-center gap-2">
                    <span>Typing Effect</span>
                    <Tooltip>
                      <TooltipTrigger type="button">
                        <InfoIcon className="size-5" />
                      </TooltipTrigger>
                      <TooltipContent className="w-1/2 text-pretty">
                        When enabled, AutoFill will simulate typing and related events (e.g., focus, input, change)
                        for a more natural experience. When disabled, values will be updated instantly, but still
                        attempt to trigger a few events.
                      </TooltipContent>
                    </Tooltip>
                  </FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch('typingEffect') && (
              <FormField
                control={form.control}
                name="typingSpeed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Typing Speed</FormLabel>
                    <FormControl className="py-2">
                      <Slider
                        min={TYPING_SPEED_MIN}
                        max={TYPING_SPEED_MAX}
                        step={10}
                        value={[field.value]}
                        className="w-full"
                        onValueChange={(vals) => field.onChange(vals[0])}
                      />
                    </FormControl>
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>Slow</span>
                      <span>Fast</span>
                      <span>Fastest</span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="forceAutofill"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between">
                  <FormLabel className="flex items-center gap-2">
                    <span>Force AutoFill</span>
                    <Tooltip>
                      <TooltipTrigger type="button">
                        <InfoIcon className="size-5" />
                      </TooltipTrigger>
                      <TooltipContent className="w-1/2 text-pretty">
                        When enabled, AutoFill will overwrite existing values in form fields. This can be useful for
                        testing or when you want to update all fields, even if they already contain data.
                      </TooltipContent>
                    </Tooltip>
                  </FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="samePasswordEverytime"
              render={({ field }) => (
                <FormItem className="space-y-4">
                  <div className="flex items-center justify-between">
                    <FormLabel className="flex items-center gap-2">
                      <span>Use Common Password Everytime</span>
                      <Tooltip>
                        <TooltipTrigger type="button">
                          <InfoIcon className="size-5" />
                        </TooltipTrigger>
                        <TooltipContent className="w-1/2 text-pretty">
                          When enabled, the same password will be used for all password inputs, improving
                          consistency and ease of testing. When disabled, a unique password will be generated for
                          each form (logged to console).
                        </TooltipContent>
                      </Tooltip>
                    </FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </div>
                  {field.value && (
                    <FormField
                      control={form.control}
                      name="commonPassword"
                      render={({ field: cpField }) => (
                        <FormItem>
                          <FormLabel className="text-slate-500">Enter Common Password</FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              placeholder="Enter default password"
                              {...cpField}
                              value={cpField.value || ''}
                            />
                          </FormControl>
                          <FormDescription>This password will be used for all password inputs.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ignoredFields"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ignore Fields</FormLabel>
                  <FormControl>
                    <Input type="text" placeholder="Enter fields to ignore" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tempEmailProvider"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Provider</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select email provider" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="yopmail.com">YOPmail</SelectItem>
                      <SelectItem value="mailinator.com">Mailinator</SelectItem>
                      <SelectItem value="mailsac.com">mailsac</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="alwaysCheckFields"
              render={({ field }) => (
                <FormItem className="space-y-4">
                  <FormLabel>Always Check These Fields</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter comma-separated values, e.g. terms, newsletter, privacy policy"
                      className="w-full"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="italic">
                    These fields will be always be checked when filling out forms.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-4 mt-12">
              <Button type="button" variant="outline" size="sm" onClick={handleReset}>
                Reset to Defaults
              </Button>
              <Button type="submit" size="sm" disabled={!form.formState.isDirty}>
                Save Changes
              </Button>
            </div>
          </form>
        </Form>
      </TabsContent>

      <TabsContent value="profiles">
        <ProfilesTab />
      </TabsContent>

      <TabsContent value="field-rules">
        <FieldRulesTab />
      </TabsContent>

      <TabsContent value="actions">
        <ActionsTab />
      </TabsContent>
    </Tabs>
  )
}

export default OptionsForm
