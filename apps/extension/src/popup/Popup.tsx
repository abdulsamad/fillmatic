import { useLayoutEffect, useEffect, useCallback } from 'react'
import { Settings, MessageSquare, CircleUserRoundIcon, NotebookPenIcon, PencilLineIcon } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'

import { usePopupStore } from '@/store/popup'
import { useProfileStore } from '@/store/profiles'
import { Form } from '@/types'
import { useTimeout } from '@/hooks/useTimeout'
// import { Avatar } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { getAllCommands, getCurrentTab, isInternalPage } from '@/utils'
import { MESSAGES } from '@/consts'
import SpecialButtons from '@/components/Popup/SpecialButtons'

export const Popup = () => {
  const {
    isAutofilling,
    fillData,
    isDisabled,
    setIsDisabled,
    currentTab,
    setCurrentTab,
    forms,
    setForms,
    commands,
    setCommands,
  } = usePopupStore(
    useShallow(
      ({
        isAutofilling,
        fillData,
        isDisabled,
        setIsDisabled,
        currentTab,
        setCurrentTab,
        forms,
        setForms,
        commands,
        setCommands,
      }) => ({
        isAutofilling,
        fillData,
        isDisabled,
        setIsDisabled,
        currentTab,
        setCurrentTab,
        forms,
        setForms,
        commands,
        setCommands,
      }),
    ),
  )

  const { startDelay, cancelDelay } = useTimeout()
  const { profiles, activeProfileId, setActiveProfile } = useProfileStore(
    useShallow(({ profiles, activeProfileId, setActiveProfile }) => ({ profiles, activeProfileId, setActiveProfile })),
  )

  useLayoutEffect(() => {
    ; (async () => {
      try {
        // Disable on Interal Pages
        const isInternal = await isInternalPage()

        setIsDisabled(isInternal)

        // Save Current Tab to store
        const tab = await getCurrentTab()

        if (!tab.id) return null

        setCurrentTab(tab)
      } catch (err) {
        console.error(err)
        setIsDisabled(false)
      }
    })()
  }, [setCurrentTab, setIsDisabled])

  useEffect(() => {
    if (!currentTab?.id) return

    // Inform popup is opened to content script so it can pull forms from page
    chrome.tabs.sendMessage(currentTab.id, { type: MESSAGES['GET_FORMS'] }).then((res) => {
      if (!res.forms) return null

      setForms(res.forms)
    })
  }, [currentTab, setForms])

  useEffect(() => {
    getAllCommands().then((commands) => setCommands(commands))
  }, [setCommands])

  const sendScrollElementIntoViewMessage = useCallback(
    (form: Form) => () => {
      startDelay(() => {
        if (!currentTab?.id) return

        chrome.tabs.sendMessage(currentTab.id, { type: MESSAGES['SCROLL_FORM_INTO_VIEW'], form })
      })
    },
    [currentTab, startDelay],
  )

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
            {/* <Avatar className="w-8 h-8 flex items-center">
                <AvatarImage src="https://github.com/shadcn.png" alt="User" />
            <AvatarFallback>CN</AvatarFallback>
            <CircleUserRoundIcon fontSize={20} />
          </Avatar> */}
          </div>
        </header>
        <div className="px-3 py-1 border-b flex items-center gap-2">
          <CircleUserRoundIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <Select value={activeProfileId} onValueChange={setActiveProfile}>
            <SelectTrigger className="h-6 text-xs border-0 shadow-none p-0 focus:ring-0 flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {profiles.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <main className="p-4 space-y-6 h-full relative">
          <div className="space-y-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className="w-full flex items-center justify-start space-x-2"
                  disabled={isDisabled || isAutofilling}
                  onClick={() => fillData({ fillType: 'all' })}
                >
                  <NotebookPenIcon size={20} />
                  <span className="capitalize">Fill all fields</span>
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
                onMouseEnter={sendScrollElementIntoViewMessage(form)}
                onMouseLeave={cancelDelay}
                onClick={() => fillData({ fillType: 'single', form })}
              >
                <PencilLineIcon size={20} />
                <span className="capitalize">
                  {form.name ? `Fill ${form.name} form` : `Fill form ${form.index + 1}`}
                </span>
              </Button>
            ))}
            <SpecialButtons />
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
    </div >
  )
}

export default Popup
