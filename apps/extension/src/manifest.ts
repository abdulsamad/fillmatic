import { defineManifest } from '@crxjs/vite-plugin'

import { PRODUCT_DESCRIPTION, PRODUCT_NAME } from '@fillmatic/config'

import packageData from '../../../package.json'

export default defineManifest({
  name: PRODUCT_NAME,
  description: PRODUCT_DESCRIPTION,
  version: packageData.version,
  // author: { email: 'hello@abdulsamad.dev' },
  manifest_version: 3,
  icons: {
    16: 'icons/icon16.png',
    32: 'icons/icon32.png',
    192: 'icons/icon192.png',
    512: 'icons/icon512.png',
  },
  action: {
    default_popup: 'popup.html',
    default_icon: 'icons/icon192.png',
  },
  options_page: 'options.html',
  side_panel: {
    default_path: 'sidepanel.html',
  },
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
      resources: ['icons/icon16.png', 'icons/icon32.png', 'icons/icon192.png', 'icons/icon512.png', 'samples/*'],
      matches: [],
    },
  ],
  permissions: ['storage', 'activeTab', 'sidePanel'],
  commands: {
    AUTOFILL_ALL: {
      description: 'Fill all inputs on page',
      suggested_key: {
        default: 'Ctrl+Shift+Comma',
        mac: 'Command+Shift+Comma',
        linux: 'Ctrl+Shift+Comma',
        windows: 'Ctrl+Shift+Comma',
      },
    },
    AUTOFILL_CURRENT_FORM: {
      description: 'Fill inputs in the currently focused form',
      suggested_key: {
        default: 'Ctrl+Shift+F',
        mac: 'Command+Shift+F',
        linux: 'Ctrl+Shift+F',
        windows: 'Ctrl+Shift+F',
      },
    },
    AUTOFILL_CURRENT_INPUT: {
      description: 'Fill focused input',
      suggested_key: {
        default: 'Ctrl+Shift+Period',
        mac: 'Command+Shift+Period',
        linux: 'Ctrl+Shift+Period',
        windows: 'Ctrl+Shift+Period',
      },
    },
  },
})
