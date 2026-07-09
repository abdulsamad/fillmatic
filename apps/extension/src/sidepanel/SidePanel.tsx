import { useEffect, useState } from 'react'
import { RadarIcon, SparklesIcon, Trash2Icon, WandSparklesIcon, XIcon } from 'lucide-react'

import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
} from '@fillmatic/ui'
import { PRODUCT_NAME } from '@fillmatic/config'

import { MESSAGES } from '@/consts'
import { useAiMappingsStore } from '@/store/ai-mappings'
import { getCurrentTab } from '@/utils'
import { can } from '@/utils/entitlements'
import { snapshotsForUrl, type MappingSnapshot } from '@/utils/ai-mappings'
import {
  ATTRIBUTE_OPTIONS,
  VALUE_STRATEGY_OPTIONS,
  VALUE_TYPE_OPTIONS,
  type FieldTarget,
} from '@/utils/actions'
import {
  getLocalModelAvailability,
  inferFieldMap,
  type LocalModelAvailability,
} from '@/utils/localModel'
import type { PageField } from '@/autofill/pageFields'

import {
  applyInferences,
  fieldsFromSnapshot,
  hostnameOf,
  prefillFromScan,
  toDescriptors,
  toFieldTargets,
  type MapperField,
} from './mapper'

const AI_STATUS_LABEL: Record<LocalModelAvailability | 'checking', string> = {
  checking: 'Checking on-device AI…',
  available: 'On-device AI ready',
  downloadable: 'On-device AI available to download',
  downloading: 'Downloading on-device AI…',
  unavailable: 'Heuristics only (on-device AI unavailable)',
}

const sendToActiveTab = async (payload: Record<string, unknown>) => {
  // getCurrentTab returns -1 when there is no active tab (typed as Tab by the
  // chrome overloads, hence the typeof check).
  const tab = await getCurrentTab()
  if (typeof tab === 'number' || !tab.id) return undefined

  try {
    return await chrome.tabs.sendMessage(tab.id, payload)
  } catch {
    // No content script on this page (chrome://, web store…) — nothing to map.
    return undefined
  }
}

interface FieldRowProps {
  field: MapperField
  onChange: (target: FieldTarget) => void
  onRemove: () => void
  onHover: (ref: number) => void
}

const FieldRow = ({ field, onChange, onRemove, onHover }: FieldRowProps) => {
  const strategy = field.target.valueStrategy ?? 'exact'

  return (
    <div
      className="rounded-md border p-2 space-y-2"
      onMouseEnter={() => field.ref >= 0 && onHover(field.ref)}
      onMouseLeave={() => onHover(-1)}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{field.label}</p>
          <p className="text-xs text-muted-foreground">{field.kind}</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
          aria-label={`Remove ${field.label}`}
          onClick={onRemove}
        >
          <XIcon className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Select
          value={field.target.attribute}
          onValueChange={(attribute) => onChange({ ...field.target, attribute: attribute as FieldTarget['attribute'] })}
        >
          <SelectTrigger className="h-8 text-xs" aria-label="Match attribute">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ATTRIBUTE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          className="h-8 text-xs"
          aria-label="Match value"
          placeholder="match"
          value={field.target.match}
          onChange={(e) => onChange({ ...field.target, match: e.target.value })}
        />
        <Select
          value={strategy}
          onValueChange={(valueStrategy) =>
            onChange({ ...field.target, valueStrategy: valueStrategy as FieldTarget['valueStrategy'] })
          }
        >
          <SelectTrigger className="h-8 text-xs" aria-label="Fill strategy">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {VALUE_STRATEGY_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {strategy === 'random' ? (
          <Select
            value={field.target.valueType ?? 'string'}
            onValueChange={(valueType) => onChange({ ...field.target, valueType: valueType as FieldTarget['valueType'] })}
          >
            <SelectTrigger className="h-8 text-xs" aria-label="Value type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VALUE_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            className="h-8 text-xs"
            aria-label="Exact value"
            placeholder="value to fill"
            value={field.target.value}
            onChange={(e) => onChange({ ...field.target, value: e.target.value })}
          />
        )}
      </div>
    </div>
  )
}

export const SidePanel = () => {
  const [aiStatus, setAiStatus] = useState<LocalModelAvailability | 'checking'>('checking')
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null)
  const [fields, setFields] = useState<MapperField[]>([])
  const [pageUrl, setPageUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [snapshotName, setSnapshotName] = useState('')

  const snapshots = useAiMappingsStore((s) => s.snapshots)
  const addSnapshot = useAiMappingsStore((s) => s.addSnapshot)
  const deleteSnapshot = useAiMappingsStore((s) => s.deleteSnapshot)

  useEffect(() => {
    getLocalModelAvailability().then(setAiStatus)
  }, [])

  if (!can('aiMapping')) {
    return <main className="p-4 text-sm text-muted-foreground">Field mapping is not part of your current plan.</main>
  }

  const highlight = (ref: number) => void sendToActiveTab({ type: MESSAGES.HIGHLIGHT_FIELD, ref })

  const scan = async () => {
    setBusy(true)
    try {
      const response = (await sendToActiveTab({ type: MESSAGES.GET_PAGE_FIELDS })) as
        | { fields: PageField[]; url: string }
        | undefined
      if (!response) return

      setPageUrl(response.url)

      // Heuristic prefill first — the panel is fully usable from this point.
      const prefilled = prefillFromScan(response.fields)
      setFields(prefilled)

      // AI is only an enhancement pass over the prefill.
      if (aiStatus === 'available' || aiStatus === 'downloadable') {
        if (aiStatus === 'downloadable') setAiStatus('downloading')

        const inferences = await inferFieldMap(toDescriptors(prefilled), setDownloadProgress)
        if (inferences.length > 0) setFields((current) => applyInferences(current, inferences))

        setDownloadProgress(null)
        setAiStatus(await getLocalModelAvailability())
      }
    } finally {
      setBusy(false)
    }
  }

  const fill = async () => {
    setBusy(true)
    try {
      await sendToActiveTab({ type: MESSAGES.APPLY_MAPPING, fields: toFieldTargets(fields) })
    } finally {
      setBusy(false)
    }
  }

  const saveSnapshot = () => {
    const siteMatcher = hostnameOf(pageUrl)
    addSnapshot({
      id: crypto.randomUUID(),
      name: snapshotName.trim() || siteMatcher,
      siteMatcher,
      createdAt: new Date().toISOString(),
      fields: toFieldTargets(fields),
    })
    setSnapshotName('')
  }

  const loadSnapshot = (snapshot: MappingSnapshot) => setFields(fieldsFromSnapshot(snapshot.fields))

  const siteSnapshots = pageUrl ? snapshotsForUrl(snapshots, pageUrl) : snapshots
  const fillableCount = toFieldTargets(fields).length

  return (
    <main className="p-3 space-y-3 text-sm">
      <header className="space-y-1">
        <h1 className="font-semibold">{PRODUCT_NAME} field mapper</h1>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <SparklesIcon className="h-3 w-3" />
          {AI_STATUS_LABEL[aiStatus]}
          {downloadProgress !== null && ` ${Math.round(downloadProgress * 100)}%`}
        </p>
      </header>

      <div className="flex gap-2">
        <Button size="sm" className="flex-1" disabled={busy} onClick={scan}>
          <RadarIcon className="h-4 w-4 mr-1" /> Scan page
        </Button>
        <Button size="sm" className="flex-1" variant="secondary" disabled={busy || fillableCount === 0} onClick={fill}>
          <WandSparklesIcon className="h-4 w-4 mr-1" /> Fill ({fillableCount})
        </Button>
      </div>

      {fields.length > 0 && (
        <>
          <div className="space-y-2">
            {fields.map((field, index) => (
              <FieldRow
                key={`${field.ref}-${index}`}
                field={field}
                onHover={highlight}
                onChange={(target) =>
                  setFields((current) => current.map((f, i) => (i === index ? { ...f, target } : f)))
                }
                onRemove={() => setFields((current) => current.filter((_, i) => i !== index))}
              />
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              className="h-8 text-xs flex-1"
              placeholder="Snapshot name"
              value={snapshotName}
              onChange={(e) => setSnapshotName(e.target.value)}
            />
            <Button size="sm" variant="outline" disabled={fillableCount === 0} onClick={saveSnapshot}>
              Save snapshot
            </Button>
          </div>
        </>
      )}

      {siteSnapshots.length > 0 && (
        <>
          <Separator />
          <section className="space-y-2">
            <h2 className="text-xs font-medium text-muted-foreground">Saved snapshots</h2>
            {siteSnapshots.map((snapshot) => (
              <div key={snapshot.id} className="flex items-center gap-2">
                <button type="button" className="flex-1 text-left text-xs hover:underline" onClick={() => loadSnapshot(snapshot)}>
                  {snapshot.name}
                  <span className="text-muted-foreground"> · {snapshot.fields.length} fields</span>
                </button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  aria-label={`Delete ${snapshot.name}`}
                  onClick={() => deleteSnapshot(snapshot.id)}
                >
                  <Trash2Icon className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </section>
        </>
      )}
    </main>
  )
}
