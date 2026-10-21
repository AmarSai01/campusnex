import React from 'react'
import { Lock, MapPin, MonitorSmartphone, ServerCog, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

// "How your data is kept", shown in the About part of the footer.
// Only facts that are true today. Leave `text` null for anything not yet confirmed: it shows as
// a "to fill in" line on the dev server and is left out of the live site.
const DATA_FACTS = [
  { icon: MapPin, text: 'Your data is stored in India, in a Mumbai data centre.' },
  { icon: ShieldCheck, text: 'Access rules run inside the database, so each role sees only what it should.' },
  { icon: Lock, text: 'Every connection to Campusnex is encrypted.' },
  { icon: MonitorSmartphone, text: 'Runs in the browser on phones and laptops, so there is nothing to install.' },
  { icon: ServerCog, text: null, hint: 'Backups: confirm the backup schedule in Supabase, then describe it here.' },
]

const SHOW_SLOTS = import.meta.env.DEV

export default function DataFacts() {
  const facts = DATA_FACTS.filter((f) => f.text || SHOW_SLOTS)
  return (
    <div className="rounded-2xl border border-white/10 bg-night-2/60 p-6 backdrop-blur-sm">
      <h3 className="font-display text-lg font-semibold text-white">How your data is kept</h3>
      <ul className="mt-4 grid gap-3 md:grid-cols-2">
        {facts.map(({ icon: Icon, text, hint }) => (
          <li key={text ?? hint} className={cn('flex gap-3 text-sm leading-relaxed', text ? 'text-mist' : 'text-amber-100/80')}>
            <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', text ? 'text-brand-300' : 'text-amber-300')} aria-hidden="true" />
            {text ?? <span><span className="font-semibold text-amber-200">To fill in. </span>{hint}</span>}
          </li>
        ))}
      </ul>
    </div>
  )
}
