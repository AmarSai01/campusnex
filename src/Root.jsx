import React, { lazy, Suspense, useState } from 'react'
import SmoothScroll from './lib/smooth-scroll'
import { MAY_HAVE_SESSION } from './lib/session-hint'
import LandingPage from './views/landing/LandingPage'

// The signed-in app (database, sign-in and dashboards) is a separate download. A visitor who
// is not signed in sees the landing page straight away; the app loads when they press Sign in.
const App = lazy(() => import('./App'))

const OPENS_APP_DIRECTLY = MAY_HAVE_SESSION || new URLSearchParams(window.location.search).has('preview')

const Spinner = () => (
  <div className="bg-background">
    <div className="flex min-h-screen items-center justify-center bg-muted/40">
      <span className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
    </div>
  </div>
)

export default function Root() {
  const [start, setStart] = useState(OPENS_APP_DIRECTLY ? 'landing' : null)

  if (!start) {
    return (
      <SmoothScroll>
        <LandingPage onSignIn={() => setStart('login')} />
      </SmoothScroll>
    )
  }
  return (
    <Suspense fallback={<Spinner />}>
      <App initialScreen={start} />
    </Suspense>
  )
}
