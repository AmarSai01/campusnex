import React from 'react'
import { X } from 'lucide-react'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { CONTACT_EMAIL, CONTACT_PHONE, contactHref, whatsappHref } from './Sections'

// The privacy policy, opened from the footer. Keep every line true for the live app:
// "Who else handles it" must name any new service that receives college records (for example an
// email sender such as Resend), and change UPDATED whenever the text changes.
const UPDATED = '6 November 2026'

const POINTS = [
  ['Your college owns the data', "Your college decides what goes into Campusnex and who is added. We keep and process it only on your college's behalf. Students or parents with a question about their data should ask their college first."],
  ['What we store', 'Names, email addresses, USNs, departments and classes, attendance, IA marks, results, timetables, assignments, exam seating and notices. Your college enters this; we do not collect it from anywhere else.'],
  ['Who adds people', "Only your college's admin, and HODs for their own department, can add students; only the admin adds staff. There is no public sign-up, and deactivating someone removes their access straight away."],
  ['Students under 18', 'If some students are under 18, your college collects any consent it needs from them or their parents before adding them.'],
  ['Where it is kept', 'In India, in a Mumbai data centre run by our database provider, Supabase. Every connection to Campusnex is encrypted.'],
  ['Who else handles it', "Supabase stores the data and sends the sign-in and password emails. No other company receives your college's records. If we add another service that does, we list it here first."],
  ['Who can see what', 'Each role sees only its own part: a student their own records, a teacher their classes, an HOD their department, the admin the whole college. These rules run inside the database. Marks stay hidden from students until they are published.'],
  ['What we never do', 'We do not sell your data, show ads or use it for anything other than running Campusnex for your college.'],
  ['Pilot requests', 'When you request a pilot, we keep what you enter: your name, role, college, city and mobile number, plus your email, number of departments and message if you add them. We use it only to reply to you.'],
  ['On your device', 'We store only what is needed to keep you signed in. No tracking or advertising cookies.'],
  ['How long we keep it', 'As long as your college uses Campusnex. If your college stops, we give you a copy of your data and delete it within 30 days.'],
  ['Deleting your data', 'Your college can ask us to export or delete its data at any time.'],
  ['If something goes wrong', "If we find a security problem that affects your college's data, we tell your college straight away."],
  ['Changes to this policy', 'If this policy changes, we update the date above and tell your college.'],
]

export default function PrivacyDialog({ open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        data-lenis-prevent
        className="flex max-h-[85dvh] flex-col gap-0 overflow-hidden border border-white/10 bg-night-2 p-0 text-white ring-0 sm:max-w-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 pt-6 pb-4">
          <div>
            <DialogTitle className="font-display text-2xl font-semibold text-white">Privacy policy</DialogTitle>
            <p className="mt-1 text-xs text-mist">Last updated {UPDATED}</p>
          </div>
          <DialogClose className="cursor-pointer rounded-md p-1.5 text-mist hover:bg-white/10 hover:text-white" aria-label="Close">
            <X className="h-4 w-4" aria-hidden="true" />
          </DialogClose>
        </div>
        <div className="overflow-y-auto overscroll-contain px-6 pb-6">
          <DialogDescription className="mt-4 text-[15px] leading-relaxed text-white/85">
            Campusnex keeps your college's academic records. This is what we store, where it lives and who can see it, in plain words.
          </DialogDescription>
          <ol className="mt-2">
            {[...POINTS, ['Questions', null]].map(([title, text], i) => (
              <li key={title} className="grid grid-cols-[28px_minmax(0,1fr)] gap-3 border-b border-white/5 py-3.5 last:border-b-0">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500/15 text-xs font-bold text-brand-300" aria-hidden="true">
                  {i + 1}
                </span>
                <div>
                  <p className="text-[15px] font-semibold text-white">{title}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-mist">
                    {text ?? (
                      <>
                        Write to{' '}
                        <a href={contactHref('Privacy question')} className="text-brand-300 hover:text-brand-200">{CONTACT_EMAIL}</a>
                        {' '}or WhatsApp{' '}
                        <a href={whatsappHref('Hi, I have a question about Campusnex and privacy.')} target="_blank" rel="noopener noreferrer" className="text-brand-300 hover:text-brand-200">
                          {CONTACT_PHONE}
                        </a>
                        .
                      </>
                    )}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </DialogContent>
    </Dialog>
  )
}
