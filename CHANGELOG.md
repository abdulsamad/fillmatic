## Changelog  
All notable changes to this project will be documented in this file.  
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

### [v0.0.9] - 2026-06-29

#### Added
- **feat:** Identity profiles — create named profiles (Work, Personal, Staging, etc.) that override specific General settings. Each profile can set its own email provider, password mode, common password, ignored fields, and always-check fields. The Default profile (non-deletable, locked) inherits all General settings.
- **feat:** Per-profile field rules — define site-specific field overrides (e.g. fill `promo_code` with `SAVE20` on `checkout.myapp.com`) scoped to the active profile. Rules are managed in the new Field Rules tab and stored within the profile.
- **feat:** Profile selector in the popup — a compact selector bar lets you switch the active profile without opening Options. Switching takes effect on the next fill.
- **feat:** General tab profile banner — shows which profile is active and where changes will save. Default profile shows a muted "default settings" note; custom profiles show an amber banner with the profile name.
- **feat:** User-configurable Actions — replaces the old hardcoded Stripe / Lemon Squeezy / Paddle integrations with a fully user-editable Actions system. Each Action has a URL matcher, an optional popup group label, and a list of FieldTargets. The four built-in integrations ship as read-only defaults. Manage actions in the new **Actions** tab in Options; matching buttons appear in the popup on the right sites.
- **feat:** Shared FieldTarget model — Actions and Field Rules both use the same `{ attribute, operator, match, value }` schema (attribute ∈ `id|name|placeholder|label|autocomplete`, operator ∈ `exact|contains|regex`). A shared `FieldTargetsEditor` component handles the CRUD UI for both.
- **feat:** Entitlements seam (`src/utils/entitlements.ts`) — dormant feature-gating helpers (`can(feature)`, `withinLimit(resource, count)`) backed by a hardcoded Premium plan. Nothing is restricted yet; the seam is ready for when login/billing lands.
- **feat:** DEV badge on extension icon — in development builds a red "DEV" badge is shown on the extension icon via `chrome.action.setBadgeText`; tree-shaken away in production so nothing ships to the Web Store.
- **feat:** Redesigned landing page — new sections: integrations strip, Core Features (4-up), Power Features (asymmetric grid with Actions, Profiles, Field Rules), "Everything you get, free" checklist, and Payment Integrations callout. Header now includes a CTA button and the hero links to the `/demo` page.

#### Changed
- **refactor:** `generateValue.ts` now calls `getEffectiveConfig()` (merges General config with active profile overrides) instead of reading directly from the config store — profile settings take priority in the autofill pipeline.
- **refactor:** Options page reorganised into four tabs: General, Profiles, Field Rules, and Actions.
- **refactor:** Field Rules fully migrated to the explicit FieldTarget model (attribute × operator × match × value) — no more fuzzy heuristic matching for user-defined rules.
- **refactor:** Removed `src/utils/site-rules.ts`; hardcoded site matchers deleted in favour of editable DEFAULT_ACTIONS.
- **refactor:** Default profile is now locked (no rename, no delete); a disabled lock icon is shown in its row for visual consistency with locked default Actions.
- **refactor:** Default Actions are read-only (locked); a disabled lock icon replaces the edit/delete buttons. Users can still add custom actions freely.
- **refactor:** Profile delete confirmation now explicitly warns that the profile's settings and field rules will be permanently deleted.
- **refactor:** Demo Action renamed to "Fill Demo Form" / "FillMatic Demo"; prod matcher updated to `https://fillmatic.pages.dev/demo` (no trailing slash ambiguity).

#### Fixed
- **fix:** React / Vue controlled inputs now correctly trigger `onChange` — fills use native prototype setters (`Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set`) to bypass framework value trackers so the dispatched `input` event is seen as a real change.
- **fix:** Real DOM `focus({ preventScroll: true })` and `blur()` are now called around every fill in addition to synthetic focus/blur events, so framework listeners keyed off actual focus state fire correctly.
- **fix:** `<select>` elements are now set once via `setNativeValue` + `triggerEvent` instead of being char-typed through `typeWithEffect`.
- **fix:** `contenteditable` elements now route through `typeWithEffect` (using `textContent`) so `input` events fire — previously the value was assigned directly with no events.
- **fix:** Unknown `autocomplete` tokens (not in the W3C spec switch) now fall through to `handleDefaultInputs` instead of returning `undefined` and skipping the field.
- **fix:** Keyboard events in `typeWithEffect` now set `{ bubbles: true }` and a `beforeinput` `InputEvent` is dispatched before each value assignment, matching the real browser typing sequence.
- **fix:** User-supplied strings in `ignoredFields` / `alwaysCheckFields` containing regex-special characters (e.g. `c++`, `price($)`) are now escaped before use in `matchElement`, preventing a `SyntaxError` from silently breaking autofill on the page.

---

### [v0.0.8] - 2026-06-22

#### Fixed
- **fix:** Confirm password field was always missing the last character. Root cause: `HTMLInputElement.maxLength` returns `-1` when unset, and `-1` is truthy in JS, so `slice(0, -1)` silently dropped the final character on every confirm/reenter field without an explicit `maxlength` attribute.

#### Added
- **feat:** Redesigned landing page — features grid, "How it works" steps, and feedback form. Removed coming-soon feel.
- **chore:** ESLint v9 flat config set up for both `apps/extension` and `apps/web`. All lint errors and warnings resolved.

#### Changed
- **refactor:** Upgraded all dependencies across the monorepo — React 18 → 19, TypeScript 5 → 6, Tailwind CSS 3 → 4, Astro 4 → 6, recharts 2 → 3, react-resizable-panels 2 → 4, wrangler 3 → 4, and more.
- **refactor:** Migrated to Tailwind CSS v4 API (`@import "tailwindcss"`, `@tailwindcss/vite` for extension, `@tailwindcss/postcss` for web).
- **fix:** Smooth scrolling on nav link click with `scroll-behavior: smooth`; sections offset correctly below the sticky header with `scroll-mt-16`.

---

### [v0.0.6] - 2024-11-04
#### Added
- **feat**: New landing page base with shadcn design components.

#### Changed
- **refactor**: Updated logo link for Chrome Webstore and revised privacy policy page.
- **refactor**: Enhanced initialization of popup and improved block-level scoping for switch cases.
- **refactor**: Turbo repo and Vite CRX plugin updated.

#### Fixed
- **fix:** Ignored readonly inputs to prevent autofill issues.
- **fix:** Resolved build failure impacting deployment.

---

### [v0.0.5] - 2024-10-20  
#### Added  
- **feat:** Sites rules logic and Stripe integration.  
- **feat:** Site rules core logic with Lemon Squeezy support.  

#### Fixed  
- **fix:** Lemon Squeezy button not appearing on the store.

#### Changed  
- **refactor:** Improved handling for radio buttons, checkboxes, and name fields.  
- **refactor:** Moved fill actions and message passing logic to the popup store.  
- **refactor:** Enhanced error handling and dependency updates.  

---

### [v0.0.4] - 2024-09-18  
#### Added  
- **feat:** New popup look with smooth scroll form into view.  
- **feat:** Hotkeys and tooltips for quick access.  

#### Changed  
- **refactor:** Updated turborepo configuration.  
- **refactor:** Improved scroll behavior across pages.  
- **refactor:** Open demo page automatically on start in the local environment.  
- **refactor:** Organized `Options` components into a dedicated directory.  

#### Fixed  
- **fix:** Build error resolved.  

#### Removed  
- **chore:** Deprecated code removed and warnings addressed.  

---

### [v0.0.3] - 2024-08-30  
#### Added  
- **feat:** Extension configurations added.  
- **feat:** New landing page with **shadcn** design components.  
- **feat:** Support for `autocomplete` attributes and mounted inputs.  

#### Changed  
- **refactor:** Updated extension links and internal page check utilities.  
- **refactor:** Improved password behavior with consistent values.  

---

## [Unreleased]  
#### Added  
- **feat:** Support for credit card fields, date of birth, and company input types.  
- **feat:** File input handling added.  

#### Changed  
- **refactor:** Migrated from lodash to es-toolkit for better performance.  
- **refactor:** Abstracted logic for element matching by name, ID, class, or label.  
- **refactor:** Removed side panels and unused logs for a cleaner experience.  

#### Fixed  
- **fix:** Mobile number deprecation warning handled.  
- **fix:** Disabled inputs are now filtered correctly.  

---

### [v0.0.2] - 2024-07-18  
#### Added  
- **feat:** Single form autofill and submit support.  
- **feat:** Integration with Lemon Squeezy and Stripe Checkout.  

---

### [v0.0.1] - 2024-06-30  
#### Added  
- **feat:** Basic autofill functionality for all inputs on a page.  
- **feat:** New logo and demo page integration.  

---