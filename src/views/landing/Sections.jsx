import React from 'react'
import { motion } from 'framer-motion'
import { GraduationCap, ShieldCheck } from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

export const CONTACT_EMAIL = '__CONTACT_EMAIL__'
export const contactHref = (subject) => `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}`

export function SectionHeading({ title, children, center = false }) {
  return (
    <div className={center ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}>
      <motion.h2
        initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
        whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.5 }}
        className="font-display text-3xl font-semibold tracking-tight text-balance text-white sm:text-5xl"
      >
        {title}
      </motion.h2>
      {children && <p className="mt-4 text-base leading-relaxed text-mist sm:text-lg">{children}</p>}
    </div>
  )
}

const ACCESS = [
  ['Student records', 'Add, edit, delete', 'Add and edit, own department', 'View', 'Own profile'],
  ['Attendance', 'Everything', 'View whole department', 'Mark own classes', 'Own only'],
  ['IA marks', 'Everything', 'View department, incl. unpublished', 'Enter and publish, own classes', 'Own, once published'],
  ['Semester results', 'Import and publish', 'View department', 'No access', 'Own, once published'],
  ['Exams and seating', 'Everything', 'Own department', 'Own department', 'Own room and seat'],
  ['Deleting records', 'Yes', 'No', 'No', 'No'],
]

export function SecuritySection() {
  return (
    <>
      <SectionHeading title="Every role sees only what it should">
        These rules run inside the database, not just on screen, so they hold even if someone tampers with the browser.
      </SectionHeading>
      <div className="mt-12 overflow-x-auto rounded-2xl border border-white/10 bg-night-2/60 backdrop-blur-sm">
        <table className="w-full min-w-[760px] text-left text-sm">
          <caption className="sr-only">What each role can see and change</caption>
          <thead>
            <tr className="border-b border-white/10">
              <td className="px-5 py-4" />
              {['Admin', 'HOD', 'Faculty', 'Student'].map((r) => (
                <th key={r} scope="col" className="px-5 py-4 font-display text-base font-semibold text-white">{r}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ACCESS.map(([item, ...cells]) => (
              <tr key={item} className="border-t border-white/5">
                <th scope="row" className="px-5 py-3.5 font-medium text-white">{item}</th>
                {cells.map((c, i) => (
                  <td key={i} className={c === 'No' || c === 'No access' ? 'px-5 py-3.5 text-white/35' : 'px-5 py-3.5 text-mist'}>{c}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="mt-10 grid gap-6 sm:grid-cols-3">
        {[
          'No public sign-up. Only people your administrator adds can activate an account.',
          'Deactivating someone removes their access immediately.',
          'Marks and results stay hidden from students until they are published.',
        ].map((t) => (
          <li key={t} className="flex gap-3 text-sm leading-relaxed text-mist">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-400" aria-hidden="true" />
            {t}
          </li>
        ))}
      </ul>
    </>
  )
}

const STEPS = [
  ['Add departments and courses', 'Create departments, courses and the class timetable. Rooms and teachers are checked for clashes.'],
  ['Import your students', 'Upload a CSV with USN, name, semester, department, section and email. Every row is checked first.'],
  ['Add faculty and choose HODs', 'Add teachers, assign their courses and pick the head of each department.'],
  ['Everyone activates their account', 'Students and staff set their own password with the email you registered.'],
]

export function SetupSteps() {
  return (
    <>
      <SectionHeading title="Up and running in four steps" />
      <ol className="relative mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
        <div aria-hidden="true" className="absolute top-5 right-0 left-0 hidden h-px bg-gradient-to-r from-brand-500/0 via-brand-500/60 to-brand-500/0 lg:block" />
        {STEPS.map(([title, body], i) => (
          <motion.li
            key={title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ delay: i * 0.12, duration: 0.45 }}
            className="relative"
          >
            <span className="relative flex h-10 w-10 items-center justify-center rounded-full border border-brand-400/50 bg-night font-display text-base font-semibold text-brand-300">
              {i + 1}
            </span>
            <h3 className="mt-5 font-display text-lg font-semibold text-white">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-mist">{body}</p>
          </motion.li>
        ))}
      </ol>
    </>
  )
}

export function Plans() {
  return (
    <>
      <SectionHeading title="Start with one department" center>
        Try Campusnex with a single department first, then bring in the rest of the institution.
      </SectionHeading>
      <div className="mx-auto mt-12 grid max-w-4xl gap-5 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-night-2/60 p-7 backdrop-blur-sm">
          <h3 className="font-display text-2xl font-semibold text-white">Department pilot</h3>
          <p className="mt-2 text-sm text-mist">One department, one term, to prove it works for your college.</p>
          <ul className="mt-6 space-y-2.5 text-sm text-white/85">
            <li>Attendance, IA marks and assignments</li>
            <li>Timetable with clash checks</li>
            <li>HOD overview and risk alerts</li>
            <li>CSV student import</li>
          </ul>
          <a href={contactHref('Campusnex department pilot')} className="mt-8 inline-block rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-night hover:bg-white/90">
            Request a pilot
          </a>
        </div>
        <div className="relative rounded-2xl border border-brand-500/60 bg-night-2/60 p-7 shadow-[0_0_60px_-20px_rgba(255,92,0,0.5)] backdrop-blur-sm">
          <h3 className="font-display text-2xl font-semibold text-white">Whole institution</h3>
          <p className="mt-2 text-sm text-mist">Every department, with exams, results and institution-wide reporting.</p>
          <ul className="mt-6 space-y-2.5 text-sm text-white/85">
            <li>Everything in the pilot, for all departments</li>
            <li>Exam timetable, halls and seating plans</li>
            <li>Semester results with SGPA and CGPA</li>
            <li>Help moving your existing records</li>
          </ul>
          <a href={contactHref('Campusnex for our institution')} className="mt-8 inline-block rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600">
            Talk to us
          </a>
        </div>
      </div>
    </>
  )
}

const FAQS = [
  ['Who can sign in?', 'Only people your administrator has added. There is no public sign-up. Each person chooses “Activate your account” on the login page and sets their own password using the email the college registered.'],
  ['How does the 75% alert work?', 'Attendance is calculated per subject, with a late counting as half a class. Once at least four classes are held, a student who drops below 75% is flagged, and the student, the subject teacher and the HOD are notified. The same happens when a published IA average falls below 40%.'],
  ['Can we bring in our existing student list?', 'Yes. Save your list as a CSV with the columns USN, NAME, SEMESTER, DEPARTMENT, SECTION and EMAIL and upload it. Every row is checked before anything is saved, and students are enrolled in their courses automatically.'],
  ['How do semester results work?', 'The admin uploads the university result file as CSV. Grades follow the 10-point scale, and SGPA and CGPA are worked out automatically. Students see their results only after the admin publishes the semester, and they get a notification when that happens.'],
  ['What does an HOD see that faculty don’t?', 'A view-only overview of every student in their department, subject by subject, with at-risk students flagged, plus which classes are behind on attendance, IA publishing or grading. HODs can also add and edit students and post department notices.'],
  ['Does it replace our LMS?', 'No. Campusnex runs academic operations: attendance, assessment, results, timetables, exams and communication. It sits alongside a learning management system used for course content.'],
]

export function Faq() {
  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <SectionHeading title="Questions colleges ask" />
      <Accordion type="single" collapsible className="rounded-2xl border border-white/10 bg-night-2/60 px-5 backdrop-blur-sm">
        {FAQS.map(([q, a], i) => (
          <AccordionItem key={q} value={`faq-${i}`} className="border-white/10">
            <AccordionTrigger className="text-left font-display text-base font-semibold text-white hover:no-underline cursor-pointer">
              {q}
            </AccordionTrigger>
            <AccordionContent className="text-sm leading-relaxed text-mist">{a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}

export function Footer({ onSignIn }) {
  return (
    <footer className="border-t border-white/10">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm">
          <span className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500">
              <GraduationCap className="h-4.5 w-4.5" aria-hidden="true" />
            </span>
            <span className="font-display text-lg font-bold text-white">Campusnex</span>
          </span>
          <p className="mt-3 text-sm text-mist">The academic portal built for Indian colleges.</p>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-x-12 gap-y-2.5 text-sm">
          <a href="#day" className="text-mist hover:text-white">A day at college</a>
          <a href="#security" className="text-mist hover:text-white">Security</a>
          <a href="#features" className="text-mist hover:text-white">Features</a>
          <a href="#faq" className="text-mist hover:text-white">FAQ</a>
          <a href="#plans" className="text-mist hover:text-white">Plans</a>
          <a href={contactHref('Campusnex enquiry')} className="text-mist hover:text-white">Contact</a>
          <button type="button" onClick={onSignIn} className="text-left text-mist hover:text-white cursor-pointer">Sign in</button>
        </nav>
      </div>
      <p className="mx-auto max-w-6xl border-t border-white/5 px-4 py-5 text-xs text-white/40 sm:px-6">© {new Date().getFullYear()} Campusnex</p>
    </footer>
  )
}
