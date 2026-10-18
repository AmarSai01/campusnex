import React from 'react'
import { MotionConfig } from 'framer-motion'
import {
  BellRing,
  BookOpenCheck,
  CalendarClock,
  ClipboardList,
  FileSpreadsheet,
  GraduationCap,
  LayoutGrid,
  Megaphone,
  ShieldCheck,
  UserCheck,
} from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import AttendanceRegisterDemo from './AttendanceRegisterDemo'
import RoleDesks from './RoleDesks'
import SeatingDemo from './SeatingDemo'
import ImportDemo from './ImportDemo'

const CONTACT_EMAIL = '__CONTACT_EMAIL__'
const contactHref = (subject) => `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}`

const MODULES = [
  { icon: UserCheck, label: 'Attendance' },
  { icon: BookOpenCheck, label: 'IA marks' },
  { icon: ClipboardList, label: 'Assignments' },
  { icon: CalendarClock, label: 'Timetables' },
  { icon: LayoutGrid, label: 'Exam seating' },
  { icon: Megaphone, label: 'Circulars' },
  { icon: BellRing, label: 'Risk alerts' },
  { icon: FileSpreadsheet, label: 'Reports' },
]

const ACCESS = [
  { item: 'Student records', admin: 'Add, edit, delete', hod: 'Add and edit in own department', faculty: 'View', student: 'Own profile' },
  { item: 'Attendance', admin: 'Everything', hod: 'View whole department', faculty: 'Mark own classes', student: 'Own only' },
  { item: 'IA marks', admin: 'Everything', hod: 'View department, including unpublished', faculty: 'Enter and publish for own classes', student: 'Own, once published' },
  { item: 'Exams and seating', admin: 'Everything', hod: 'Own department', faculty: 'Own department', student: 'Own room and seat' },
  { item: 'Circulars', admin: 'Everyone or any department', hod: 'Own department', faculty: 'Own classes', student: 'Read' },
  { item: 'Deleting records', admin: 'Yes', hod: 'No', faculty: 'No', student: 'No' },
]

const SETUP_STEPS = [
  { title: 'Add departments and courses', body: 'Create each department, its courses and the class timetable. Rooms and teachers are checked for clashes.' },
  { title: 'Import your students', body: 'Upload a CSV with USN, name, semester, department, section and email. Every row is checked before it is saved.' },
  { title: 'Add faculty and choose HODs', body: 'Add teachers, assign their courses and pick the head of each department.' },
  { title: 'Everyone activates their account', body: 'Students and staff set their own password with the email you registered. The term can begin.' },
]

const FAQS = [
  {
    q: 'Who can sign in?',
    a: 'Only people your administrator has added. There is no public sign-up. Each person chooses “Activate your account” on the login page and sets their own password using the email the college registered.',
  },
  {
    q: 'How does the 75% alert work?',
    a: 'Attendance is calculated per subject, with a late counting as half a class. Once at least four classes are held, a student who drops below 75% is flagged, and the student, the subject teacher and the HOD are notified. The same happens when a published IA average falls below 40%.',
  },
  {
    q: 'Can we bring in our existing student list?',
    a: 'Yes. Save your list as a CSV with the columns USN, NAME, SEMESTER, DEPARTMENT, SECTION and EMAIL and upload it. You see every row checked before anything is saved, and students are enrolled in their courses automatically.',
  },
  {
    q: 'What does an HOD see that faculty don’t?',
    a: 'A view-only overview of every student in their department, subject by subject, with at-risk students flagged, plus a check of which classes are behind on attendance, IA publishing or grading. HODs can also add and edit students and post department notices.',
  },
  {
    q: 'Is student data secure?',
    a: 'Access rules run inside the database, so every role only reads and changes what it is allowed to, even if someone tampers with the browser. Students never see other students’ records or unpublished marks.',
  },
  {
    q: 'Does it replace our LMS?',
    a: 'No. Campusnex runs academic operations: attendance, assessment, timetables, exams and communication. It sits alongside a learning management system used for course content.',
  },
]

const Logo = () => (
  <span className="flex items-center gap-2.5">
    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-white">
      <GraduationCap className="h-4.5 w-4.5" aria-hidden="true" />
    </span>
    <span className="font-display text-lg font-bold tracking-tight text-ink">Campusnex</span>
  </span>
)

function SectionHeading({ title, children }) {
  return (
    <div className="max-w-2xl">
      <h2 className="font-display text-3xl font-semibold tracking-tight text-balance text-ink sm:text-4xl">{title}</h2>
      {children && <p className="mt-3 text-base leading-relaxed text-ink-soft sm:text-lg">{children}</p>}
    </div>
  )
}

const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500'

export default function LandingPage({ onSignIn }) {
  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-paper font-sans text-ink">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-sm">
          Skip to content
        </a>

        <header className="sticky top-0 z-40 border-b border-rule bg-paper/90 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
            <a href="#top" className={`rounded-md ${focusRing}`} aria-label="Campusnex home">
              <Logo />
            </a>
            <nav aria-label="Main" className="hidden items-center gap-7 text-sm font-medium text-ink-soft md:flex">
              <a href="#roles" className="hover:text-ink">Roles</a>
              <a href="#exams" className="hover:text-ink">Exams</a>
              <a href="#import" className="hover:text-ink">Import</a>
              <a href="#security" className="hover:text-ink">Security</a>
              <a href="#faq" className="hover:text-ink">FAQ</a>
            </nav>
            <div className="flex items-center gap-1 sm:gap-2">
              <a href={contactHref('Campusnex enquiry')} className={`hidden rounded-lg px-3 py-2 text-sm font-semibold text-ink hover:bg-white sm:inline-block ${focusRing}`}>
                Contact
              </a>
              <button
                type="button"
                onClick={onSignIn}
                className={`rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-ink/90 cursor-pointer ${focusRing}`}
              >
                Sign in
              </button>
            </div>
          </div>
        </header>

        <main id="main">
          {/* Hero: ruled like an attendance register, with its red margin line. */}
          <section id="top" className="relative overflow-hidden border-b border-rule">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent_85%)]"
              style={{ backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0 39px, #d5deec 39px 40px)' }}
            />
            <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-[max(1rem,calc(50%-40rem+1rem))] w-px bg-absent/40 sm:left-[max(1.5rem,calc(50%-40rem+1.5rem))]" />

            <div className="relative mx-auto grid max-w-7xl gap-10 px-4 pt-14 pb-16 sm:px-6 sm:pt-20 xl:grid-cols-[minmax(0,4fr)_minmax(0,6fr)] xl:items-center xl:gap-12 xl:pb-24">
              <div className="max-w-2xl pl-6 sm:pl-8">
                <h1 className="font-display text-[2.6rem] leading-[1.02] font-semibold tracking-[-0.025em] text-balance text-ink sm:text-6xl xl:text-[3.6rem]">
                  Know who is falling below 75% while there’s still time to help.
                </h1>
                <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">
                  Campusnex is the academic portal for colleges. Attendance, IA marks, assignments, timetables, exam
                  seating and circulars, with a workspace for admins, HODs, faculty and students.
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <a
                    href={contactHref('Campusnex pilot request')}
                    className={`rounded-lg bg-brand-500 px-5 py-3 text-sm font-bold text-white shadow-[0_8px_20px_-8px_rgba(255,92,0,0.6)] hover:bg-brand-600 ${focusRing}`}
                  >
                    Request a pilot
                  </a>
                  <button
                    type="button"
                    onClick={onSignIn}
                    className={`rounded-lg border border-ink/15 bg-white px-5 py-3 text-sm font-bold text-ink hover:border-ink/30 cursor-pointer ${focusRing}`}
                  >
                    Sign in to your campus
                  </button>
                </div>
                <p className="mt-6 max-w-md text-sm text-ink-soft">
                  Built around how Indian colleges work: USNs, semesters and sections, IA marks and the 75% attendance rule.
                </p>
              </div>

              <AttendanceRegisterDemo />
            </div>
          </section>

          {/* What's included */}
          <section aria-label="Modules included" className="border-b border-rule bg-white">
            <ul className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-3 px-4 py-6 sm:px-6">
              {MODULES.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-2 text-sm font-medium text-ink">
                  <Icon className="h-4 w-4 text-brand-600" aria-hidden="true" />
                  {label}
                </li>
              ))}
            </ul>
          </section>

          <section id="roles" className="scroll-mt-20 border-b border-rule py-20 sm:py-24">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <SectionHeading title="A desk for every role">
                Each person signs in to a workspace built around their job. Switch desks and try them.
              </SectionHeading>
              <div className="mt-10">
                <RoleDesks />
              </div>
            </div>
          </section>

          <section id="exams" className="scroll-mt-20 border-b border-rule bg-white py-20 sm:py-24">
            <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-center lg:gap-14">
              <SectionHeading title="Exam seating without the spreadsheet">
                Schedule the exam, pick the halls and the branches sharing them. Campusnex seats students so nobody
                sits beside or behind someone from their own branch, and each student sees their room and seat.
              </SectionHeading>
              <SeatingDemo />
            </div>
          </section>

          <section id="import" className="scroll-mt-20 border-b border-rule py-20 sm:py-24">
            <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-center lg:gap-14">
              <div className="order-2 lg:order-1">
                <ImportDemo />
              </div>
              <div className="order-1 lg:order-2">
                <SectionHeading title="Your whole student list in one upload">
                  Export from your current records, save as CSV and upload. Mistakes are caught row by row before
                  anything is saved, and students are enrolled in their courses automatically.
                </SectionHeading>
              </div>
            </div>
          </section>

          <section id="security" className="scroll-mt-20 border-b border-rule bg-white py-20 sm:py-24">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <SectionHeading title="Every role sees only what it should">
                These rules run inside the database, not just on screen, so they hold even if someone tampers with the
                browser.
              </SectionHeading>

              <div className="mt-10 overflow-x-auto rounded-xl border border-rule">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <caption className="sr-only">What each role can see and change</caption>
                  <thead className="bg-paper">
                    <tr>
                      <td className="px-4 py-3" />
                      {['Admin', 'HOD', 'Faculty', 'Student'].map((r) => (
                        <th key={r} scope="col" className="px-4 py-3 font-display text-base font-semibold text-ink">{r}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ACCESS.map((row) => (
                      <tr key={row.item} className="border-t border-rule">
                        <th scope="row" className="px-4 py-3 font-semibold text-ink">{row.item}</th>
                        {['admin', 'hod', 'faculty', 'student'].map((role) => (
                          <td key={role} className="px-4 py-3 text-ink-soft">
                            {row[role]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <ul className="mt-8 grid gap-4 text-sm text-ink-soft sm:grid-cols-3">
                <li className="flex gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" aria-hidden="true" />
                  No public sign-up. Only people your administrator adds can activate an account.
                </li>
                <li className="flex gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" aria-hidden="true" />
                  Deactivating someone removes their access immediately.
                </li>
                <li className="flex gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" aria-hidden="true" />
                  Marks stay hidden from students until their teacher publishes them.
                </li>
              </ul>
            </div>
          </section>

          <section id="setup" className="scroll-mt-20 border-b border-rule py-20 sm:py-24">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <SectionHeading title="Up and running in four steps" />
              <ol className="mt-10 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
                {SETUP_STEPS.map((step, i) => (
                  <li key={step.title} className="border-t-2 border-ink pt-4">
                    <span className="font-display text-3xl font-semibold text-brand-600 tabular-nums">{i + 1}</span>
                    <h3 className="mt-2 font-display text-lg font-semibold text-ink">{step.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-soft">{step.body}</p>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          <section id="plans" className="scroll-mt-20 border-b border-rule bg-white py-20 sm:py-24">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <SectionHeading title="Start with one department">
                Try Campusnex with a single department first, then bring in the rest of the institution.
              </SectionHeading>
              <div className="mt-10 grid gap-6 md:grid-cols-2">
                <div className="rounded-2xl border border-rule p-6 sm:p-8">
                  <h3 className="font-display text-2xl font-semibold text-ink">Department pilot</h3>
                  <p className="mt-2 text-sm text-ink-soft">One department, one term, to prove it works for your college.</p>
                  <ul className="mt-6 space-y-2 text-sm text-ink">
                    <li>Attendance, IA marks and assignments</li>
                    <li>Timetable with clash checks</li>
                    <li>HOD overview and risk alerts</li>
                    <li>CSV student import</li>
                  </ul>
                  <a href={contactHref('Campusnex department pilot')} className={`mt-8 inline-block rounded-lg bg-ink px-5 py-2.5 text-sm font-bold text-white hover:bg-ink/90 ${focusRing}`}>
                    Request a pilot
                  </a>
                </div>
                <div className="rounded-2xl border-2 border-brand-500 p-6 sm:p-8">
                  <h3 className="font-display text-2xl font-semibold text-ink">Whole institution</h3>
                  <p className="mt-2 text-sm text-ink-soft">Every department, with exams and institution-wide reporting.</p>
                  <ul className="mt-6 space-y-2 text-sm text-ink">
                    <li>Everything in the pilot, for all departments</li>
                    <li>Exam timetable, halls and seating plans</li>
                    <li>Institution analytics and circulars</li>
                    <li>Help moving your existing records</li>
                  </ul>
                  <a href={contactHref('Campusnex for our institution')} className={`mt-8 inline-block rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-600 ${focusRing}`}>
                    Talk to us
                  </a>
                </div>
              </div>
            </div>
          </section>

          <section id="faq" className="scroll-mt-20 py-20 sm:py-24">
            <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
              <SectionHeading title="Questions colleges ask" />
              <Accordion type="single" collapsible className="rounded-2xl border border-rule bg-white px-5">
                {FAQS.map((item, i) => (
                  <AccordionItem key={item.q} value={`faq-${i}`} className="border-rule">
                    <AccordionTrigger className="text-left font-display text-base font-semibold text-ink cursor-pointer">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm leading-relaxed text-ink-soft">{item.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </section>
        </main>

        <footer className="bg-ink text-white">
          <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6 md:flex-row md:items-start md:justify-between">
            <div className="max-w-sm">
              <span className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500">
                  <GraduationCap className="h-4.5 w-4.5" aria-hidden="true" />
                </span>
                <span className="font-display text-lg font-bold">Campusnex</span>
              </span>
              <p className="mt-3 text-sm text-white/70">Academic operations for colleges, from attendance to exam seating.</p>
            </div>
            <nav aria-label="Footer" className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm">
              <a href="#roles" className="text-white/75 hover:text-white">Roles</a>
              <a href="#security" className="text-white/75 hover:text-white">Security</a>
              <a href="#exams" className="text-white/75 hover:text-white">Exam seating</a>
              <a href="#faq" className="text-white/75 hover:text-white">FAQ</a>
              <a href="#import" className="text-white/75 hover:text-white">Student import</a>
              <a href={contactHref('Campusnex enquiry')} className="text-white/75 hover:text-white">Contact</a>
              <button type="button" onClick={onSignIn} className="text-left text-white/75 hover:text-white cursor-pointer">
                Sign in
              </button>
            </nav>
          </div>
          <div className="border-t border-white/10">
            <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-white/60 sm:px-6">© {new Date().getFullYear()} Campusnex</p>
          </div>
        </footer>
      </div>
    </MotionConfig>
  )
}
