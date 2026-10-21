import React from 'react'
import { motion } from 'framer-motion'
import { GraduationCap, MessageCircleQuestion, Moon, ShieldCheck } from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { cn } from '@/lib/utils'
import DataFacts from './DataFacts'
import { useRequestPilot } from './PilotRequest'
import { RISK_RULES } from '@/utils/risk'

// Demo address for now (.example never delivers); replace with the real contact email.
export const CONTACT_EMAIL = 'hello@campusnex.example'
export const contactHref = (subject) => `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}`
// The address is shown as text only once a real one is filled in.
const HAS_CONTACT_EMAIL = !CONTACT_EMAIL.startsWith('__')

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

const ROLES = ['Admin', 'HOD', 'Faculty', 'Student']

export function SecuritySection() {
  return (
    <>
      <SectionHeading title="Four roles. Four sets of keys.">
        Admin, HOD, teacher, student: each sees only what's theirs, and marks stay locked until they're published. These
        rules run inside the database, so they hold even if someone tampers with the browser.
      </SectionHeading>
      {/* Phones and small tablets: one card per role, so nothing hides off-screen. */}
      <div className="mt-10 grid gap-4 sm:grid-cols-2 md:hidden">
        {ROLES.map((role, r) => (
          <div key={role} className="rounded-2xl border border-white/10 bg-night-2/60 p-5 backdrop-blur-sm">
            <h3 className="font-display text-lg font-semibold text-white">{role}</h3>
            <dl className="mt-3 divide-y divide-white/5 text-sm">
              {ACCESS.map(([item, ...cells]) => (
                <div key={item} className="flex justify-between gap-4 py-2">
                  <dt className="text-white/85">{item}</dt>
                  <dd className={cn('text-right', cells[r] === 'No' || cells[r] === 'No access' ? 'text-white/55' : 'text-mist')}>{cells[r]}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
      <div className="mt-12 hidden overflow-x-auto rounded-2xl border border-white/10 bg-night-2/60 backdrop-blur-sm md:block">
        <table className="w-full min-w-[760px] text-left text-sm">
          <caption className="sr-only">What each role can see and change</caption>
          <thead>
            <tr className="border-b border-white/10">
              <td className="px-5 py-4" />
              {ROLES.map((r) => (
                <th key={r} scope="col" className="px-5 py-4 font-display text-base font-semibold text-white">{r}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ACCESS.map(([item, ...cells]) => (
              <tr key={item} className="border-t border-white/5">
                <th scope="row" className="px-5 py-3.5 font-medium text-white">{item}</th>
                {cells.map((c, i) => (
                  <td key={i} className={c === 'No' || c === 'No access' ? 'px-5 py-3.5 text-white/55' : 'px-5 py-3.5 text-mist'}>{c}</td>
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
      <SectionHeading title="Bring your student list. Campusnex does the rest." />
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
  const requestPilot = useRequestPilot()
  return (
    <>
      <SectionHeading title="Pilot it in one department. Roll it out when you're convinced." center>
        Try Campusnex with a single department first, then bring in the rest of the institution.
      </SectionHeading>
      <div className="mx-auto mt-12 grid max-w-4xl gap-5 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-night-2/60 p-7 backdrop-blur-sm">
          <h3 className="font-display text-2xl font-semibold text-white">Department pilot</h3>
          <p className="mt-2 text-sm text-mist">Start with one department. Try a demo for a few days, then we shape it around your college.</p>
          <ul className="mt-6 space-y-2.5 text-sm text-white/85">
            <li>Attendance, IA marks and assignments</li>
            <li>Timetable with clash checks</li>
            <li>HOD overview and risk alerts</li>
            <li>CSV student import</li>
          </ul>
          <button type="button" onClick={() => requestPilot('pilot')} className="mt-8 inline-block cursor-pointer rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600">
            Request a pilot
          </button>
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
          <button type="button" onClick={() => requestPilot('institution')} className="mt-8 inline-block cursor-pointer rounded-lg border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10">
            Talk to us
          </button>
        </div>
      </div>
    </>
  )
}

const SHORTAGE = RISK_RULES.attendance.shortage

const FAQS = [
  ['Who can sign in?', 'Only people your administrator has added. There is no public sign-up. Each person chooses “Activate your account” on the login page and sets their own password using the email the college registered.'],
  [`How does the ${SHORTAGE}% alert work?`, `Attendance is calculated per subject, with a late counting as half a class. Students need ${SHORTAGE}% in each subject to sit the SEE. Once at least four classes are held, a student who drops below ${SHORTAGE}% is flagged, and the student, the subject teacher and the HOD are notified. The same happens when a published IA average falls below ${RISK_RULES.marks.fail}%.`],
  ['Can we bring in our existing student list?', 'Yes. Save your list as a CSV with the columns USN, NAME, SEMESTER, DEPARTMENT, SECTION and EMAIL and upload it. Every row is checked before anything is saved, and students are enrolled in their courses automatically.'],
  ['How do semester results work?', 'The admin uploads the university result file as CSV. Grades follow the 10-point scale, and SGPA and CGPA are worked out automatically. Students see their results only after the admin publishes the semester, and they get a notification when that happens.'],
  ['What does an HOD see that faculty don’t?', 'A view-only overview of every student in their department, subject by subject, with at-risk students flagged, plus which classes are behind on attendance, IA publishing or grading. HODs can also add and edit students and post department notices.'],
  ['Can students see marks before they are published?', 'No. IA marks stay hidden until the teacher publishes them, and semester results stay hidden until the admin publishes the semester. HODs can review unpublished IA marks for their department.'],
  ['Does it work on phones?', 'Yes. Campusnex runs in the browser on phones, tablets and laptops, so there is nothing to install. Students can check attendance, marks and their exam seat from their phone.'],
  ['Can one teacher be HOD of more than one department?', 'Yes. The admin picks a head for each department, and the same faculty member can head several. They see every department they head in one overview.'],
  ['Does it replace our LMS?', 'No. Campusnex runs academic operations: attendance, assessment, results, timetables, exams and communication. It sits alongside a learning management system used for course content.'],
]

export function Faq() {
  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <div>
        <SectionHeading title="What your principal will ask">
          Didn't find your question? Write to us and we'll answer it.
        </SectionHeading>
        <a
          href={contactHref('Question about Campusnex')}
          className="mt-6 inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
        >
          <MessageCircleQuestion className="h-4 w-4" aria-hidden="true" />
          Ask us
        </a>
      </div>
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

// The day ends: the page closes at night, with tomorrow already planned.
export function ClosingCall({ onSignIn }) {
  const requestPilot = useRequestPilot()
  return (
    <div className="mx-auto max-w-3xl text-center">
      <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-mist">
        <Moon className="h-3.5 w-3.5 text-brand-300" aria-hidden="true" />
        9:30 pm, campus closed
      </span>
      <motion.h2
        initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
        whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.6 }}
        className="mt-6 font-display text-4xl font-semibold tracking-tight text-balance text-white sm:text-6xl"
      >
        Tomorrow's 8:45 roll call is already set up.
      </motion.h2>
      <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-mist sm:text-lg">
        Timetable checked for clashes, seats allotted, shortage alerts sent. That could be your college tomorrow.
      </p>
      <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <button type="button" onClick={() => requestPilot('pilot')} className="cursor-pointer rounded-lg bg-brand-500 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-600">
          Request a pilot
        </button>
        <button type="button" onClick={onSignIn} className="cursor-pointer rounded-lg border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10">
          Sign in to your campus
        </button>
      </div>
    </div>
  )
}

const FOOTER_LINKS = [
  ['Product', [['A day at college', '#day'], ['Features', '#features'], ['Security', '#security'], ['Plans', '#plans']]],
  ['For your role', [['Admin', '#security'], ['HOD', '#security'], ['Faculty', '#security'], ['Student', '#security']]],
  ['Help', [['FAQ', '#faq'], ['Contact', null], ['The Last Bench', '#trust']]],
]


export function Footer({ onSignIn }) {
  const requestPilot = useRequestPilot()
  return (
    <footer id="about" className="relative scroll-mt-20 overflow-hidden border-t border-white/10">
      <div className="relative mx-auto grid max-w-6xl grid-cols-2 gap-x-6 gap-y-10 px-4 pt-16 pb-12 sm:grid-cols-3 sm:px-6 lg:grid-cols-[minmax(0,5fr)_repeat(3,minmax(0,2fr))] lg:gap-10">
        <div className="col-span-2 max-w-md sm:col-span-3 lg:col-span-1">
          <span className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500 shadow-[0_0_30px_-6px_rgba(255,92,0,0.6)]">
              <GraduationCap className="h-6 w-6" aria-hidden="true" />
            </span>
            <span className="font-display text-2xl font-bold tracking-tight text-white">Campusnex</span>
          </span>
          <p className="mt-4 text-sm text-white/85">The academic portal built for Indian colleges.</p>
          <p className="mt-2 text-sm leading-relaxed text-mist">
            Built for engineering, degree and diploma colleges, with 10-point grading, USN-based records and the {SHORTAGE}%
            attendance rule for SEE eligibility.
          </p>
          {HAS_CONTACT_EMAIL && (
            <a href={contactHref('Campusnex enquiry')} className="mt-3 inline-block text-sm text-white/80 hover:text-white">
              {CONTACT_EMAIL}
            </a>
          )}
          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" onClick={() => requestPilot('pilot')} className="cursor-pointer rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600">
              Request a pilot
            </button>
            <button type="button" onClick={onSignIn} className="cursor-pointer rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10">
              Sign in
            </button>
          </div>
        </div>
        {FOOTER_LINKS.map(([group, links]) => (
          <nav key={group} aria-label={group} className="text-sm">
            <p className="font-semibold text-white">{group}</p>
            <ul className="mt-3 space-y-1 lg:space-y-2.5">
              {links.map(([label, href]) => (
                <li key={label}>
                  <a href={href ?? contactHref('Campusnex enquiry')} className="inline-block py-1.5 text-mist hover:text-white lg:py-0">{label}</a>
                </li>
              ))}
              {group === 'Help' && (
                <li>
                  <button type="button" onClick={onSignIn} className="cursor-pointer py-1.5 text-mist hover:text-white lg:py-0">Sign in</button>
                </li>
              )}
            </ul>
          </nav>
        ))}
      </div>

      <div className="relative mx-auto max-w-6xl px-4 pb-10 sm:px-6">
        <DataFacts />
      </div>

      <div aria-hidden="true" className="pointer-events-none relative -mb-[0.18em] flex items-center justify-center gap-[0.12em] text-[15vw] leading-none select-none">
        <span className="flex h-[0.8em] w-[0.8em] items-center justify-center rounded-[0.18em] bg-brand-500/15">
          <GraduationCap className="h-[0.55em] w-[0.55em] text-brand-400/40" strokeWidth={2.25} />
        </span>
        <span className="bg-gradient-to-b from-white/[0.14] to-white/[0.02] bg-clip-text font-display font-extrabold tracking-tighter text-transparent">
          Campusnex
        </span>
      </div>
      <p className="relative mx-auto max-w-6xl border-t border-white/5 px-4 py-5 text-xs text-white/55 sm:px-6">© {new Date().getFullYear()} Campusnex</p>
    </footer>
  )
}
