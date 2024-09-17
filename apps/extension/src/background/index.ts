import { log } from '@/utils'
import { MESSAGES } from '@/consts'
import { ExtensionCommands } from '@/types'

log('BACKGROUND SCRIPT is running...')

chrome.action.onClicked.addListener(async () => {
  //
})

chrome.commands.onCommand.addListener((command: string, tab) => {
  switch (command as ExtensionCommands) {
    case 'AUTOFILL_ALL':
      console.log(`Command "${command}" triggered`)
      break
    case 'AUTOFILL_CURRENT_FORM':
      console.log(`Command "${command}" triggered`)
      break
    case 'AUTOFILL_CURRENT_INPUT':
      console.log(`Command "${command}" triggered`)
      break
    default:
      return
  }
})
