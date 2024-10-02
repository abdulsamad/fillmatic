import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { InfoIcon } from 'lucide-react'
import { toast } from 'sonner'
import { useShallow } from 'zustand/react/shallow'

import { useConfigStore } from '@/store/config'
import { DEFAULT_CONFIG } from '@/consts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Slider } from '@/components/ui/slider'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

import { formSchema, formSchemaType } from './formSchema'

const Index = () => {
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

  const form = useForm<formSchemaType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...config,
    },
  })

  const onSubmit = async (values: formSchemaType) => {
    console.log(values)
    saveConfig(values)
    toast.success('Settings saved successfully!')
  }

  const handleReset = async () => {
    form.reset(DEFAULT_CONFIG)
    Object.keys(DEFAULT_CONFIG).forEach((key) => {
      form.setValue(key as keyof formSchemaType, DEFAULT_CONFIG[key as keyof formSchemaType])
    })
    saveConfig(DEFAULT_CONFIG)
    toast.success('Settings reset to defaults!')
  }

  return (
    <>
      <Tabs defaultValue="general" className="mb-6">
        {/* <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="advanced">Experimental</TabsTrigger>
        </TabsList> */}

        <div className="my-8">
          <TabsContent value="general" className="space-y-10">
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
                            When enabled, AutoFill will simulate typing and related events (e.g., focus, input) for a
                            more natural experience. When disabled, values will be updated instantly, but will still
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

                {form.getValues().typingEffect && (
                  <FormField
                    control={form.control}
                    name="typingSpeed"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Typing Speed</FormLabel>
                        <FormControl>
                          <Slider
                            min={
                              formSchema.shape.typingSpeed._def.checks.find((check) => check.kind === 'min')?.value ??
                              40
                            }
                            max={
                              formSchema.shape.typingSpeed._def.checks.find((check) => check.kind === 'max')?.value ??
                              400
                            }
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
                          render={({ field: commonPasswordField }) => (
                            <FormItem>
                              <FormLabel className="text-slate-500">Enter Common Password</FormLabel>
                              <FormControl>
                                <Input
                                  type="text"
                                  placeholder="Enter default password"
                                  {...commonPasswordField}
                                  value={commonPasswordField.value || ''}
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select email provider" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
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
                          placeholder="Enter comma-separated values, e.g. Terms & Conditions, Newsletter, Privacy Policy"
                          className="w-full"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="italic">
                        Tip: You can add custom fields by typing them in, separated by commas. These fields will be
                        automatically checked when filling out forms.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-4 mt-12">
                  <Button type="button" variant="outline" size="sm" onClick={handleReset}>
                    Reset to Defaults
                  </Button>
                  <Button type="submit" size="sm">
                    Save Changes
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>

          {/* <TabsContent value="appearance" className="space-y-4">
            <div className="space-y-2">
              <Label>Theme</Label>
              <RadioGroup defaultValue="light">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="light" id="light" />
                  <Label htmlFor="light">Light</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="dark" id="dark" />
                  <Label htmlFor="dark">Dark</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="system" id="system" />
                  <Label htmlFor="system">System</Label>
                </div>
              </RadioGroup>
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="debugMode">Debug Mode</Label>
              <Switch id="debugMode" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notificationFrequency">Notification Frequency</Label>
              <Select>
                <SelectTrigger id="notificationFrequency">
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="realtime">Real-time</SelectItem>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input id="apiKey" type="password" placeholder="Enter your API key" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customEndpoint">Custom Endpoint</Label>
              <Input id="customEndpoint" placeholder="https://api.example.com" />
            </div>
          </TabsContent> */}
        </div>
      </Tabs>
    </>
  )
}

export default Index
