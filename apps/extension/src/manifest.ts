import { defineManifest } from '@crxjs/vite-plugin'
import { pascalCase } from 'es-toolkit'

import packageData from '../../../package.json'

export default defineManifest({
  name: pascalCase(packageData.name),
  description: packageData.description,
  version: packageData.version,
  // author: { email: 'hello@abdulsamad.dev' },
  manifest_version: 3,
  icons: {
    16: 'icons/icon16.png',
    32: 'icons/icon32.png',
    48: 'icons/icon48.png',
    128: 'icons/icon128.png',
  },
  action: {
    default_popup: 'popup.html',
    default_icon: 'icons/icon48.png',
  },
  options_page: 'options.html',
  background: {
    service_worker: 'src/background/index.ts',
    type: 'module',
  },
  content_scripts: [
    {
      matches: ['http://*/*', 'https://*/*'],
      js: ['src/contentScript/index.ts'],
      all_frames: true,
    },
  ],
  web_accessible_resources: [
    {
      resources: ['icons/icon16.png', 'icons/icon32.png', 'icons/icon48.png', 'icons/icon128.png', 'samples/*'],
      matches: [],
    },
  ],
  permissions: ['storage', 'activeTab'],
  commands: {
    aufofill: {
      description: 'Fill all inputs on page',
    },
    autofill_current_form: {
      description: 'Fill inputs in the currently focused form',
    },
    autofill_current_input: {
      description: 'Fill currently input',
    },
  },
})
