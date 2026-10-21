import React, { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { AnimatePresence, MotionConfig, motion } from 'framer-motion'
import { GraduationCap } from 'lucide-react'
import { RISK_RULES } from '@/utils/risk'
import { Button as MovingBorderButton } from '@/components/ui/moving-border'
import { BackdropProvider, useSectionBackdrop } from './Backdrop'
import CampusOverview from './CampusOverview'
import { PilotRequestProvider, useRequestPilot } from './PilotRequest'

// The hero loads first; everything below it comes as a separate file a moment later.
const BelowFold = lazy(() => import('./BelowFold'))
const Footer = lazy(() => import('./Sections').then((m) => ({ default: m.Footer })))
const LastBench = lazy(() => import('./BelowFold').then((m) => ({ default: m.LastBench })))

// Mount the lower sections once the browser is idle after the first paint, on the first
// scroll or touch, or straight away when the link points into the page (#faq and so on).
function useShowBelow() {
  const [show, setShow] = useState(() => window.location.hash.length > 1)
  useEffect(() => {
    if (show) return undefined
    const go = () => setShow(true)
    const idle = window.requestIdleCallback ? window.requestIdleCallback(go, { timeout: 2000 }) : window.setTimeout(go, 500)
    const events = ['scroll', 'wheel', 'touchstart', 'keydown', 'pointerdown']
    events.forEach((e) => window.addEventListener(e, go, { once: true, passive: true }))
    return () => {
      if (window.cancelIdleCallback) window.cancelIdleCallback(idle)
      else window.clearTimeout(idle)
      events.forEach((e) => window.removeEventListener(e, go))
    }
  }, [show])
  return show
}

// Words from an Indian college office, not a generic ERP brochure.
const STRIP = [
  'Sem 5 Sec A', 'IA-2 published', 'Circular No. 42', 'HOD review', 'Seat S-07, LH-101',
  'Shortage list', 'USN 1CN23CS027', 'Timetable: 0 clashes', `${RISK_RULES.attendance.shortage}% attendance rule`, 'Exam hall LH-102',
]

const HEADLINE = 'No student should find out about an attendance or marks shortage on the last day.'.split(' ')

// Phones only: once the hero is behind them, a slim bar keeps "Request a pilot" in reach.
// It steps aside near the end of the page, where the closing section has the same button.
function StickyPilotBar({ heroRef }) {
  const requestPilot = useRequestPilot()
  const [show, setShow] = useState(false)
  useEffect(() => {
    const update = () => {
      const hero = heroRef.current?.getBoundingClientRect()
      const closing = document.getElementById('tomorrow')?.getBoundingClientRect()
      const pastHero = hero ? hero.bottom < 0 : false
      const nearEnd = closing ? closing.top < window.innerHeight : false
      setShow(pastHero && !nearEnd)
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [heroRef])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: '110%' }}
          animate={{ y: 0 }}
          exit={{ y: '110%' }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-night/85 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md sm:hidden"
        >
          <button
            type="button"
            onClick={() => requestPilot('pilot')}
            className="w-full cursor-pointer rounded-lg bg-brand-500 py-3 text-sm font-semibold text-white hover:bg-brand-600"
          >
            Request a pilot
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Page({ onSignIn }) {
  const requestPilot = useRequestPilot()
  const heroRef = useRef(null)
  useSectionBackdrop(heroRef, 'night')
  const showBelow = useShowBelow()

  // The page itself is night-coloured while the landing page is open, so nothing flashes white
  // and readers and audit tools see the real dark background behind the text.
  useEffect(() => {
    const previous = document.body.style.backgroundColor
    document.body.style.backgroundColor = 'var(--color-night)'
    return () => {
      document.body.style.backgroundColor = previous
    }
  }, [])

  return (
    <div className="relative min-h-screen overflow-x-clip font-sans text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-night/40 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <span className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500">
              <GraduationCap className="h-4.5 w-4.5" aria-hidden="true" />
            </span>
            <span className="font-display text-lg font-bold">Campusnex</span>
          </span>
          <nav aria-label="Main" className="hidden gap-4 text-sm whitespace-nowrap text-mist min-[920px]:flex lg:gap-7">
            <a href="#day" className="hover:text-white">A day at college</a>
            <a href="#features" className="hover:text-white">Features</a>
            <a href="#security" className="hover:text-white">Security</a>
            <a href="#faq" className="hover:text-white">FAQ</a>
            <a href="#about" className="hover:text-white">About</a>
            <a href="#trust" className="hover:text-white">The Last Bench</a>
          </nav>
          <div className="flex items-center gap-2">
            {/* Phones get the sticky bar at the bottom instead. */}
            <button
              type="button"
              onClick={() => requestPilot('pilot')}
              className="hidden rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 cursor-pointer sm:block"
            >
              Request a pilot
            </button>
            <button
              type="button"
              onClick={onSignIn}
              className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-night hover:bg-white/90 cursor-pointer"
            >
              Sign in
            </button>
          </div>
        </div>
      </header>

      <main>
        <section ref={heroRef} className="relative px-4 pt-20 pb-24 sm:px-6">
          <div className="relative mx-auto max-w-4xl text-center">
            <h1 className="font-display text-[2.3rem] leading-[1.04] font-semibold tracking-[-0.03em] sm:text-6xl">
              {HEADLINE.map((word, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, filter: 'blur(8px)', y: 10 }}
                  animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
                  transition={{ delay: 0.1 + i * 0.05, duration: 0.5 }}
                  className="inline-block bg-gradient-to-b from-white to-slate-400 bg-clip-text pr-[0.22em] text-transparent"
                >
                  {word}
                </motion.span>
              ))}
            </h1>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-mist"
            >
              Campusnex is the academic portal built for Indian colleges. Attendance, IA marks, exams and circulars,
              with a desk for every admin, HOD, teacher and student.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.95, duration: 0.5 }}
              className="mt-9 flex flex-wrap items-center justify-center gap-3"
            >
              <MovingBorderButton
                as="button"
                type="button"
                onClick={() => requestPilot('pilot')}
                borderRadius="0.75rem"
                duration={3200}
                containerClassName="h-12 w-full max-w-64 sm:w-44"
                borderClassName="bg-[radial-gradient(#ffd7bf_40%,transparent_60%)]"
                className="border-brand-500 bg-brand-500 text-sm font-semibold text-white hover:bg-brand-600"
              >
                Request a pilot
              </MovingBorderButton>
              <MovingBorderButton
                as="button"
                type="button"
                onClick={onSignIn}
                borderRadius="0.75rem"
                duration={3200}
                reverse
                containerClassName="h-12 w-full max-w-64 cursor-pointer sm:w-52"
                borderClassName="bg-[radial-gradient(#93c5fd_40%,transparent_60%)]"
                className="border-night-line bg-night-2 text-sm font-semibold text-white"
              >
                Sign in to your campus
              </MovingBorderButton>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="relative mt-16"
          >
            <CampusOverview />
          </motion.div>
        </section>

        {/* Strip of real college vocabulary */}
        <section aria-label="What Campusnex handles" className="overflow-hidden border-y border-white/10 py-5">
          <motion.ul
            className="flex w-max gap-3"
            animate={{ x: ['0%', '-50%'] }}
            transition={{ duration: 40, ease: 'linear', repeat: Infinity }}
          >
            {[...STRIP, ...STRIP].map((item, i) => (
              <li
                key={i}
                aria-hidden={i >= STRIP.length}
                className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-sm whitespace-nowrap text-mist"
              >
                {item}
              </li>
            ))}
          </motion.ul>
        </section>

        <Suspense fallback={<div className="min-h-[200vh]" aria-hidden="true" />}>
          {showBelow ? <BelowFold onSignIn={onSignIn} /> : <div className="min-h-[200vh]" aria-hidden="true" />}
        </Suspense>
      </main>
      <Suspense fallback={null}>
        {showBelow && (
          <>
            <Footer onSignIn={onSignIn} />
            <LastBench />
          </>
        )}
      </Suspense>
      <StickyPilotBar heroRef={heroRef} />
    </div>
  )
}

export default function LandingPage({ onSignIn }) {
  return (
    <MotionConfig reducedMotion="user">
      <BackdropProvider>
        <PilotRequestProvider>
          <Page onSignIn={onSignIn} />
        </PilotRequestProvider>
      </BackdropProvider>
    </MotionConfig>
  )
}
