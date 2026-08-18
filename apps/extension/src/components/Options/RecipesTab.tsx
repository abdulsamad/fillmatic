import { useRef, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { toast } from 'sonner'
import { DownloadIcon, GlobeIcon, PencilIcon, PlusIcon, Trash2Icon, UploadIcon, WandIcon } from 'lucide-react'

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
  DialogHeader,
  DialogTitle,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
} from '@fillmatic/ui'

import { useRecipesStore } from '@/store/recipes'
import { type Recipe } from '@/utils/recipes'
import { downloadJson, readJsonFile } from '@/utils/json-io'
import ActionStepsEditor from './ActionStepsEditor'
import { actionStepsFormSchema, actionStepsToForm, formStepsToActionSteps } from './actionSteps'

const MATCHER_TYPES = [
  { value: 'startsWith', label: 'URL starts with' },
  { value: 'hostname', label: 'Hostname is' },
  { value: 'endsWith', label: 'URL ends with' },
  { value: 'regex', label: 'URL matches regex' },
] as const

const recipeSchema = z.object({
  name: z.string().min(1, 'Recipe name is required'),
  matcherType: z.enum(['startsWith', 'hostname', 'endsWith', 'regex']),
  matcherValue: z.string(),
  selector: z.string().min(1, 'Widget selector is required'),
  active: z.boolean(),
  steps: actionStepsFormSchema.min(1, 'Add at least one step'),
})

type RecipeFormValues = z.infer<typeof recipeSchema>

const EMPTY_FORM: RecipeFormValues = {
  name: '',
  matcherType: 'hostname',
  matcherValue: '',
  selector: '',
  active: true,
  steps: [{ kind: 'click', selector: '@self' }],
}

const recipeToForm = (r: Recipe): RecipeFormValues => ({
  name: r.name,
  matcherType: r.matcher.type,
  matcherValue: r.matcher.value,
  selector: r.selector,
  active: r.active,
  steps: actionStepsToForm(r.steps),
})

const formToRecipe = (id: string, values: RecipeFormValues): Recipe => ({
  id,
  name: values.name,
  matcher: { type: values.matcherType, value: values.matcherValue.trim() },
  selector: values.selector.trim(),
  active: values.active,
  steps: formStepsToActionSteps(values.steps),
})

/** Structural check for imported data — enough to keep garbage out of the store. */
const isRecipeLike = (value: unknown): value is Recipe => {
  const r = value as Recipe
  return (
    typeof r?.id === 'string' &&
    typeof r?.name === 'string' &&
    typeof r?.selector === 'string' &&
    typeof r?.matcher?.type === 'string' &&
    Array.isArray(r?.steps)
  )
}

interface RecipeDialogProps {
  open: boolean
  onClose: () => void
  initial?: Recipe
}

const RecipeDialog = ({ open, onClose, initial }: RecipeDialogProps) => {
  const { addRecipe, updateRecipe } = useRecipesStore()

  const form = useForm<RecipeFormValues>({
    resolver: zodResolver(recipeSchema),
    values: initial ? recipeToForm(initial) : EMPTY_FORM,
  })

  const onSubmit = (values: RecipeFormValues) => {
    const recipe = formToRecipe(initial?.id ?? crypto.randomUUID(), values)
    if (initial) {
      updateRecipe(recipe)
    } else {
      addRecipe(recipe)
    }
    toast.success(initial ? 'Recipe updated' : 'Recipe added')
    handleClose()
  }

  const handleClose = () => {
    form.reset(EMPTY_FORM)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? 'Edit recipe' : 'Add recipe'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Booking calendar" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-[180px_1fr] gap-2">
              <FormField
                control={form.control}
                name="matcherType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Applies on</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MATCHER_TYPES.map((m) => (
                          <SelectItem key={m.value} value={m.value}>
                            {m.label}
                          </SelectItem>
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
                    <FormLabel>Site (empty = every site)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. app.example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="selector"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Widget selector</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. .datepicker-trigger" {...field} />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    Every visible element matching this selector is driven by the steps below. Use <code>@self</code> as
                    a step selector to target the matched element itself.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

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

            <ActionStepsEditor name="steps" />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit">{initial ? 'Save changes' : 'Add recipe'}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

const matcherSummary = (r: Recipe): string => {
  if (!r.matcher.value) return 'every site'
  const labels: Record<Recipe['matcher']['type'], string> = {
    startsWith: 'starts with',
    hostname: 'host',
    endsWith: 'ends with',
    regex: 'regex',
  }
  return `${labels[r.matcher.type]}: ${r.matcher.value}`
}

const RecipesTab = () => {
  const { recipes, deleteRecipe, importRecipes } = useRecipesStore()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Recipe | undefined>(undefined)
  const importInputRef = useRef<HTMLInputElement>(null)

  const openAdd = () => {
    setEditing(undefined)
    setDialogOpen(true)
  }
  const openEdit = (r: Recipe) => {
    setEditing(r)
    setDialogOpen(true)
  }

  const onImportFile = async (file: File | undefined) => {
    if (!file) return
    try {
      const data = await readJsonFile(file)
      const imported = (Array.isArray(data) ? data : []).filter(isRecipeLike)
      if (imported.length === 0) {
        toast.error('No recipes found in that file')
        return
      }
      importRecipes(imported)
      toast.success(`Imported ${imported.length} recipe${imported.length === 1 ? '' : 's'}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Import failed')
    } finally {
      if (importInputRef.current) importInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold">Recipes</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            Teach FillMatic how to fill any custom input — regardless of framework — with a selector and a few steps
            (e.g. click a calendar trigger, then click a random day). Recipes run during every autofill on matching
            sites and take priority over the built-in widget support.
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <input
            ref={importInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            aria-label="Import recipes file"
            onChange={(e) => onImportFile(e.target.files?.[0])}
          />
          <Button variant="outline" size="sm" onClick={() => importInputRef.current?.click()}>
            <UploadIcon className="h-3.5 w-3.5 mr-1" /> Import
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={recipes.length === 0}
            onClick={() => downloadJson('fillmatic-recipes.json', recipes)}
          >
            <DownloadIcon className="h-3.5 w-3.5 mr-1" /> Export
          </Button>
          <Button size="sm" onClick={openAdd}>
            <PlusIcon className="h-4 w-4 mr-1" /> Add recipe
          </Button>
        </div>
      </div>

      {recipes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg bg-muted/30">
          <WandIcon className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-sm font-medium">No recipes yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Add a recipe to drive a custom widget the built-in autofill can't handle.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {recipes.map((recipe) => (
            <div
              key={recipe.id}
              className={`flex items-center justify-between p-3 rounded-lg border transition-colors hover:bg-muted/30 ${recipe.active ? '' : 'opacity-60'}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <WandIcon className="h-5 w-5 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">{recipe.name}</span>
                    {!recipe.active && (
                      <Badge variant="outline" className="text-xs font-normal py-0">
                        Disabled
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                    <GlobeIcon className="h-3 w-3 shrink-0" /> {matcherSummary(recipe)} · <code>{recipe.selector}</code>{' '}
                    · {recipe.steps.length} step{recipe.steps.length === 1 ? '' : 's'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 ml-2 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  aria-label={`Edit ${recipe.name}`}
                  onClick={() => openEdit(recipe)}
                >
                  <PencilIcon className="h-3.5 w-3.5" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      aria-label={`Delete ${recipe.name}`}
                    >
                      <Trash2Icon className="h-3.5 w-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete "{recipe.name}"?</AlertDialogTitle>
                      <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteRecipe(recipe.id)}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}

      <RecipeDialog open={dialogOpen} onClose={() => setDialogOpen(false)} initial={editing} />
    </div>
  )
}

export default RecipesTab
