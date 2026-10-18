import React, { useState } from 'react'
import {
  GraduationCap,
  ShieldAlert,
  Briefcase,
  User,
  Lock,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Info,
  AlertCircle,
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
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { DEMO_PASSWORD } from '@/lib/supabase'

export default function LoginView({ onBack }) {
  const { login, activateAccount, switchUser, isDemo } = useAuth()

  const [activeRoleTab, setActiveRoleTab] = useState('student')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [mode, setMode] = useState('signin')
  const [notice, setNotice] = useState('')

  const rolePresets = {
    student: {
      defaultEmail: 'student1@campusnex.edu',
      title: 'Student Portal',
      description:
        'Access attendance, published IA marks, submit assignments & view schedules.',
      badgeClass: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    },
    faculty: {
      defaultEmail: 'faculty1@campusnex.edu',
      title: 'Faculty Workspace',
      description:
        'Mark session attendance, publish IA marks, manage assignments & grade submissions.',
      badgeClass: 'border-brand-200 bg-brand-50 text-brand-700',
    },
    admin: {
      defaultEmail: 'admin@campusnex.edu',
      title: 'Administrative Console',
      description:
        'Manage users, assign course faculty, configure timetables & post campus broadcasts.',
      badgeClass: 'border-amber-200 bg-amber-50 text-amber-800',
    },
  }

  const handleRoleTabChange = (role) => {
    setActiveRoleTab(role)
    if (isDemo) {
      setEmail(rolePresets[role].defaultEmail)
      setPassword(DEMO_PASSWORD)
    }
    setError('')
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
      if (mode === 'activate') {
        if (password.length < 8) {
          throw new Error('Choose a password with at least 8 characters.')
        }
        const result = await activateAccount(email, password)
        if (result === 'confirm_email') {
          setNotice('Account activated. Check your email to confirm it, then sign in.')
          setMode('signin')
        }
      } else {
        await login(email, password)
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please verify credentials.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDemoLogin = async (userId) => {
    setError('')
    try {
      await switchUser(userId)
    } catch (err) {
      setError(err.message)
    }
  }

  const quickDemoAccounts = [
    { id: 'admin_1', name: 'Dr. Sarah Connor', desc: 'Dean / Registrar' },
    { id: 'faculty_1', name: 'Dr. Alan Turing', desc: 'Faculty (CS301/302)' },
    { id: 'faculty_2', name: 'Dr. Ada Lovelace', desc: 'Faculty (CS303 DBMS)' },
    { id: 'student_1', name: 'Alice Smith', desc: 'Student Sec A' },
    { id: 'student_2', name: 'Bob Johnson', desc: 'Student Sec A' },
    { id: 'student_4', name: 'David Lee', desc: 'Student Sec B' },
  ]

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
            Sign in to your institutional workspace
          </p>
        </div>

        <Card className="mt-8 overflow-hidden rounded-3xl border-border shadow-card-hover py-0 gap-0">
          <Tabs
            value={activeRoleTab}
            onValueChange={handleRoleTabChange}
            className="gap-0"
          >
            <div className="border-b border-border bg-muted/60 p-2">
              <TabsList className="grid h-auto w-full grid-cols-3 gap-1.5 bg-transparent p-0">
                <TabsTrigger
                  value="student"
                  className="gap-1.5 rounded-xl py-2.5 text-xs font-bold data-active:bg-white data-active:text-emerald-700 data-active:shadow-xs data-active:ring-1 data-active:ring-border"
                >
                  <GraduationCap className="h-4 w-4" />
                  Student
                </TabsTrigger>
                <TabsTrigger
                  value="faculty"
                  className="gap-1.5 rounded-xl py-2.5 text-xs font-bold data-active:bg-white data-active:text-brand-700 data-active:shadow-xs data-active:ring-1 data-active:ring-border"
                >
                  <Briefcase className="h-4 w-4" />
                  Faculty
                </TabsTrigger>
                <TabsTrigger
                  value="admin"
                  className="gap-1.5 rounded-xl py-2.5 text-xs font-bold data-active:bg-white data-active:text-amber-800 data-active:shadow-xs data-active:ring-1 data-active:ring-border"
                >
                  <ShieldAlert className="h-4 w-4" />
                  Admin
                </TabsTrigger>
              </TabsList>
            </div>

            <CardHeader className="space-y-2 border-b border-border px-6 pt-6 pb-4 sm:px-8">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-base font-bold">
                  {rolePresets[activeRoleTab].title}
                </CardTitle>
                <Badge
                  variant="outline"
                  className={cn(
                    'rounded-md text-[11px] font-bold capitalize',
                    rolePresets[activeRoleTab].badgeClass
                  )}
                >
                  Role: {activeRoleTab}
                </Badge>
              </div>
              <CardDescription className="text-xs leading-relaxed">
                {rolePresets[activeRoleTab].description}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 px-6 py-6 sm:px-8 sm:pb-8">
              {error && (
                <Alert
                  variant="destructive"
                  className="border-rose-200 bg-rose-50 text-rose-700"
                >
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {notice && (
                <Alert className="border-emerald-200 bg-emerald-50 text-emerald-700">
                  <Info className="h-4 w-4" />
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
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={rolePresets[activeRoleTab].defaultEmail}
                      className="h-10 rounded-xl pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-xs font-bold">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="h-10 rounded-xl pl-9"
                    />
                  </div>
                </div>

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
                      <span>
                        {mode === 'activate'
                          ? 'Activate Account'
                          : `Enter ${rolePresets[activeRoleTab].title}`}
                      </span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>

              <p className="text-center text-xs text-muted-foreground">
                {mode === 'activate' ? 'Already activated?' : 'First time signing in?'}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === 'activate' ? 'signin' : 'activate')
                    setError('')
                    setNotice('')
                  }}
                  className="font-bold text-brand-700 hover:underline"
                >
                  {mode === 'activate' ? 'Sign in' : 'Activate your account'}
                </button>
              </p>

              <Alert className="border-border bg-muted/50">
                <Info className="h-4 w-4 text-muted-foreground" />
                <AlertDescription className="text-[11px] text-muted-foreground">
                  <strong>Institutional Security Policy:</strong> No public signup.
                  Accounts are created by the Central Registrar. Activate yours with
                  your registered institutional email.
                </AlertDescription>
              </Alert>

              {isDemo && (
              <div className="space-y-3 pt-1">
                <Separator />
                <div className="flex items-center gap-1 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                  <Sparkles className="h-3.5 w-3.5 text-brand-600" />
                  Instant 1-Click Demo Logins:
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {quickDemoAccounts.map((acc) => (
                    <Button
                      key={acc.id}
                      type="button"
                      variant="outline"
                      onClick={() => handleDemoLogin(acc.id)}
                      className="h-auto flex-col items-start gap-0.5 rounded-xl p-2 text-left text-xs whitespace-normal"
                    >
                      <span className="truncate font-bold text-foreground">
                        {acc.name}
                      </span>
                      <span className="truncate text-[10px] font-normal text-muted-foreground">
                        {acc.desc}
                      </span>
                    </Button>
                  ))}
                </div>
              </div>
              )}
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  )
}
