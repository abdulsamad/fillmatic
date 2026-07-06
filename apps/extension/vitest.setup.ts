import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Minimal chrome extension API stub so modules that reference `chrome.*` at
// import time (e.g. src/consts) don't throw in the jsdom test environment.
vi.stubGlobal('chrome', {
  i18n: {
    getMessage: vi.fn(() => ''),
  },
  runtime: {
    getURL: vi.fn((path: string) => path),
    onInstalled: { addListener: vi.fn() },
    onMessage: { addListener: vi.fn() },
    openOptionsPage: vi.fn(),
  },
  action: {
    onClicked: { addListener: vi.fn() },
    setBadgeBackgroundColor: vi.fn(),
    setBadgeText: vi.fn(),
  },
  commands: {
    getAll: vi.fn(() => Promise.resolve([])),
    onCommand: { addListener: vi.fn() },
  },
  tabs: {
    create: vi.fn(),
    query: vi.fn(() => Promise.resolve([])),
    sendMessage: vi.fn(),
  },
  storage: {
    local: {
      get: vi.fn(() => Promise.resolve({})),
      set: vi.fn(() => Promise.resolve()),
      remove: vi.fn(() => Promise.resolve()),
    },
  },
})

// jsdom defines these as "not implemented" stubs that log a warning and no-op (so a truthy
// check doesn't catch them); always replace with a plain vi.fn(). Individual tests can
// spy/override as needed.
Element.prototype.scrollIntoView = vi.fn()
HTMLFormElement.prototype.requestSubmit = vi.fn()
if (typeof globalThis.ResizeObserver === 'undefined') {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe = vi.fn()
      unobserve = vi.fn()
      disconnect = vi.fn()
    },
  )
}
// jsdom doesn't implement DataTransfer; minimal polyfill for input.files assignment flows.
if (typeof globalThis.DataTransfer === 'undefined') {
  class FakeDataTransfer {
    private _files: File[] = []
    items = {
      add: (file: File) => {
        this._files.push(file)
      },
    }
    get files() {
      const files = this._files
      return Object.assign([...files], { item: (i: number) => files[i] ?? null }) as unknown as FileList
    }
  }
  vi.stubGlobal('DataTransfer', FakeDataTransfer)
}

// Always stub fetch, even though Node provides a native implementation: chrome.runtime.getURL
// is stubbed to return relative paths, which the real fetch can't parse as a URL. The only
// real caller (handleFileInput.ts) just calls `.blob()` on the result, so return a minimal
// duck-typed object rather than a real Response — constructing `new Response(new Blob())`
// is fragile across Node/undici versions since jsdom's global Blob doesn't always satisfy
// undici's internal Blob check, causing a "object.stream is not a function" error in some
// environments. Tests that care about the response can override this per-call with
// vi.mocked(fetch).mockResolvedValueOnce(...).
vi.stubGlobal(
  'fetch',
  vi.fn(() => Promise.resolve({ blob: () => Promise.resolve(new Blob()) })),
)

afterEach(() => {
  cleanup()
})
