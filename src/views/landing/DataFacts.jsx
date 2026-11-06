import React from 'react'
import { Lock, MapPin, MonitorSmartphone, ShieldCheck } from 'lucide-react'

// "How your data is kept", shown in the About part of the footer.
// Only facts that are true today. Add a backups line once Supabase backups are on (Pro plan).
// Leave `text` null for anything not yet confirmed: it shows as
// a "to fill in" line on the dev server and is left out of the live site.
const DATA_FACTS = [
  { icon: MapPin, text: 'Your data is stored in India, in a Mumbai data centre.' },
  { icon: ShieldCheck, text: 'Access rules run inside the database, so each role sees only what it should.' },
  { icon: Lock, text: 'Every connection to Campusnex is encrypted.' },
  { icon: MonitorSmartphone, text: 'Runs in the browser on phones and laptops, so there is nothing to install.' },
]

const SHOW_SLOTS = import.meta.env.DEV

// Hover: pointing at the box lights the icon chips up one after another; the fact under the
// pointer becomes a soft tile and its chip fills orange.
export default function DataFacts() {
  const facts = DATA_FACTS.filter((f) => f.text || SHOW_SLOTS)
  return (
    <div className="group/facts rounded-2xl border border-white/10 bg-night-2/60 p-6 backdrop-blur-sm">
      <h3 className="font-display text-lg font-semibold text-white">How your data is kept</h3>
      <ul className="mt-4 grid gap-1 md:grid-cols-2">
        {facts.map(({ icon: Icon, text, hint }, i) =>
          text ? (
            <li
              key={text}
              className="group/fact flex items-center gap-3 rounded-xl px-2 py-2 text-sm leading-relaxed text-mist transition-colors duration-300 hover:bg-white/[0.04] hover:text-white motion-reduce:transition-none"
            >
              <span
                style={{ transitionDelay: `${i * 120}ms` }}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-500/15 text-brand-300 transition-[background-color,color,scale,box-shadow] duration-300 group-hover/fact:bg-brand-500 group-hover/fact:text-white group-hover/facts:scale-110 group-hover/facts:shadow-[0_0_14px_rgba(255,92,0,0.55)] motion-reduce:transition-none"
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              {text}
            </li>
          ) : (
            <li key={hint} className="flex gap-3 text-sm leading-relaxed text-amber-100/80">
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" aria-hidden="true" />
              <span><span className="font-semibold text-amber-200">To fill in. </span>{hint}</span>
            </li>
          ),
        )}
      </ul>
    </div>
  )
}
