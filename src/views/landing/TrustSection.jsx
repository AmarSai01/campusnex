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

// TEST DATA for now: replace the city and note with your own words before launch.
const BUILDER = {
  name: 'Amar Sai',
  city: 'Bengaluru',
  role: 'Founder and developer',
  photo: null, // e.g. '/team/amar.jpg' (put the file in public/team/)
  linkedin: null, // full profile URL
  note: 'Too many students find out about an attendance shortage only when it is too late to fix. I am building Campusnex so the student, the teacher and the HOD all see it in time.',
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
  return (
    <div className="h-full rounded-2xl border border-white/10 bg-night-2/60 p-6 backdrop-blur-sm">
      <div className="flex items-center gap-4">
        {photo ? (
          <img src={photo} alt="" className="h-16 w-16 rounded-full object-cover" />
        ) : (
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-mist">
            <UserRound className="h-7 w-7" aria-hidden="true" />
          </span>
        )}
        <div>
          <p className="font-display text-lg font-semibold text-white">{name}</p>
          <p className="text-sm text-mist">{role}, {city}</p>
        </div>
      </div>
      {note && <p className="mt-4 text-sm leading-relaxed text-white/85">{note}</p>}
      {linkedin && (
        <a href={linkedin} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-300 hover:text-brand-200">
          <ExternalLink className="h-4 w-4" aria-hidden="true" /> LinkedIn profile
        </a>
      )}
    </div>
  )
}

function Screens() {
  const ready = SCREENS.filter((s) => s.src)
  if (!ready.length && !SHOW_SLOTS) return null
  const list = SHOW_SLOTS ? SCREENS : ready
  return (
    <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
      <SectionHeading title="Real software, built by a real person.">
        No stock photos and no made-up customers. Here is who builds Campusnex and what the app looks like inside.
      </SectionHeading>
      {(hasBuilder || SHOW_SLOTS) && (
        <div className="mt-12 max-w-2xl">
          <Builder />
        </div>
      )}
      <Screens />
    </>
  )
}
