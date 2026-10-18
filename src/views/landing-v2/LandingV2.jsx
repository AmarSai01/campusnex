import React, { useRef } from 'react'
import { MotionConfig, motion } from 'framer-motion'
import { GraduationCap } from 'lucide-react'
import { Button as MovingBorderButton } from '@/components/ui/moving-border'
import { BackdropProvider, useSectionBackdrop } from './Backdrop'
import HeroRegister from './HeroRegister'
import CollegeDay from './CollegeDay'

const CONTACT_EMAIL = '__CONTACT_EMAIL__'

// Words from an Indian college office, not a generic ERP brochure.
const STRIP = [
  'Sem 5 Sec A', 'IA-2 published', 'Circular No. 42', 'HOD review', 'Seat S-07, LH-101',
  'Shortage list', 'USN 1CN23CS027', 'Timetable: 0 clashes', '75% attendance rule', 'Exam hall LH-102',
]

const HEADLINE = ['Catch', 'the', '74%', 'before', 'the', 'semester', 'does.']

function Page({ onSignIn }) {
  const heroRef = useRef(null)
  const endRef = useRef(null)
  useSectionBackdrop(heroRef, 'night')
  useSectionBackdrop(endRef, 'night')

  return (
    <div className="relative min-h-screen font-sans text-white">
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
            <h1 className="font-display text-[2.7rem] leading-[1.02] font-semibold tracking-[-0.03em] sm:text-7xl">
              {HEADLINE.map((word, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, filter: 'blur(8px)', y: 10 }}
                  animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
                  transition={{ delay: 0.1 + i * 0.08, duration: 0.5 }}
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
                as="a"
                href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Campusnex pilot request')}`}
                borderRadius="0.75rem"
                duration={3200}
                containerClassName="h-12 w-44"
                borderClassName="bg-[radial-gradient(#ff5c00_40%,transparent_60%)]"
                className="border-night-line bg-night-2 text-sm font-semibold text-white"
              >
                Request a pilot
              </MovingBorderButton>
              <button
                type="button"
                onClick={onSignIn}
                className="h-12 rounded-xl px-5 text-sm font-semibold text-mist hover:text-white cursor-pointer"
              >
                Sign in to your campus
              </button>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="relative mt-16"
          >
            <HeroRegister />
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

        <section ref={endRef} className="flex min-h-[70vh] items-center justify-center border-t border-white/10 px-4 text-center sm:px-6">
          <p className="text-sm text-mist">End of the demo. The full page continues with the feature bento, security and FAQ.</p>
        </section>
      </main>
    </div>
  )
}

export default function LandingV2({ onSignIn }) {
  return (
    <MotionConfig reducedMotion="user">
      <BackdropProvider>
        <Page onSignIn={onSignIn} />
      </BackdropProvider>
    </MotionConfig>
  )
}
