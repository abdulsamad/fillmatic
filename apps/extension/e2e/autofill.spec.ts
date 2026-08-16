import { test, expect, openExtensionPopup, sendTabMessage } from './extension.fixture'

test('boots the Manifest V3 service worker and exposes the packaged extension', async ({
  context,
  extensionId,
  serviceWorker,
}) => {
  expect(serviceWorker.url()).toBe(`chrome-extension://${extensionId}/service-worker-loader.js`)

  const extensionPage = await context.newPage()
  await extensionPage.goto(`chrome-extension://${extensionId}/options.html`)

  await expect(extensionPage).toHaveTitle(/FillMatic/i)
  await expect(extensionPage.getByRole('heading', { name: /FillMatic/i })).toBeVisible()
})

test('fills the active page through the popup UI', async ({ context, extensionId }) => {
  const page = await context.newPage()
  await page.goto('/')

  const popup = await openExtensionPopup(context, page, extensionId)
  const fillButton = popup.getByRole('button', { name: 'Fill all fields' })

  await expect(popup.getByRole('heading', { name: 'FillMatic' })).toBeVisible()
  await expect(fillButton).toBeEnabled()
  await fillButton.click()

  await expect(page.locator('#first-name')).not.toHaveValue('')
  await expect(page.locator('#email')).not.toHaveValue('')
})

test('persists settings changed through the options UI', async ({ context, extensionId }) => {
  const optionsPage = await context.newPage()
  await optionsPage.goto(`chrome-extension://${extensionId}/options.html`)

  const typingEffect = optionsPage.getByRole('switch', { name: 'Typing Effect' })
  await expect(typingEffect).toBeChecked()

  await typingEffect.click()
  await expect(typingEffect).not.toBeChecked()
  await optionsPage.getByRole('button', { name: 'Save Changes' }).click()
  await expect(optionsPage.getByText('Settings saved!')).toBeVisible()
  await expect
    .poll(() =>
      optionsPage.evaluate(async () => {
        const stored = await chrome.storage.local.get('config')
        return JSON.parse(stored.config as string).state.typingEffect as boolean
      }),
    )
    .toBe(false)

  await optionsPage.reload()
  await expect(optionsPage.getByRole('switch', { name: 'Typing Effect' })).not.toBeChecked()
})

test('fills React-controlled, late-mounted, Radix, rich-text, shadow DOM, and iframe fields', async ({
  context,
  serviceWorker,
}) => {
  const page = await context.newPage()
  await page.goto('/')

  await sendTabMessage(serviceWorker, page, 'INIT_AUTOFILL_ALL')

  const firstName = page.locator('#first-name')
  const email = page.locator('#email')

  await expect(firstName).not.toHaveValue('')
  await expect(page.getByTestId('first-name-state')).toHaveText(await firstName.inputValue())
  await expect(email).not.toHaveValue('')
  await expect(page.getByTestId('email-state')).toHaveText(await email.inputValue())
  await expect(page.locator('#late-company')).not.toHaveValue('')

  await expect(page.getByTestId('radix-trigger')).not.toHaveText('Choose a framework')
  await expect(page.getByTestId('framework-state')).toHaveText(/react|vue|svelte/)
  await expect(page.locator('.ProseMirror')).not.toBeEmpty()
  await expect(page.locator('#shadow-host').locator('#shadow-city')).not.toHaveValue('')

  const frame = page.frameLocator('iframe[title="Cross-frame form"]')
  await expect(frame.locator('#frame-company')).not.toHaveValue('')
})
