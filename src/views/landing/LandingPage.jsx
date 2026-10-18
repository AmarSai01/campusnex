import React, { useState } from 'react'
import {
  ArrowRight,
  Award,
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  CheckSquare,
  Clock,
  GraduationCap,
  Layers,
  Megaphone,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

const chartData = [
  { day: 'Mon', present: 92, absent: 8 },
  { day: 'Tue', present: 88, absent: 12 },
  { day: 'Wed', present: 95, absent: 5 },
  { day: 'Thu', present: 90, absent: 10 },
  { day: 'Fri', present: 86, absent: 14 },
]

const features = [
  {
    icon: CheckSquare,
    title: 'Attendance that stays current',
    description:
      'Bulk mark sessions, flag shortages early, and give students a live view of their standing.',
  },
  {
    icon: Award,
    title: 'IA marks with clear publish flow',
    description:
      'Faculty enter assessments, publish when ready, and students see trends without spreadsheet chaos.',
  },
  {
    icon: Clock,
    title: 'Conflict-aware timetables',
    description:
      'Build department schedules with overlap checks so rooms, faculty, and sections stay aligned.',
  },
  {
    icon: Layers,
    title: 'Exam seating in one workspace',
    description:
      'Plan exam slots, allocate halls, and publish seating maps students can actually find.',
  },
]

const steps = [
  {
    icon: Users,
    title: 'Onboard your campus roles',
    description:
      'Provision admins, faculty, and students with department, section, and USN context.',
  },
  {
    icon: BookOpen,
    title: 'Wire courses and calendars',
    description:
      'Allocate faculty, publish the academic calendar, and keep broadcasts in one channel.',
  },
  {
    icon: BarChart3,
    title: 'Operate day-to-day academics',
    description:
      'Attendance, IA, assignments, and exams run in role-aware workspaces with live insight.',
  },
]

const testimonials = [
  {
    quote:
      'Campusnex replaced three spreadsheets and a WhatsApp group for our CS department. Attendance shortfalls show up before the semester ends.',
    name: 'Dr. Alan Turing',
    role: 'Professor & HOD',
    seed: 'Alan',
  },
  {
    quote:
      'Publishing IA marks used to mean emailing PDFs. Now students see results the moment we hit publish — and we get fewer “where are my marks?” messages.',
    name: 'Dr. Ada Lovelace',
    role: 'Faculty, DBMS',
    seed: 'Ada',
  },
  {
    quote:
      'As a student, the hub is the only place I need: timetable, seating, assignments, and campus bulletins without hunting across portals.',
    name: 'Alice Smith',
    role: 'B.Tech CSE · Sec A',
    seed: 'Alice',
  },
  {
    quote:
      'Exam seating used to take a full weekend. Hall allocation and conflict checks cut that to an afternoon.',
    name: 'Dr. Sarah Connor',
    role: 'Dean & Registrar',
    seed: 'Sarah',
  },
  {
    quote:
      'The faculty directory and calendar finally live next to coursework. Advising hours are visible without a separate site.',
    name: 'Bob Johnson',
    role: 'B.Tech CSE · Sec A',
    seed: 'Bob',
  },
  {
    quote:
      'Institution analytics give leadership a single pulse on attendance, assessments, and engagement — without waiting on monthly reports.',
    name: 'David Lee',
    role: 'B.Tech CSE · Sec B',
    seed: 'David',
  },
]

const plans = [
  {
    name: 'Department',
    price: 'Pilot',
    description: 'Ideal for a single department proving the workflow.',
    features: [
      'Up to 500 students',
      'Attendance & IA workspace',
      'Timetable builder',
      'Campus broadcasts',
      'Demo data & role switcher',
    ],
    cta: 'Start campus pilot',
    highlighted: false,
  },
  {
    name: 'Institution',
    price: 'Scale',
    description: 'Multi-department ERP with exams, seating, and analytics.',
    features: [
      'Unlimited departments',
      'Exam timetable & seating',
      'Institution analytics',
      'User & course directory',
      'Priority onboarding support',
    ],
    cta: 'Talk to registrar desk',
    highlighted: true,
  },
]

const faqs = [
  {
    q: 'What is Campusnex?',
    a: 'Campusnex is an academic management portal for institutions — covering attendance, IA marks, assignments, timetables, exam seating, calendars, and role-based dashboards for admin, faculty, and students.',
  },
  {
    q: 'Who can sign in?',
    a: 'Accounts are institution-provisioned. There is no public self-signup. Use the demo switcher on the login screen to explore admin, faculty, and student workspaces.',
  },
  {
    q: 'Does it replace our LMS?',
    a: 'Campusnex focuses on campus operations and academic ERP workflows. It complements — rather than replaces — content-heavy LMS tools.',
  },
  {
    q: 'Is student data secure?',
    a: 'Campusnex runs on Supabase (PostgreSQL) with row-level security, so every role only sees and changes the records it is allowed to. Institutions can host it on their own Supabase project.',
  },
]

function ProductPreview() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-card-hover ring-1 ring-black/5">
      <div className="flex items-center justify-between border-b border-border bg-muted/60 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500 text-white">
            <GraduationCap className="h-4 w-4" />
          </div>
          <span className="text-sm font-bold text-foreground">Campusnex · Analytics</span>
        </div>
        <Badge variant="secondary" className="rounded-full text-[10px] font-semibold">
          Live preview
        </Badge>
      </div>

      <div className="grid gap-4 p-4 md:grid-cols-[180px_1fr]">
        <div className="hidden space-y-1 rounded-xl bg-muted/50 p-3 md:block">
          {['Overview', 'Attendance', 'IA Marks', 'Timetable', 'Exams'].map((item, i) => (
            <div
              key={item}
              className={cn(
                'rounded-lg px-3 py-2 text-xs font-semibold',
                i === 0
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-muted-foreground'
              )}
            >
              {item}
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { label: 'Avg attendance', value: '91%', tone: 'text-emerald-600' },
              { label: 'Open assignments', value: '18', tone: 'text-brand-600' },
              { label: 'IA published', value: '12', tone: 'text-sky-600' },
              { label: 'Exam halls', value: '6', tone: 'text-amber-600' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-border bg-background p-3"
              >
                <p className="text-[10px] font-bold tracking-wide text-muted-foreground uppercase">
                  {stat.label}
                </p>
                <p className={cn('mt-1 text-xl font-extrabold', stat.tone)}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          <div className="h-44 rounded-xl border border-border bg-background p-3">
            <p className="mb-2 text-xs font-bold text-foreground">Weekly presence</p>
            <ResponsiveContainer width="100%" height="85%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid #e7e5e4',
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="present" fill="#ff5c00" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LandingPage({ onSignIn }) {
  const [activeStep, setActiveStep] = useState(0)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <a href="#top" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-white shadow-glow">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="text-lg font-extrabold tracking-tight">Campusnex</span>
          </a>

          <nav className="hidden items-center gap-7 text-sm font-medium text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#workflow" className="hover:text-foreground">Workflow</a>
            <a href="#pricing" className="hover:text-foreground">Plans</a>
            <a href="#faq" className="hover:text-foreground">FAQ</a>
          </nav>

          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={onSignIn} className="hidden sm:inline-flex">
              Log in
            </Button>
            <Button onClick={onSignIn} className="rounded-lg bg-brand-500 hover:bg-brand-600">
              Start free trial
            </Button>
          </div>
        </div>
      </header>

      <main id="top">
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(ellipse_at_top,_rgba(255,92,0,0.12),_transparent_60%)]" />
          <div className="relative mx-auto max-w-6xl px-4 pt-16 pb-10 text-center sm:px-6 sm:pt-24">
            <p className="mb-5 text-sm font-semibold tracking-wide text-brand-600 uppercase">
              Campusnex
            </p>
            <h1 className="mx-auto max-w-3xl text-4xl font-extrabold tracking-tight text-balance text-foreground sm:text-5xl lg:text-6xl">
              Use Campusnex to turn campus operations into{' '}
              <span className="relative inline-block">
                clarity
                <span className="absolute inset-x-0 -bottom-1 h-1 rounded-full bg-brand-500/80" />
              </span>
              .
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
              Attendance, IA marks, timetables, exam seating, and campus broadcasts —
              one academic portal for admins, faculty, and students.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                size="lg"
                onClick={onSignIn}
                className="h-11 rounded-lg bg-brand-500 px-6 text-sm font-bold hover:bg-brand-600"
              >
                Start free trial
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="lg" asChild className="h-11 text-sm font-semibold">
                <a href="#features">
                  See how it works
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
            </div>
            <div className="mt-8 flex items-center justify-center gap-3">
              <div className="flex -space-x-2">
                {['Sarah', 'Alan', 'Ada', 'Alice'].map((seed) => (
                  <Avatar key={seed} className="size-8 border-2 border-white">
                    <AvatarImage
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`}
                    />
                    <AvatarFallback>{seed.slice(0, 1)}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                Trusted by academic teams across departments
              </p>
            </div>
          </div>

          <div className="mx-auto max-w-5xl px-4 pb-20 sm:px-6">
            <ProductPreview />
          </div>
        </section>

        <section id="features" className="border-t border-border bg-muted/40 py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                See the whole semester. Fix bottlenecks. Keep every role aligned.
              </h2>
              <p className="mt-3 text-muted-foreground">
                Purpose-built modules for the academic workflows campuses actually run.
              </p>
            </div>

            <div className="mt-12 grid gap-5 sm:grid-cols-2">
              {features.map((feature) => {
                const Icon = feature.icon
                return (
                  <Card
                    key={feature.title}
                    className="rounded-2xl border-border bg-white shadow-subtle"
                  >
                    <CardHeader className="gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
                        <Icon className="h-5 w-5" />
                      </div>
                      <CardTitle className="text-lg font-bold">{feature.title}</CardTitle>
                      <CardDescription className="text-sm leading-relaxed">
                        {feature.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex h-28 items-end gap-2 rounded-xl bg-muted/70 p-4">
                        {[40, 65, 50, 80, 70, 90].map((h, i) => (
                          <div
                            key={i}
                            className="flex-1 rounded-t-md bg-brand-500/80"
                            style={{ height: `${h}%`, opacity: 0.45 + i * 0.08 }}
                          />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>

        <section id="workflow" className="py-20">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                A clear path to impact. Applied every term.
              </h2>
              <p className="mt-3 text-muted-foreground">
                From provisioning users to publishing exam seating — Campusnex keeps the
                academic loop closed.
              </p>
              <div className="mt-8 space-y-3">
                {steps.map((step, index) => {
                  const Icon = step.icon
                  const active = activeStep === index
                  return (
                    <button
                      key={step.title}
                      type="button"
                      onClick={() => setActiveStep(index)}
                      className={cn(
                        'flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-all',
                        active
                          ? 'border-brand-200 bg-brand-50/60 shadow-subtle'
                          : 'border-transparent hover:border-border hover:bg-muted/50'
                      )}
                    >
                      <div
                        className={cn(
                          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                          active
                            ? 'bg-brand-500 text-white'
                            : 'bg-muted text-muted-foreground'
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-bold text-foreground">{step.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {step.description}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            <Card className="rounded-2xl border-border bg-muted/30 shadow-card">
              <CardHeader>
                <div className="flex items-center gap-2 text-brand-600">
                  <Sparkles className="h-4 w-4" />
                  <span className="text-xs font-bold tracking-wide uppercase">
                    Step {activeStep + 1}
                  </span>
                </div>
                <CardTitle className="text-xl font-bold">
                  {steps[activeStep].title}
                </CardTitle>
                <CardDescription>{steps[activeStep].description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { icon: ShieldCheck, label: 'Role-aware permissions' },
                  { icon: CalendarDays, label: 'Academic calendar sync' },
                  { icon: Megaphone, label: 'Campus-wide broadcasts' },
                ].map((item) => {
                  const Icon = item.icon
                  return (
                    <div
                      key={item.label}
                      className="flex items-center gap-3 rounded-xl border border-border bg-white px-4 py-3"
                    >
                      <Icon className="h-4 w-4 text-brand-600" />
                      <span className="text-sm font-semibold">{item.label}</span>
                      <CheckCircle2 className="ml-auto h-4 w-4 text-emerald-500" />
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="border-y border-border bg-muted/40 py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                The teams who run campus on Campusnex
              </h2>
              <p className="mt-3 text-muted-foreground">
                Voices from the same roles you will explore in the demo.
              </p>
            </div>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((item) => (
                <Card key={item.name} className="rounded-2xl bg-white shadow-subtle">
                  <CardContent className="pt-6">
                    <p className="text-sm leading-relaxed text-foreground/90">
                      “{item.quote}”
                    </p>
                    <div className="mt-5 flex items-center gap-3">
                      <Avatar>
                        <AvatarImage
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${item.seed}`}
                        />
                        <AvatarFallback>{item.name.slice(0, 1)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-bold">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                Plans that grow with your campus
              </h2>
              <p className="mt-3 text-muted-foreground">
                Start with a department pilot, then scale institution-wide.
              </p>
            </div>

            <div className="mx-auto mt-12 grid max-w-4xl gap-5 md:grid-cols-2">
              {plans.map((plan) => (
                <Card
                  key={plan.name}
                  className={cn(
                    'rounded-2xl shadow-subtle',
                    plan.highlighted && 'border-brand-300 ring-2 ring-brand-500/20'
                  )}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
                      {plan.highlighted && (
                        <Badge className="rounded-full bg-brand-500 text-white">
                          Popular
                        </Badge>
                      )}
                    </div>
                    <div className="pt-2">
                      <span className="text-4xl font-extrabold">{plan.price}</span>
                    </div>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2.5">
                    {plan.features.map((f) => (
                      <div key={f} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-brand-500" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </CardContent>
                  <CardFooter>
                    <Button
                      onClick={onSignIn}
                      className={cn(
                        'w-full rounded-lg',
                        plan.highlighted
                          ? 'bg-brand-500 hover:bg-brand-600'
                          : 'bg-foreground text-background hover:bg-foreground/90'
                      )}
                    >
                      {plan.cta}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>

            <div className="mx-auto mt-6 flex max-w-4xl flex-col items-start justify-between gap-3 rounded-2xl border border-border bg-muted/50 px-6 py-5 sm:flex-row sm:items-center">
              <div>
                <p className="font-bold">Enterprise / multi-campus</p>
                <p className="text-sm text-muted-foreground">
                  Custom SSO, data residency, and registrar-led rollout.
                </p>
              </div>
              <Button variant="outline" onClick={onSignIn} className="rounded-lg">
                Contact us
              </Button>
            </div>
          </div>
        </section>

        <section id="faq" className="border-t border-border bg-muted/40 py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <h2 className="text-center text-3xl font-extrabold tracking-tight sm:text-4xl">
              Frequently asked questions
            </h2>
            <Accordion type="single" collapsible className="mt-10 rounded-2xl border border-border bg-white px-4">
              {faqs.map((item, i) => (
                <AccordionItem key={item.q} value={`item-${i}`}>
                  <AccordionTrigger className="text-left text-sm font-bold sm:text-base">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        <section className="py-20">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
            <div className="rounded-3xl border border-brand-200 bg-gradient-to-br from-brand-50 to-white px-6 py-14 shadow-subtle sm:px-12">
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                Ready to run your campus with clarity?
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
                Jump into the demo workspace and switch between admin, faculty, and
                student roles in seconds.
              </p>
              <Button
                size="lg"
                onClick={onSignIn}
                className="mt-8 h-12 rounded-lg bg-brand-500 px-8 text-sm font-bold hover:bg-brand-600"
              >
                Start free trial
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-white">
                <GraduationCap className="h-4 w-4" />
              </div>
              <span className="font-extrabold">Campusnex</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Next-generation academic management & ERP for modern campuses.
            </p>
          </div>
          {[
            {
              title: 'Product',
              links: ['Features', 'Workflow', 'Plans', 'Demo login'],
            },
            {
              title: 'Campus',
              links: ['Admin console', 'Faculty workspace', 'Student hub', 'Exam seating'],
            },
            {
              title: 'Company',
              links: ['About', 'Security', 'Contact', 'Status'],
            },
          ].map((col) => (
            <div key={col.title}>
              <p className="text-sm font-bold">{col.title}</p>
              <ul className="mt-3 space-y-2">
                {col.links.map((link) => (
                  <li key={link}>
                    <button
                      type="button"
                      onClick={onSignIn}
                      className="text-sm text-muted-foreground hover:text-foreground"
                    >
                      {link}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <Separator />
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:px-6">
          <p>© {new Date().getFullYear()} Campusnex. Academic Cloud.</p>
          <p>Built for registrars, faculty, and students.</p>
        </div>
      </footer>
    </div>
  )
}
