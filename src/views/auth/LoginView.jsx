import React, { useState } from 'react'
import {
  GraduationCap,
  ShieldAlert,
  ShieldCheck,
  Briefcase,
  User,
  Lock,
  ArrowRight,
  ArrowLeft,
  Info,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

const MIN_PASSWORD_LENGTH = 8

const rolePresets = {
  student: {
    title: 'Student Portal',
    description:
      'Access attendance, published IA marks, submit assignments & view schedules.',
    badgeClass: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  },
  faculty: {
    title: 'Faculty Workspace',
    description:
      'Mark session attendance, publish IA marks, manage assignments & grade submissions.',
    badgeClass: 'border-brand-200 bg-brand-50 text-brand-700',
  },
  hod: {
    title: 'HOD Console',
    description:
      "Everything faculty can do, plus a view-only overview of your department's attendance, marks and at-risk students.",
    badgeClass: 'border-sky-200 bg-sky-50 text-sky-700',
  },
  admin: {
    title: 'Administrative Console',
    description:
      'Manage users, assign course faculty, configure timetables & post campus broadcasts.',
    badgeClass: 'border-amber-200 bg-amber-50 text-amber-800',
  },
}

const MODE_COPY = {
  signin: { button: null, switchPrompt: 'First time signing in?', switchLabel: 'Activate your account' },
  activate: { button: 'Activate Account', switchPrompt: 'Already activated?', switchLabel: 'Sign in' },
  forgot: { button: 'Send Reset Link', switchPrompt: 'Remembered it?', switchLabel: 'Back to sign in' },
}

export default function LoginView({ onBack }) {
  const { login, activateAccount, requestPasswordReset } = useAuth()

  const [activeRoleTab, setActiveRoleTab] = useState('student')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [mode, setMode] = useState('signin')

  const switchMode = (next) => {
    setMode(next)
    setError('')
    setNotice('')
    setPassword('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setNotice('')
    setIsLoading(true)

    try {
      if (!email.trim()) {
        throw new Error('Please enter your institutional email address.')
      }
      if (mode === 'forgot') {
        await requestPasswordReset(email)
        setNotice('If this email has an account, a password reset link is on its way. Check your inbox.')
      } else if (mode === 'activate') {
        if (password.length < MIN_PASSWORD_LENGTH) {
          throw new Error(`Choose a password with at least ${MIN_PASSWORD_LENGTH} characters.`)
        }
        const result = await activateAccount(email, password)
        if (result === 'confirm_email') {
          setNotice('Almost done. Check your email and click the confirmation link, then sign in.')
          setMode('signin')
          setPassword('')
        }
      } else {
        await login(email, password)
      }
    } catch (err) {
      setError(err.message || 'Sign in failed. Please check your details.')
    } finally {
      setIsLoading(false)
    }
  }

  const preset = rolePresets[activeRoleTab]
  const copy = MODE_COPY[mode]

  return (
    <div className="relative flex min-h-screen flex-col justify-center overflow-hidden bg-muted/40 px-4 py-12 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_top,_rgba(255,92,0,0.12),_transparent_65%)]" />

      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
        {onBack && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="mb-4 gap-1.5 text-muted-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Campusnex
          </Button>
        )}

        <div className="text-center">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-glow">
            <GraduationCap className="h-8 w-8" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
            Campusnex
          </h2>
          <p className="mt-2 text-sm font-medium text-muted-foreground">
            {mode === 'forgot'
              ? 'Reset your password'
              : mode === 'activate'
                ? 'Activate your institutional account'
                : 'Sign in to your institutional workspace'}
          </p>
        </div>

        <Card className="mt-8 overflow-hidden rounded-3xl border-border shadow-card-hover py-0 gap-0">
          <Tabs
            value={activeRoleTab}
            onValueChange={setActiveRoleTab}
            className="gap-0"
          >
            <div className="border-b border-border bg-muted/60 p-2">
              <TabsList className="grid h-auto w-full grid-cols-4 gap-1 bg-transparent p-0">
                <TabsTrigger
                  value="student"
                  className="flex-col gap-1 rounded-xl px-1 py-2 text-xs font-bold sm:flex-row sm:gap-1.5 sm:py-2.5 data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-xs data-[state=active]:ring-1 data-[state=active]:ring-border"
                >
                  <GraduationCap className="h-4 w-4" />
                  Student
                </TabsTrigger>
                <TabsTrigger
                  value="faculty"
                  className="flex-col gap-1 rounded-xl px-1 py-2 text-xs font-bold sm:flex-row sm:gap-1.5 sm:py-2.5 data-[state=active]:bg-white data-[state=active]:text-brand-700 data-[state=active]:shadow-xs data-[state=active]:ring-1 data-[state=active]:ring-border"
                >
                  <Briefcase className="h-4 w-4" />
                  Faculty
                </TabsTrigger>
                <TabsTrigger
                  value="hod"
                  className="flex-col gap-1 rounded-xl px-1 py-2 text-xs font-bold sm:flex-row sm:gap-1.5 sm:py-2.5 data-[state=active]:bg-white data-[state=active]:text-sky-700 data-[state=active]:shadow-xs data-[state=active]:ring-1 data-[state=active]:ring-border"
                >
                  <ShieldCheck className="h-4 w-4" />
                  HOD
                </TabsTrigger>
                <TabsTrigger
                  value="admin"
                  className="flex-col gap-1 rounded-xl px-1 py-2 text-xs font-bold sm:flex-row sm:gap-1.5 sm:py-2.5 data-[state=active]:bg-white data-[state=active]:text-amber-800 data-[state=active]:shadow-xs data-[state=active]:ring-1 data-[state=active]:ring-border"
                >
                  <ShieldAlert className="h-4 w-4" />
                  Admin
                </TabsTrigger>
              </TabsList>
            </div>

            <CardHeader className="space-y-2 border-b border-border px-6 pt-6 pb-4 sm:px-8">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-base font-bold">{preset.title}</CardTitle>
                <Badge
                  variant="outline"
                  className={cn('rounded-md text-[11px] font-bold capitalize', preset.badgeClass)}
                >
                  Role: {activeRoleTab === 'hod' ? 'HOD' : activeRoleTab}
                </Badge>
              </div>
              <CardDescription className="text-xs leading-relaxed">
                {preset.description}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 px-6 py-6 sm:px-8 sm:pb-8">
              {error && (
                <Alert variant="destructive" className="border-rose-200 bg-rose-50 text-rose-700">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {notice && (
                <Alert className="border-emerald-200 bg-emerald-50 text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>{notice}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-bold">
                    Institutional Email
                  </Label>
                  <div className="relative">
                    <User className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@yourcollege.edu"
                      className="h-10 rounded-xl pl-9"
                    />
                  </div>
                </div>

                {mode !== 'forgot' && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-xs font-bold">
                        {mode === 'activate' ? 'Choose a Password' : 'Password'}
                      </Label>
                      {mode === 'signin' && (
                        <button
                          type="button"
                          onClick={() => switchMode('forgot')}
                          className="text-xs font-semibold text-brand-700 hover:underline cursor-pointer"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        required
                        minLength={mode === 'activate' ? MIN_PASSWORD_LENGTH : undefined}
                        autoComplete={mode === 'activate' ? 'new-password' : 'current-password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={mode === 'activate' ? `At least ${MIN_PASSWORD_LENGTH} characters` : '••••••••••••'}
                        className="h-10 rounded-xl pl-9"
                      />
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isLoading}
                  size="lg"
                  className="h-11 w-full rounded-xl bg-brand-500 text-sm font-bold hover:bg-brand-600"
                >
                  {isLoading ? (
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <>
                      <span>{copy.button || `Enter ${preset.title}`}</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>

              <p className="text-center text-xs text-muted-foreground">
                {copy.switchPrompt}{' '}
                <button
                  type="button"
                  onClick={() => switchMode(mode === 'signin' ? 'activate' : 'signin')}
                  className="font-bold text-brand-700 hover:underline cursor-pointer"
                >
                  {copy.switchLabel}
                </button>
              </p>

              <Alert className="border-border bg-muted/50">
                <Info className="h-4 w-4 text-muted-foreground" />
                <AlertDescription className="text-[11px] text-muted-foreground">
                  <strong>No public signup.</strong> Accounts are created by your institution's
                  administrator. Activate yours with the email they registered for you.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  )
}
