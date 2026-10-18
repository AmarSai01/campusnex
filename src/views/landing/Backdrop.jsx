import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion'

// Page background that changes with the section in view. Through "A day at your
// college" it follows the time of day: dawn, late morning, afternoon, dusk.
// `period` is the timetable row that glows at that time (null = no class).
export const THEMES = {
  night: { base: '#0a1022', glowA: 'rgba(120,150,255,0.09)', glowB: 'rgba(255,92,0,0.05)', a: ['50%', '-10%'], b: ['85%', '110%'], cell: 'rgba(255,92,0,0.0)', period: null },
  dawn: { base: '#101a33', glowA: 'rgba(251,191,36,0.11)', glowB: 'rgba(255,92,0,0.06)', a: ['10%', '100%'], b: ['80%', '0%'], cell: 'rgba(251,191,36,0.30)', period: 0 },
  morning: { base: '#0c1d3a', glowA: 'rgba(56,189,248,0.11)', glowB: 'rgba(147,197,253,0.06)', a: ['70%', '5%'], b: ['15%', '90%'], cell: 'rgba(56,189,248,0.30)', period: 2 },
  afternoon: { base: '#1a1222', glowA: 'rgba(255,92,0,0.12)', glowB: 'rgba(251,146,60,0.06)', a: ['85%', '30%'], b: ['10%', '85%'], cell: 'rgba(255,92,0,0.32)', period: 5 },
  dusk: { base: '#130f2b', glowA: 'rgba(139,92,246,0.13)', glowB: 'rgba(236,72,153,0.06)', a: ['20%', '20%'], b: ['85%', '95%'], cell: 'rgba(139,92,246,0.34)', period: 7 },
}

const BackdropContext = createContext(() => {})

export function BackdropProvider({ children }) {
  const [theme, setTheme] = useState('night')
  return (
    <BackdropContext.Provider value={setTheme}>
      <Backdrop theme={THEMES[theme]} />
      {children}
    </BackdropContext.Provider>
  )
}

export const useSetBackdrop = () => useContext(BackdropContext)

// Switch the background when a section fills the middle of the screen.
export function useSectionBackdrop(ref, theme) {
  const setTheme = useSetBackdrop()
  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setTheme(theme),
      { rootMargin: '-45% 0px -45% 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref, theme, setTheme])
}

// A college timetable, faintly drawn as the page's background pattern.
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const PERIODS = ['9:00', '10:00', '11:15', '12:15', '1:30', '2:30', '3:30', '4:30']
const TODAY = 2 // Wednesday's column carries the glowing "now" cell
const SUBJECTS = {
  '0-0': 'DSA', '0-1': 'OS', '0-2': 'Tutorial', '0-3': 'DBMS', '0-4': 'OS Lab', '0-6': 'Library',
  '1-0': 'CN', '1-1': 'DSA', '1-3': 'ML', '1-4': 'DBMS Lab', '1-7': 'Placement training',
  '2-0': 'DSA', '2-1': 'CN', '2-2': 'DBMS', '2-3': 'OS', '2-5': 'DBMS Lab', '2-7': 'Mini project',
  '3-0': 'ML', '3-1': 'OS', '3-2': 'Seminar', '3-4': 'OS Lab', '3-6': 'Remedial class',
  '4-0': 'DBMS', '4-1': 'ML', '4-3': 'CN', '4-4': 'Tutorial', '4-6': 'Library',
  '5-0': 'Placement training', '5-2': 'Seminar', '5-3': 'Mini project',
}

// Floating tokens from college life, the nearest (fastest) parallax layer.
// Spread over three screens (band) so only six or seven show at once, kept near the edges.
// Real college terms (only things Campusnex actually handles).
const VOCAB = [
  'P', 'A', 'L', '74%', '85%', 'Shortage', 'USN', 'Sem 5', 'Sec A', 'Batch 2023',
  'IA-1', 'IA-2', 'IA-3', 'CIE', 'SEE', 'Viva', 'Quiz', 'Assignment', '38/50', 'Period 3',
  'Credits 4', 'Elective', 'Odd sem', 'Even sem', 'Sem 3', 'Sem 6', 'Sem 8', 'Sec B', 'Batch 2024', 'Exam hall',
  'LH-101', 'LH-102', 'Seat S-12', 'Invigilator', 'HOD', 'Principal', 'Registrar', 'Circular', 'Notice', 'Timetable',
  'SGPA 8.9', 'CGPA 8.4', 'Grade O', 'Grade A+', 'Results', 'Tutorial', 'Seminar', 'DBMS Lab', 'Mini project',
]

// Deterministic pseudo-random numbers, so the layout is the same on every visit.
const seeded = (seed) => () => {
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

// One screen of tokens: a 5 x 4 grid with each word jittered inside its cell, so words
// spread across the whole screen (and some always land between cards).
const ROWS = 5
const COLS = 4
const PER_SCREEN = 18
const makeTokens = (screens) => {
  const rand = seeded(42)
  const tokens = []
  let word = 0
  for (let screen = 0; screen < screens; screen++) {
    const cells = Array.from({ length: ROWS * COLS }, (_, i) => i).sort(() => rand() - 0.5).slice(0, PER_SCREEN)
    for (const cell of cells) {
      const row = Math.floor(cell / COLS)
      const col = cell % COLS
      tokens.push({
        key: `${screen}-${cell}`,
        t: VOCAB[word++ % VOCAB.length],
        left: `${3 + col * 24 + rand() * 16}%`,
        top: `calc(${screen * 100}vh + ${3 + row * 19 + rand() * 11}vh)`,
        r: Math.round((rand() - 0.5) * 20),
      })
    }
  }
  return tokens
}

const glow = (color, [x, y]) => `radial-gradient(60% 55% at ${x} ${y}, ${color}, transparent 70%)`

// The main time-of-day light. It never moves on its own: it rests at the theme's
// anchor and leans slowly toward the cursor (40% of the way) on devices with a mouse.
function CursorGlow({ color, anchor, follow, transition }) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 28, damping: 22, mass: 1.4 })
  const sy = useSpring(y, { stiffness: 28, damping: 22, mass: 1.4 })
  const pointer = useRef(null)

  useEffect(() => {
    const place = () => {
      const ax = (parseFloat(anchor[0]) / 100) * window.innerWidth
      const ay = (parseFloat(anchor[1]) / 100) * window.innerHeight
      const p = follow ? pointer.current : null
      x.set(p ? ax + (p.x - ax) * 0.4 : ax)
      y.set(p ? ay + (p.y - ay) * 0.4 : ay)
    }
    place()
    const onMove = (e) => {
      pointer.current = { x: e.clientX, y: e.clientY }
      place()
    }
    if (follow) window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('resize', place)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('resize', place)
    }
  }, [anchor, follow, x, y])

  return (
    <motion.div
      className="absolute top-0 left-0 -mt-[40vmax] -ml-[40vmax] h-[80vmax] w-[80vmax] rounded-full"
      style={{ x: sx, y: sy }}
      initial={false}
      animate={{ backgroundImage: `radial-gradient(closest-side, ${color}, transparent)` }}
      transition={transition}
    />
  )
}

function Backdrop({ theme }) {
  const reduce = useReducedMotion()
  const [follow, setFollow] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)')
    const update = () => setFollow(mq.matches && !reduce)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [reduce])
  const { scrollY } = useScroll()
  // Three depths: timetable (far), glows (middle), tokens (near).
  const farY = useTransform(scrollY, (v) => (reduce ? 0 : -(v * 0.06)))
  const midY = useTransform(scrollY, (v) => (reduce ? 0 : -(v * 0.03)))
  const nearY = useTransform(scrollY, (v) => (reduce ? 0 : -(v * 0.22)))
  const transition = useMemo(() => ({ duration: 1.2, ease: [0.22, 1, 0.36, 1] }), [])

  // Enough screens of floating words to cover the page at its current length.
  const [screens, setScreens] = useState(4)
  useEffect(() => {
    const measure = () => {
      const vh = window.innerHeight
      const maxScroll = Math.max(0, document.documentElement.scrollHeight - vh)
      setScreens(Math.ceil((0.22 * maxScroll + vh) / vh) + 1)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(document.body)
    window.addEventListener('resize', measure)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [])
  const tokens = useMemo(() => makeTokens(screens), [screens])

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <motion.div className="absolute inset-0" initial={false} animate={{ backgroundColor: theme.base }} transition={transition} />

      {/* Main light, positioned in viewport coordinates so it lines up with the cursor */}
      <CursorGlow color={theme.glowA} anchor={theme.a} follow={follow} transition={transition} />

      {/* Middle layer: secondary time-of-day light */}
      <motion.div className="absolute -inset-y-24 inset-x-0" style={{ y: midY }}>
        <motion.div className="absolute inset-0" initial={false} animate={{ backgroundImage: glow(theme.glowB, theme.b) }} transition={transition} />
      </motion.div>

      {/* Far layer: the living timetable */}
      <motion.div
        className="absolute inset-x-0 top-0 flex justify-center [mask-image:radial-gradient(ellipse_at_50%_35%,black_15%,transparent_72%)]"
        style={{ y: farY }}
      >
        <div
          className="mt-10 grid w-[min(1200px,140vw)] gap-2"
          style={{ gridTemplateColumns: `56px repeat(${DAYS.length}, minmax(0,1fr))` }}
        >
          <span />
          {DAYS.map((d, i) => (
            <span key={d} className={`text-center text-xs font-medium ${i === TODAY ? 'text-white/35' : 'text-white/15'}`}>{d}</span>
          ))}
          {PERIODS.map((time, row) => (
            <React.Fragment key={time}>
              <span className="pt-5 text-right text-[11px] text-white/15 tabular-nums">{time}</span>
              {DAYS.map((d, col) => {
                const subject = SUBJECTS[`${col}-${row}`]
                const isNow = col === TODAY && row === theme.period
                return (
                  <div key={d} className="relative h-[76px] rounded-xl border border-white/[0.06] bg-white/[0.015]">
                    {subject && <span className="absolute top-2 left-3 text-[11px] font-medium text-white/15">{subject}</span>}
                    {isNow && (
                      <motion.div
                        layoutId="now-period"
                        transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                        className="absolute inset-0 rounded-xl border border-white/20"
                        style={{ background: theme.cell, boxShadow: `0 0 40px 6px ${theme.cell}` }}
                      >
                        <span className="absolute bottom-2 left-3 text-[11px] font-semibold text-white/70">Now</span>
                      </motion.div>
                    )}
                  </div>
                )
              })}
            </React.Fragment>
          ))}
        </div>
      </motion.div>

      {/* Near layer: floating tokens drift faster than the page */}
      <motion.div className="absolute inset-x-0 top-0 hidden sm:block" style={{ y: nearY, height: `${screens * 100}vh` }}>
        {tokens.map((tok) => (
          <span
            key={tok.key}
            className="absolute rounded-md border border-white/10 bg-white/[0.035] px-2 py-1 text-xs font-semibold whitespace-nowrap text-white/25 backdrop-blur-[2px]"
            style={{ left: tok.left, top: tok.top, transform: `rotate(${tok.r}deg)` }}
          >
            {tok.t}
          </span>
        ))}
      </motion.div>
    </div>
  )
}
