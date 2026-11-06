import React from 'react'
import { ExternalLink, ImageIcon, UserRound } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SectionHeading } from './Sections'

// The Last Bench: who is behind Campusnex and what the product really looks like.
// How data is kept lives in the About part of the footer (DataFacts.jsx).
//
// Fill in the empty values below before launch. Anything left empty (null) is shown as a
// dashed "to fill in" slot on the dev server and is left out of the live site, so the
// public page never shows a placeholder.

// Check the city before launch.
const BUILDER = {
  name: 'Amar Sai',
  city: 'Bengaluru',
  role: 'Founder and developer',
  photo: '/team/amar.jpg',
  linkedin: null, // full profile URL
  note: 'Every semester, some students learn about an attendance shortage only when the eligibility list goes up, and by then nothing can be fixed. I built Campusnex so the student, the subject teacher and the HOD all see it weeks earlier, while there is still time to act. Try it with one department, and judge it by what changes.',
}

// Real screenshots of the signed-in app, taken with test data. Put the files in public/screens/.
const SCREENS = [
  { role: 'Admin', caption: 'Institution analytics', src: null },
  { role: 'HOD', caption: 'Department overview', src: null },
  { role: 'Faculty', caption: 'Marking attendance', src: null },
  { role: 'Student', caption: 'Attendance and results', src: null },
]

const SHOW_SLOTS = import.meta.env.DEV

function Slot({ children, className }) {
  return (
    <div className={cn('rounded-2xl border border-dashed border-amber-300/50 bg-amber-300/[0.04] p-5', className)}>
      <span className="rounded-full bg-amber-300/15 px-2 py-0.5 text-[11px] font-semibold text-amber-200">To fill in</span>
      <div className="mt-3 text-sm text-amber-100/80">{children}</div>
    </div>
  )
}

function Builder() {
  const { name, city, role, photo, linkedin, note } = BUILDER
  if (!name || !city) {
    return SHOW_SLOTS ? (
      <Slot className="h-full">
        Who builds Campusnex: your name, city, a photo and a LinkedIn link, plus one or two sentences on why you are
        building it. Edit <code className="text-amber-200">BUILDER</code> in TrustSection.jsx.
      </Slot>
    ) : null
  }
  // Photo on the left, name and note on its right; stacked and centred on phones.
  const avatar = 'h-36 w-36 shrink-0 rounded-full ring-4 ring-white/10 sm:h-40 sm:w-40 xl:h-58 xl:w-58'
  return (
    <div className={cn('group grid h-full items-center gap-6 rounded-[20px] border border-white/10 bg-night-2/60 p-6 text-center backdrop-blur-sm sm:grid-cols-[auto_minmax(0,1fr)] sm:gap-8 sm:p-8 sm:text-left xl:gap-9 xl:p-10', 'transition-colors duration-500 hover:border-brand-500/40')}>
      {photo ? (
        // Hover: the photo lifts a little with a warm orange glow beneath it.
        <span
          className={cn(
            'relative mx-auto block rounded-full',
            'transition-[transform,box-shadow] duration-500 ease-out group-hover:-translate-y-1.5 group-hover:shadow-[0_24px_60px_-14px_rgba(255,92,0,0.6)] motion-reduce:transition-none motion-reduce:group-hover:translate-y-0',
          )}
        >
          <span className={cn(avatar, 'block overflow-hidden')}>
            <img
              src={photo}
              alt=""
              className="h-full w-full object-cover"
            />
          </span>
        </span>
      ) : (
        <span className={cn(avatar, 'mx-auto flex items-center justify-center bg-white/10 text-mist')}>
          <UserRound className="h-10 w-10" aria-hidden="true" />
        </span>
      )}
      <div>
        <p className="font-display text-2xl font-semibold text-white sm:text-3xl xl:text-4xl">{name}</p>
        <p className="mt-1 text-sm text-mist sm:text-base xl:text-lg">{role}, {city}</p>
        {note && (
          <p className="mt-4 text-base leading-relaxed text-white/88 xl:mt-5 xl:text-[19px]">
            {note}
          </p>
        )}
        {linkedin && (
          <a href={linkedin} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-300 hover:text-brand-200">
            <ExternalLink className="h-4 w-4" aria-hidden="true" /> LinkedIn profile
          </a>
        )}
      </div>
    </div>
  )
}

function Screens() {
  const ready = SCREENS.filter((s) => s.src)
  if (!ready.length && !SHOW_SLOTS) return null
  const list = SHOW_SLOTS ? SCREENS : ready
  return (
    <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {list.map((s) =>
        s.src ? (
          <figure key={s.role} className="overflow-hidden rounded-2xl border border-white/10 bg-night-2/60">
            <img src={s.src} alt={`${s.role} screen: ${s.caption}`} loading="lazy" className="aspect-[4/3] w-full object-cover object-top" />
            <figcaption className="px-4 py-3 text-sm">
              <span className="font-semibold text-white">{s.role}</span> <span className="text-mist">{s.caption}</span>
            </figcaption>
          </figure>
        ) : (
          <Slot key={s.role}>
            <span className="flex aspect-[4/3] flex-col items-center justify-center gap-2 text-center">
              <ImageIcon className="h-6 w-6 text-amber-300" aria-hidden="true" />
              Screenshot of the {s.role} screen ({s.caption.toLowerCase()}), taken with test data.
            </span>
          </Slot>
        )
      )}
    </div>
  )
}

export default function TrustSection() {
  const hasBuilder = Boolean(BUILDER.name && BUILDER.city)
  return (
    <>
      {/* Desktop: the builder card on the left, the heading on the right. Phones: heading first. */}
      <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,8fr)_minmax(0,4fr)] lg:gap-14">
        <div className="lg:order-2">
          <SectionHeading title="Real software, built by a real person.">
            No stock photos and no made-up customers. Here is who builds Campusnex and what the app looks like inside.
          </SectionHeading>
        </div>
        {(hasBuilder || SHOW_SLOTS) && (
          <div className="lg:order-1">
            <Builder />
          </div>
        )}
      </div>
      <Screens />
    </>
  )
}
