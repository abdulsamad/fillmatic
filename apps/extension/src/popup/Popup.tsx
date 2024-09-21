import { useState, useLayoutEffect, useEffect } from 'react'
import { Settings, Zap, MessageSquare, CircleUserRoundIcon, NotebookPenIcon, PencilLineIcon } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { getAllCommands, getCurrentTab, isInternalPage } from '@/utils'
import { MESSAGES } from '@/consts'
import { ExtensionCommands, Form } from '@/types'

export const Popup = () => {
  const [isAutofilling, setIsAutofilling] = useState(false)
  const [isDisabled, setIsDisabled] = useState(false)
  const [currTab, setCurrTab] = useState<chrome.tabs.Tab | null>(null)
  const [forms, setForms] = useState<Form[]>([])
  const [commands, setCommands] = useState<Record<ExtensionCommands, string>>()

  useLayoutEffect(() => {
    isInternalPage()
      .then((res) => setIsDisabled(res))
      .catch(() => setIsDisabled(false))
  }, [])

  useLayoutEffect(() => {
    getCurrentTab().then((tab) => {
      if (!tab.id) return null

      setCurrTab(tab)
    })
  }, [])

  useEffect(() => {
    if (!currTab?.id) return

    // Tell popup open to content script
    chrome.tabs.sendMessage(currTab.id, { type: MESSAGES['POPUP_OPENED'] }).then((res) => {
      if (!res.forms) return null

      setForms(res.forms)
    })
  }, [currTab])

  useEffect(() => {
    getAllCommands().then((commands) => setCommands(commands))
  }, [])

  const fillAllForms = async () => {
    try {
      if (!currTab?.id) return null

      setIsAutofilling(true)

      const { INIT_AUTOFILL_ALL } = MESSAGES

      await chrome.tabs.sendMessage(currTab.id, { type: INIT_AUTOFILL_ALL })

      setIsAutofilling(false)
    } catch (err) {
      console.error(err)
      setIsAutofilling(false)
    }
  }

  const fillSingleForm = async (form: Form) => {
    try {
      if (!currTab?.id) return null

      setIsAutofilling(true)

      const { INIT_AUTOFILL_SINGLE } = MESSAGES

      await chrome.tabs.sendMessage(currTab.id, { type: INIT_AUTOFILL_SINGLE, form })

      setIsAutofilling(false)
    } catch (err) {
      console.error(err)
      setIsAutofilling(false)
    }
  }

  const scrollElementIntoView = async (form: Form) => {
    if (!currTab?.id) return

    chrome.tabs.sendMessage(currTab.id, { type: MESSAGES['SCROLL_FORM_INTO_VIEW'], form })
  }

  return (
    <div className="relative w-[250px] h-[400px] bg-background text-foreground box-border flex flex-col">
      <TooltipProvider>
        <header className="flex items-center justify-between px-4 py-2 bg-primary text-primary-foreground">
          <div className="flex items-center space-x-2">
            <h1 className="text-lg font-semibold">
              <div>FillMatic</div>
            </h1>
          </div>
          <div className="flex items-center space-x-2">
            <Avatar className="w-8 h-8 flex items-center">
              {/* <AvatarImage src="https://github.com/shadcn.png" alt="User" /> */}
              {/* <AvatarFallback>CN</AvatarFallback> */}
              <CircleUserRoundIcon fontSize={20} />
            </Avatar>
          </div>
        </header>
        <main className="p-4 space-y-6 h-full relative">
          <div className="space-y-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className="w-full flex items-center justify-start space-x-2"
                  disabled={isDisabled || isAutofilling}
                  onClick={fillAllForms}
                >
                  <NotebookPenIcon size={20} />
                  <span className="capitalize">{isAutofilling ? 'Autofilling...' : 'Fill all fields'}</span>
                </Button>
              </TooltipTrigger>
              {commands?.AUTOFILL_ALL && (
                <TooltipContent>
                  <p className="tracking-widest">{commands?.AUTOFILL_ALL}</p>
                </TooltipContent>
              )}
            </Tooltip>
            {forms.map((form) => (
              <Button
                key={form.id}
                className="w-full flex items-center justify-start space-x-2"
                disabled={isDisabled || isAutofilling}
                variant="secondary"
                // TODO: Add debounce
                // onMouseEnter={() => scrollElementIntoView(form)}
                onClick={() => fillSingleForm(form)}
              >
                <PencilLineIcon size={20} />
                <span className="capitalize">
                  {form.name ? `Fill ${form.name} form` : `Fill form ${form.index + 1}`}
                </span>
              </Button>
            ))}
          </div>

          {isDisabled && (
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 relative rounded-lg" role="alert">
                <span className="block sm:inline">FillMatic cannot be used on internal pages.</span>
              </div>
            </div>
          )}
          <Toaster theme="light" />
        </main>
        <Separator />
        <footer className="px-2.5 py-1 flex justify-between items-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                aria-label="Provide feedback"
                asChild
              >
                <a href="mailto:hello@abdulsamad.dev" target="_blank">
                  <MessageSquare size={16} />
                </a>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Provide feedback</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                aria-label="Settings"
                onClick={() => chrome.runtime.openOptionsPage()}
              >
                <Settings size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Settings</p>
            </TooltipContent>
          </Tooltip>
        </footer>
      </TooltipProvider>
    </div>
  )
}

export default Popup
