import { log } from '@/utils'
import { MESSAGES } from '@/consts'
import { ExtensionCommands } from '@/types'

log('BACKGROUND SCRIPT is running...')

chrome.action.onClicked.addListener(async () => {
  //
})

chrome.commands.onCommand.addListener((command: string, tab) => {
  switch (command as ExtensionCommands) {
    case 'aufofill':
      console.log(`Command "${command}" triggered`)
      break
    case 'autofill_current_form':
      console.log(`Command "${command}" triggered`)
      break
    case 'autofill_current_input':
      console.log(`Command "${command}" triggered`)
      break
    default:
      return
  }
})
