import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { CircleHelp, Info, LayoutGrid, Lock, PenLine, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'

// "Roll call": the sections in one capsule, each with its icon. A white pill rests on the
// section you are reading and slides to whatever you point at. Between 920px and 1180px only
// the pill's link shows its name; the others show their icon.
const LINKS = [
  { id: 'day', label: 'A day at college', icon: Sun },
  { id: 'features', label: 'Features', icon: LayoutGrid },
  { id: 'security', label: 'Security', icon: Lock },
  { id: 'faq', label: 'FAQ', icon: CircleHelp },
  { id: 'about', label: 'About', icon: Info },
  { id: 'trust', label: 'The Last Bench', icon: PenLine },
]

// The section whose top has passed a third of the way down the screen. The lower sections
// mount after the first paint, so they are looked up on every check rather than once.
function useCurrentSection() {
  const [current, setCurrent] = useState(null)
  useEffect(() => {
    let frame = 0
    const check = () => {
      frame = 0
      const line = window.innerHeight / 3
      let found = null
      for (const { id } of LINKS) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top <= line) found = id
      }
      setCurrent(found)
    }
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(check)
    }
    check()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [])
  return current
}

export default function LandingNav() {
  const current = useCurrentSection()
  const [pointed, setPointed] = useState(null)
  const shown = pointed ?? current

  return (
    <nav
      aria-label="Main"
      onMouseLeave={() => setPointed(null)}
      className="relative hidden rounded-full border border-white/15 bg-white/[0.07] p-1 min-[920px]:flex"
    >
      {LINKS.map(({ id, label, icon: Icon }) => {
        const on = shown === id
        return (
          <a
            key={id}
            href={`#${id}`}
            title={label}
            aria-current={current === id ? 'location' : undefined}
            onMouseEnter={() => setPointed(id)}
            onFocus={() => setPointed(id)}
            onBlur={() => setPointed(null)}
            onClick={() => setPointed(null)}
            className={cn(
              'group relative flex items-center gap-1.5 rounded-full py-1 pl-1 text-[13.5px] whitespace-nowrap transition-colors duration-200',
              on ? 'pr-3 font-semibold text-night' : 'pr-1 text-white/85 hover:text-white min-[1180px]:pr-3'
            )}
          >
            {on && (
              <motion.span
                layoutId="landing-nav-pill"
                aria-hidden="true"
                className="absolute inset-0 rounded-full bg-white"
                transition={{ type: 'spring', stiffness: 420, damping: 36 }}
              />
            )}
            <span
              className={cn(
                'relative flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-full transition-[background-color,color,transform] duration-200 group-hover:scale-105',
                on ? 'bg-brand-500 text-white' : 'bg-brand-500/25 text-brand-300 group-hover:bg-brand-500/35'
              )}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            <span className={cn('relative', on ? 'inline' : 'sr-only min-[1180px]:not-sr-only')}>{label}</span>
          </a>
        )
      })}
    </nav>
  )
}
