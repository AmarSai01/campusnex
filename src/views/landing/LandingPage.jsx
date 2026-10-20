import React, { useEffect, useRef } from 'react'
import { MotionConfig, motion } from 'framer-motion'
import { GraduationCap } from 'lucide-react'
import { RISK_RULES } from '@/utils/risk'
import { Button as MovingBorderButton } from '@/components/ui/moving-border'
import { BackdropProvider, useSectionBackdrop } from './Backdrop'
import CampusOverview from './CampusOverview'
import { PilotRequestProvider, useRequestPilot } from './PilotRequest'
import CollegeDay from './CollegeDay'
import FeatureBento from './FeatureBento'
import { ClosingCall, Faq, Footer, Plans, SectionHeading, SecuritySection, SetupSteps } from './Sections'

// A page section that sets the background mood while it fills the screen.
function Section({ id, theme, className = '', children }) {
  const ref = useRef(null)
  useSectionBackdrop(ref, theme)
  return (
    <section ref={ref} id={id} className={`scroll-mt-20 px-4 py-16 sm:px-6 sm:py-32 ${className}`}>
      <div className="mx-auto max-w-6xl">{children}</div>
    </section>
  )
}

// Words from an Indian college office, not a generic ERP brochure.
const STRIP = [
  'Sem 5 Sec A', 'IA-2 published', 'Circular No. 42', 'HOD review', 'Seat S-07, LH-101',
  'Shortage list', 'USN 1CN23CS027', 'Timetable: 0 clashes', `${RISK_RULES.attendance.shortage}% attendance rule`, 'Exam hall LH-102',
]

const HEADLINE = 'No student should find out about an attendance or marks shortage on the last day.'.split(' ')

function Page({ onSignIn }) {
  const requestPilot = useRequestPilot()
  const heroRef = useRef(null)
  useSectionBackdrop(heroRef, 'night')

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
          <nav aria-label="Main" className="hidden gap-7 text-sm text-mist md:flex">
            <a href="#day" className="hover:text-white">A day at college</a>
            <a href="#features" className="hover:text-white">Features</a>
            <a href="#security" className="hover:text-white">Security</a>
            <a href="#faq" className="hover:text-white">FAQ</a>
          </nav>
          <button
            type="button"
            onClick={onSignIn}
            className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-night hover:bg-white/90 cursor-pointer"
          >
            Sign in
          </button>
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
                borderClassName="bg-[radial-gradient(#ff5c00_40%,transparent_60%)]"
                className="border-night-line bg-night-2 text-sm font-semibold text-white"
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

        <div id="day">
          <CollegeDay />
        </div>

        <Section id="features" theme="night">
          <SectionHeading title="Built for IA week, exam week and results day.">
            Close the registers and the Excel sheets. Try it right here: every card below works the way it does inside
            Campusnex.
          </SectionHeading>
          <div className="mt-12">
            <FeatureBento />
          </div>
        </Section>

        <Section id="security" theme="dusk" className="border-t border-white/10">
          <SecuritySection />
        </Section>

        <Section id="setup" theme="dawn" className="border-t border-white/10">
          <SetupSteps />
        </Section>

        <Section id="plans" theme="night" className="border-t border-white/10">
          <Plans />
        </Section>

        <Section id="faq" theme="night" className="border-t border-white/10">
          <Faq />
        </Section>

        <Section id="tomorrow" theme="night" className="border-t border-white/10">
          <ClosingCall onSignIn={onSignIn} />
        </Section>
      </main>
      <Footer onSignIn={onSignIn} />
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
