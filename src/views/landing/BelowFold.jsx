import React, { useEffect, useRef } from 'react'
import { useSectionBackdrop } from './Backdrop'
import CollegeDay from './CollegeDay'
import FeatureBento from './FeatureBento'
import TrustSection from './TrustSection'
import { ClosingCall, Faq, Plans, SectionHeading, SecuritySection, SetupSteps } from './Sections'

// Everything below the hero. It is loaded as a separate file once the top of the page is
// on screen, so the first view appears sooner on slow phones.

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

export default function BelowFold({ onSignIn }) {
  // A link straight to a section (#faq and so on) arrived before the section existed.
  // The pinned "day at college" section changes the page length as it sets up, so aim
  // again once the layout has settled.
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1))
    if (!id) return undefined
    const aim = () => {
      const el = document.getElementById(id)
      if (el) window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 72)
    }
    const timers = [0, 400, 1200].map((ms) => setTimeout(aim, ms))
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <>
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

      <Section id="trust" theme="dusk" className="border-t border-white/10">
        <TrustSection />
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
    </>
  )
}
