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

afterEach(() => {
  cleanup()
})
