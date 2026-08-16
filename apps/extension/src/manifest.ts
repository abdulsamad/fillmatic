import { defineManifest } from '@crxjs/vite-plugin'

import { PRODUCT_DESCRIPTION, PRODUCT_NAME } from '@fillmatic/config'

import packageData from '../../../package.json'
import { isFeatureEnabled } from './utils/featureFlags'

export default defineManifest({
  name: PRODUCT_NAME,
  description: PRODUCT_DESCRIPTION,
  version: packageData.version,
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
  // The side panel (AI field mapper) only exists in builds with the aiMapping
  // flag on, and its permission is optional: requested at runtime from the
  // popup's field-mapper button, not at install.
  ...(isFeatureEnabled('aiMapping') && {
    side_panel: {
      default_path: 'sidepanel.html',
    },
    optional_permissions: ['sidePanel'],
  }),
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
  permissions: ['storage', 'activeTab', 'webNavigation'],
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
