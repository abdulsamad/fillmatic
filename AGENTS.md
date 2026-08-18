# AGENTS.md

This file provides guidance to AI coding agents (Claude Code, and any AGENTS.md-aware tool) when working with code in this repository. `CLAUDE.md` is a symlink to this file.

## Project Overview

FillMatic is a Chrome extension that autofills forms with dummy data. It's a pnpm/turbo monorepo (`apps/*`, `packages/*`):

- `apps/extension` — the Chrome extension (React + Vite + `@crxjs/vite-plugin`)
- `apps/web` — the marketing/landing site (Astro + React, deployed to Cloudflare Pages)
- `packages/ui` — `@fillmatic/ui`, shared shadcn/ui component library used by both apps
- `packages/config` — `@fillmatic/config`, shared product identity constants used by both apps

## Commands

```bash
# Install dependencies
pnpm install

# Development
pnpm dev                  # run all workspaces
pnpm dev:extension        # run only the extension

# Build
pnpm build                # build all workspaces
pnpm build:extension      # build extension + zip to deploy/

# Lint & format
pnpm lint
pnpm format               # prettier over all .ts, .tsx, .md files

# Test (Vitest, per-workspace)
pnpm test                 # run all workspaces' test suites via turbo
pnpm --filter extension test:watch
pnpm --filter extension test:coverage    # writes coverage/coverage-summary.json
pnpm --filter extension coverage:badge   # regenerates coverage-badge.svg from that summary
pnpm test:e2e             # build extension, then run Playwright against the packaged MV3 extension

# Web app only
pnpm --filter web deploy  # build + deploy to Cloudflare Pages
```

Node `>=24.19.0 <25` is required. Package manager: `pnpm@11.22.0` — shared dependency versions (e.g. `typescript`) are pinned via the pnpm catalog in `pnpm-workspace.yaml`; use `catalog:` in workspace `package.json`s instead of repeating versions.

The extension build outputs to `apps/extension/build/`. The root `package:extension` script packages it as `deploy/fill-matic-v<version>.zip`; `pnpm build` and `pnpm build:extension` both invoke that script.

## Internal packages

### `@fillmatic/ui` (`packages/ui`)

Shared shadcn/ui component library (Radix primitives + Tailwind), consumed by both apps as `workspace:*`. Exports:

- `.` (`src/index.ts`) — all components/hooks, e.g. `import { Button, Form, Tabs } from '@fillmatic/ui'`
- `./styles.css` — the shared theme (`src/styles/theme.css`)
- `./tailwind-preset` — Tailwind v4 preset (`tailwind-preset.js`) each app's Tailwind config extends

When adding a new shadcn component, add it under `packages/ui/src/components/` and export it from `src/index.ts` rather than duplicating it inside an app.

### `@fillmatic/config` (`packages/config`)

Single source of truth for product identity/copy shared by the extension and the marketing site: `PRODUCT_NAME`, `PRODUCT_DESCRIPTION`, `SEO_DESCRIPTION`, `SUPPORT_EMAIL`, `CHROME_WEB_STORE_URL`, `LANDING_URL`, `DEMO_URL` / `DEMO_URL_DEV`. Used in the manifest, popup, options page, the built-in Demo Action, and the web app's layout/pages. Change product name/description/URLs here, not in the consuming apps.

## Extension Architecture

Manifest V3 extension with entry points wired in `src/manifest.ts`:

| Entry                     | Path                         | Role                                                                                                                                            |
| ------------------------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Popup                     | `src/popup/`                 | Main UI; sends fill messages to content script                                                                                                  |
| Options page              | `src/options/`               | Tabbed settings (`components/Options/Form.tsx`): General, Profiles, Field Rules, Actions, Recipes (flag-gated); saves to `chrome.storage.local` |
| Side panel                | `src/sidepanel/`             | AI field mapper: scan the page, edit the field map, fill, save snapshots                                                                        |
| Background service worker | `src/background/index.ts`    | Handles keyboard shortcuts, opens onboarding tab                                                                                                |
| Content script            | `src/contentScript/index.ts` | Receives messages, drives autofill on the page                                                                                                  |

All extension pages run permanently in **dark mode**: `class="dark"` on each entry HTML's `<html>` root activates the `.dark` palette in `@fillmatic/ui`'s `theme.css` (tuned to match the landing page — indigo-tinted `#0f0f18` background, indigo primary). The web app never applies the `dark` class. Prefer theme tokens (`text-muted-foreground`, `bg-card`…) over raw palette classes; any hardcoded light-only color needs a `dark:` variant.

### Autofill Flow

`contentScript` → `autofill/initAutofill.ts` → `autofill/fillElement.ts` → `autofill/generateValue.ts`

1. **`initiateAutofill`** runs in passes, sequentially: native inputs (gathered via `gatherVisibleInputsInOrder`, re-gathered after a `waitForSettle` to catch late-mounted fields like Stripe's), then the **user-recipe pass** (`autofill/recipes.ts`), then custom **widgets** (`gatherWidgetElements`), then **contenteditable hosts**.
2. **`fillElement`** dispatches each element to the first matching `FillStrategy` (`autofill/strategies/`): `native` → `contenteditable` → `widget`. A strategy returning `false` falls through to the next; a widget failure skips the field, never aborts the run.
   - **`native`** — value writes via native prototype setters + real event sequences (`typeWithEffect` / `triggerEvent`).
   - **`contenteditable`** — editor-aware (`getEditorKind` detects ProseMirror/Lexical/Slate/Quill/Trix): inserts text via `execCommand('insertText')` / cancelable `beforeinput` so the editor's document model stays in sync, instead of overwriting the DOM.
   - **`widget`** — drives ARIA widgets (comboboxes, date pickers, switches, sliders, radio groups) like a user: open, `waitForSettle` (MutationObserver quiet-period primitive), pick an option, confirm. Delegates to `WidgetAdapter`s in `strategies/adapters/` — `radixAdapter` first, generic `ariaAdapter` last (it accepts everything; add library-specific adapters above it). User recipes outrank all adapters.
3. **`generateValue`** applies rules in priority order:
   - **Active action** field overrides — when an Action button was clicked, `activeAction.fields` matched via `matchFieldTarget()` (see Actions below)
   - **Mapping snapshots** — saved side-panel field maps matching the URL (fill-time is model-free by design)
   - **Profile field rules** — the active profile's `rules` (`UserRule[]`, each a `siteMatcher` + `FieldTarget[]`), matched by URL then via `matchFieldTarget()`
   - `autocomplete` attribute tokens (W3C autocomplete spec)
   - Heuristic matching on element `name`, `id`, `placeholder`, `label`, `className` via `matchElement()`
   - Fallback to input `type`-based faker generation

`datetime-local` values must be formatted in local time (never via `toISOString()`, which can shift the calendar day). Week inputs require ISO week-year/week formatting, especially around New Year. Never log a user's configured reusable password or PIN; those values can be sensitive.

### Frame delivery

The manifest has the `webNavigation` permission and the content script is registered with `all_frames: true`. Popup actions and keyboard shortcuts use `utils/tab-messaging.ts#sendMessageToAllFrames()` to enumerate registered frame IDs and explicitly message each frame; individual frame delivery failures are expected during navigation and do not abort the fill. Regular full-page fills run in every supported frame. An Action runs in a child frame only when its `matchInIframe` flag is true—keep that opt-in, because payment/provider embeds should not be filled accidentally.

### Recipes (`src/utils/recipes.ts`, `src/autofill/recipes.ts`, `src/store/recipes.ts`)

User-taught widget interactions, managed in the Options **Recipes** tab (`components/Options/RecipesTab.tsx`, JSON import/export via `utils/json-io.ts`). A `Recipe` = URL `matcher` (empty value ⇒ everywhere) + CSS `selector` for the widget trigger + `ActionStep[]`. During a fill, `runRecipesPass` drives every visible match; elements it touched are tracked in a `WeakSet` so the widget strategy skips them. Recipes always outrank built-in adapters — the adapters are just editable defaults.

`ActionStep` (`utils/actions.ts`) is the shared declarative step model: `click` | `clickRandom` | `waitFor` | `type` | `selectOption` | `press`, edited via `components/Options/ActionStepsEditor.tsx`. `type` values may use whitelisted `{{faker.*}}` tokens (never eval — Web-Store-safe); recipe steps may target the matched element via `@self`. Steps run through `autofill/runActionSteps.ts`.

### Side panel AI mapper (`src/sidepanel/`, `src/autofill/pageFields.ts`, `src/utils/localModel.ts`)

Scans the page (`GET_PAGE_FIELDS` → serializable `PageField[]`), prefills a field map from heuristics (`mapper.ts#prefillFromScan`), then — only when Chrome's on-device Prompt API (Gemini Nano) is available — refines it via `utils/localModel.ts` (the single wrapper around all Prompt API surface; everything degrades to `'unavailable'` and callers must always work without it). The user edits rows (highlighting via `HIGHLIGHT_FIELD`), fills via `APPLY_MAPPING`, and can save the map as a `MappingSnapshot` (`utils/ai-mappings.ts`) — snapshots are plain `FieldTarget[]`s, so they fill deterministically on any machine with no model.

### State (Zustand stores in `src/store/`)

All persisted stores use the same `persist` + `createJSONStorage` adapter over `chrome.storage.local` (one key per store). Copy this pattern for any new persisted store.

- **`config.ts`** — general user settings (typing speed, common password, ignored fields, etc.). Defaults in `src/consts/index.ts`.
- **`profiles.ts`** — user profiles that override General settings, plus per-profile field `rules` (`UserRule[]`). `getEffectiveConfig()` merges the active profile over config; use it in the autofill pipeline instead of reading `config` directly.
- **`actions.ts`** — user-configurable Actions (see below), seeded with `DEFAULT_ACTIONS`.
- **`recipes.ts`** — user-defined `Recipe[]` (import replaces same-id entries, appends the rest).
- **`ai-mappings.ts`** — saved side-panel `MappingSnapshot[]`.
- **`content-script.ts`** — ephemeral per-fill state: generated first/last name (shared across fields), `lastGeneratedPassword` (for confirm-password fields), and `activeAction` (the action whose button was clicked, consumed by `generateValue`).
- **`popup.ts`** — popup UI state + `fillData()` action that sends Chrome messages (`INIT_AUTOFILL_*` and `ACTION_AUTOFILL_<id>`).
- **`user-rules.ts`** — a standalone `UserRule[]` store with the same persistence pattern; not currently wired into any UI (Field Rules are edited per-profile via `profiles.ts` instead). Present for a possible future global-rules feature.

### Actions (`src/utils/actions.ts`, `src/store/actions.ts`)

User-configurable one-click fill buttons, managed in the Options **Actions** tab (`components/Options/ActionsTab.tsx`) and rendered in the popup by `components/Popup/SpecialButtons.tsx` on matching URLs. Persisted to `chrome.storage.local`; the four built-in integrations (Stripe, Lemon Squeezy, Paddle, dev-only Demo) ship as **editable** `DEFAULT_ACTIONS` — there are no hardcoded site rules anymore.

- An `Action` = a URL `matcher` (`hostname` | `startsWith` | `endsWith` | `regex`), an optional `group` (popup section header), `active` flag, optional `matchInIframe`, optional `rootSelector` (scopes the fill to one element instead of the whole page), a list of `FieldTarget`s, and optional `steps` (`ActionStep[]`, run before the field fill; a steps-only action with `fields: []` skips the fill).
- A `FieldTarget` = `{ attribute, operator, match, value }` where `attribute` ∈ `id|name|placeholder|label|autocomplete` and `operator` ∈ `exact|contains|regex`. `matchFieldTarget(elem, field)` evaluates it. This type is shared by Actions and Field Rules.
- Clicking a button sends `ACTION_AUTOFILL_<actionId>`; the content script looks the action up by id via `getActionsFromStorage()`, stores it as `activeAction`, then runs a **full-form autofill** that overrides only the matched fields.
- Full-page fills and Actions enumerate frames through `utils/tab-messaging.ts` (`webNavigation` permission) and target each content script explicitly. Child-frame content scripts execute an Action only when its `matchInIframe` flag is enabled.
- **Field Rules share this model**: each profile's `rules` is a `UserRule[]` (`{ id, siteMatcher, rules: FieldTarget[] }`), edited via `components/Options/FieldRulesTab.tsx` and the shared `components/Options/FieldTargetsEditor.tsx` (schema/constants in `components/Options/fieldTargets.ts`).

### Feature flags & gating (`src/utils/featureFlags.ts`, `src/utils/entitlements.ts`)

Two distinct seams:

- **`featureFlags.ts`** — in-repo build-level flags (`aiMapping`, `recipes`, both on), checked via `isFeatureEnabled(flag)`. A flag gates whether a feature exists _at all_ in this build; flip it as a kill-switch without shipping a new build path.
- **`entitlements.ts`** — dormant seam for future login/pricing. `currentPlan` is hardcoded to `PREMIUM_PLAN` (all features, no limits). Gate via `can(feature)` and `withinLimit(resource, count)` — nothing is wired yet. When billing lands, swap `currentPlan` for a server-resolved value; consumers should only call the helpers. Check a flag first — a disabled feature has no entitlement to speak of.

### Path alias

`@` resolves to `apps/extension/src/` (configured in `vite.config.ts` and `vitest.config.ts`).

## Testing

Both apps use Vitest + Testing Library (`jsdom` environment). The extension has near-full coverage (`vitest.config.ts` enforces floors: 78% statements/lines, 65% branches, 82% functions via `@vitest/coverage-v8`) — treat those thresholds as a ratchet, don't lower them. Bootstrap/type-only files (`manifest.ts`, `global.d.ts`, `types/index.ts`, `autofill/index.ts`, page entry points, `utils/user-rules.ts`, `utils/user-profiles.ts`) are excluded from coverage. `pnpm --filter extension test:coverage` followed by `coverage:badge` regenerates `apps/extension/coverage-badge.svg` (self-generated, no third-party badge service).

`pnpm test:e2e` builds the production extension and runs four Playwright scenarios against it, including a frame-heavy page with React-controlled, late-mounted, Radix, rich-text, shadow-DOM, and iframe fields. Run it for changes to manifest permissions, message delivery, the content script, or fill strategies; unit tests alone will not catch packaging/runtime regressions.

## Git authorship

When the agent materially authors a change and creates the commit, include a Co-authored-by trailer for the agent when a valid agent identity is available. Use the repository's existing authorship convention when one exists.
Do not add an agent co-author trailer to commits whose code was not materially authored by the agent, or when the user explicitly says not to add one.

## Releases

Current release: **v0.2.0** (2026-08-16). Use SemVer: a backwards-compatible user-facing capability is a minor bump; a bug, privacy, or generation correction is a patch bump. The release version is defined **only** in the root `package.json`; `src/manifest.ts` imports it directly, and a pushed release tag must be exactly `v<package-version>`.

Releases are tag-driven. After updating the root version and `CHANGELOG.md`, run:

```bash
pnpm lint
pnpm --filter extension test:coverage
pnpm test:e2e
pnpm build
git tag -a v<version> -m "v<version>"
git push origin main v<version>
```

The annotated tag starts `.github/workflows/deploy.yml`: it installs from the frozen lockfile, runs extension unit and real-browser tests, verifies that the tag matches `package.json`, builds `deploy/fill-matic-v<version>.zip`, retains it as a GitHub artifact for 7 days, then uploads and publishes it with `chrome-webstore-upload-cli`. Publishing needs the five `CHROME_WEB_STORE_*` secrets documented in `docs/RELEASING.md`. Watch the workflow and then verify the Chrome Web Store listing and public demo using the installed store build.

The release workflow is intentionally tag-only: do not add `workflow_dispatch`, because it bypasses the tag/version guard and would still attempt a Web Store publish. The trigger listens to every tag; non-version tags fail the version guard but still start CI. Chrome Web Store versions are monotonic—rollback means a fixed follow-up patch with a higher version, never republishing an older build.

## Web App (`apps/web`)

Static Astro site. Pages: `/` (landing), `/demo`, `/privacy`. Deployed to Cloudflare Pages — `wrangler.toml` configures the deployment; no Cloudflare bindings are active. Product copy (name, SEO description, support email, store/demo URLs) comes from `@fillmatic/config`, not hardcoded strings.

Preview locally: `pnpm --filter web preview` (builds + runs via wrangler pages dev on port 3000).
