import React, { createContext, lazy, Suspense, useCallback, useContext, useState } from 'react'

// "Request a pilot" opens a form instead of an email app, so a visitor can ask for a pilot
// from any phone or office computer in under a minute. The form itself is a separate file,
// loaded the first time someone asks for it.
const PilotRequestDialog = lazy(() => import('./PilotRequestDialog'))

const PilotContext = createContext(() => {})
export const useRequestPilot = () => useContext(PilotContext)

export function PilotRequestProvider({ children }) {
  const [open, setOpen] = useState(false)
  const [plan, setPlan] = useState('pilot')
  const [round, setRound] = useState(0)

  const request = useCallback((which = 'pilot') => {
    setPlan(which)
    setRound((r) => r + 1)
    setOpen(true)
  }, [])

  // The plan buttons inside the form switch the plan; "Done" (no plan) closes the form.
  const onDone = useCallback((which) => {
    if (which) setPlan(which)
    else setOpen(false)
  }, [])

  return (
    <PilotContext.Provider value={request}>
      {children}
      {round > 0 && (
        <Suspense fallback={null}>
          <PilotRequestDialog open={open} onOpenChange={setOpen} plan={plan} round={round} onDone={onDone} />
        </Suspense>
      )}
    </PilotContext.Provider>
  )
}
