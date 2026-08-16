import { spawn } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { chromium } from '@playwright/test'

const extensionRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const extensionPath = path.join(extensionRoot, 'build')
const fixtureUrl = 'http://127.0.0.1:4174'
const outputPath = path.resolve(extensionRoot, '../../readme/demo.gif')
const temporaryDirectory = await mkdtemp(path.join(tmpdir(), 'fillmatic-demo-'))

const waitForServer = async () => {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(fixtureUrl)
      if (response.ok) return
    } catch {
      // The fixture server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  throw new Error(`Fixture server did not start at ${fixtureUrl}`)
}

const run = (command, args) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit' })
    child.once('error', reject)
    child.once('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${command} exited with code ${code}`))))
  })

const server = spawn('./node_modules/.bin/vite', ['--config', 'e2e/fixtures/vite.config.ts'], {
  cwd: extensionRoot,
  stdio: 'ignore',
})

let context
try {
  await waitForServer()

  context = await chromium.launchPersistentContext('', {
    channel: 'chromium',
    headless: true,
    viewport: { width: 1000, height: 700 },
    recordVideo: { dir: temporaryDirectory, size: { width: 1000, height: 700 } },
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
  })

  let [serviceWorker] = context.serviceWorkers()
  serviceWorker ??= await context.waitForEvent('serviceworker')

  const page = await context.newPage()
  await page.goto(fixtureUrl)
  await page.waitForTimeout(1_200)

  await page.bringToFront()
  await page.locator('#demo-status').evaluate((element) => {
    element.textContent = 'FillMatic is filling every field…'
  })

  await serviceWorker.evaluate(async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (!tab?.id) throw new Error('Could not find the demo tab')
    const frames = (await chrome.webNavigation.getAllFrames({ tabId: tab.id })) ?? []
    await Promise.all(
      frames.map(({ frameId }) => chrome.tabs.sendMessage(tab.id, { type: 'INIT_AUTOFILL_ALL' }, { frameId })),
    )
  })

  await page.locator('#demo-status').evaluate((element) => {
    element.textContent = 'Done — controlled, late-mounted, widget, shadow, and iframe fields filled'
  })
  await page.waitForTimeout(2_000)

  const video = page.video()
  await page.close()
  const videoPath = await video.path()
  await context.close()
  context = undefined

  await run('ffmpeg', [
    '-y',
    '-ss',
    '1',
    '-i',
    videoPath,
    '-filter_complex',
    'fps=10,scale=760:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=dither=bayer',
    outputPath,
  ])

  console.log(`Wrote ${outputPath}`)
} finally {
  await context?.close()
  server.kill('SIGTERM')
  await rm(temporaryDirectory, { recursive: true, force: true })
}
