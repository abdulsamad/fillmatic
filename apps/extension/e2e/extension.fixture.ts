import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { chromium, test as base, type BrowserContext, type Page, type Worker } from '@playwright/test'

type ExtensionFixtures = {
  context: BrowserContext
  extensionId: string
  serviceWorker: Worker
}

const extensionPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../build')

export const test = base.extend<ExtensionFixtures>({
  context: async ({ headless }, use) => {
    const context = await chromium.launchPersistentContext('', {
      channel: 'chromium',
      headless,
      args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
    })

    await use(context)
    await context.close()
  },

  serviceWorker: async ({ context }, use) => {
    let [worker] = context.serviceWorkers()
    worker ??= await context.waitForEvent('serviceworker')
    await use(worker)
  },

  extensionId: async ({ serviceWorker }, use) => {
    await use(new URL(serviceWorker.url()).host)
  },
})

export const expect = test.expect

export const openExtensionPopup = async (context: BrowserContext, activePage: Page, extensionId: string) => {
  const popupUrl = `chrome-extension://${extensionId}/popup.html`
  const popup = await context.newPage()

  await popup.goto(popupUrl)
  await activePage.bringToFront()
  await popup.reload()
  return popup
}

export const sendTabMessage = async (serviceWorker: Worker, page: Page, type: string) => {
  await page.bringToFront()

  return serviceWorker.evaluate(
    async ({ messageType }) => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      if (!tab?.id) throw new Error('Could not find the active browser tab')
      const frames = (await chrome.webNavigation.getAllFrames({ tabId: tab.id })) ?? []

      return Promise.all(
        frames.map(async ({ frameId }) => {
          for (let attempt = 0; attempt < 10; attempt += 1) {
            try {
              return await chrome.tabs.sendMessage(tab.id!, { type: messageType }, { frameId })
            } catch (error) {
              if (attempt === 9) throw error
              await new Promise((resolve) => setTimeout(resolve, 50))
            }
          }
        }),
      )
    },
    { messageType: type },
  )
}
