import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { CircleHelp, Info, LayoutGrid, Lock, Menu, PenLine, Sun, X } from 'lucide-react'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

// "Roll call": the sections in one capsule, each with its icon. A white pill rests on the
// section you are reading and slides to whatever you point at. Between 920px and 1180px only
// the pill's link shows its name; the others show their icon.
const LINKS = [
  { id: 'day', label: 'A day at college', icon: Sun },
  { id: 'features', label: 'Features', icon: LayoutGrid },
  { id: 'security', label: 'Security', icon: Lock },
  { id: 'faq', label: 'FAQ', icon: CircleHelp },
  { id: 'trust', label: 'The Last Bench', icon: PenLine },
  { id: 'about', label: 'About', icon: Info },
]

// Every section on the page, in order, and the nav link it belongs to. Sections without their
// own link (setup, plans, the closing scene) map to null, so the pill steps aside there
// instead of staying on the section above.
const PAGE_SECTIONS = [
  ['day', 'day'],
  ['features', 'features'],
  ['ai', 'features'],
  ['security', 'security'],
  ['setup', null],
  ['plans', null],
  ['faq', 'faq'],
  ['trust', 'trust'],
  ['tomorrow', null],
  ['about', 'about'],
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
      let top = -Infinity
      for (const [id, link] of PAGE_SECTIONS) {
        const el = document.getElementById(id)
        const y = el?.getBoundingClientRect().top
        // The latest section to have passed the line wins, whatever its order in the list.
        if (el && y <= line && y > top) {
          top = y
          found = link
        }
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

// Phones and small tablets (below 920px), where the capsule above is hidden: a menu button that
// opens the same sections as a list, plus "Request a pilot".
export function MobileMenu({ onRequestPilot }) {
  const [open, setOpen] = useState(false)
  const current = useCurrentSection()

  // Close first, then scroll, so the page is unlocked before it moves.
  const go = (e, id) => {
    e.preventDefault()
    setOpen(false)
    window.setTimeout(() => {
      const el = document.getElementById(id)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      else window.location.hash = id
    }, 260)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-white/15 bg-white/5 text-white hover:bg-white/10 min-[920px]:hidden"
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>
      <DialogContent
        showCloseButton={false}
        data-lenis-prevent
        className="top-3 max-w-[calc(100%-1.5rem)] translate-y-0 gap-0 border border-white/10 bg-night-2 p-0 text-white ring-0 sm:max-w-md"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <DialogTitle className="font-display text-lg font-semibold text-white">Campusnex</DialogTitle>
          <DialogClose className="cursor-pointer rounded-md p-1.5 text-mist hover:bg-white/10 hover:text-white" aria-label="Close menu">
            <X className="h-5 w-5" aria-hidden="true" />
          </DialogClose>
        </div>
        <DialogDescription className="sr-only">Jump to a section of the page.</DialogDescription>
        <nav aria-label="Sections" className="p-2">
          {LINKS.map(({ id, label, icon: Icon }) => {
            const on = current === id
            return (
              <a
                key={id}
                href={`#${id}`}
                onClick={(e) => go(e, id)}
                aria-current={on ? 'location' : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-medium transition-colors',
                  on ? 'bg-white text-night' : 'text-white/90 hover:bg-white/5',
                )}
              >
                <span
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full',
                    on ? 'bg-brand-500 text-white' : 'bg-brand-500/25 text-brand-300',
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                {label}
              </a>
            )
          })}
        </nav>
        <div className="border-t border-white/10 p-4">
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              onRequestPilot()
            }}
            className="w-full cursor-pointer rounded-lg bg-brand-500 px-4 py-3 text-sm font-semibold text-night hover:bg-brand-600"
          >
            Request a pilot
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
