import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, Loader2, X } from 'lucide-react'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'

// "Request a pilot" opens this form instead of an email app, so a visitor can ask
// for a pilot from any phone or office computer in under a minute.

const ROLES = ['Principal', 'Director', 'HOD', 'College office or admin', 'Faculty', 'Other']
const PLANS = { pilot: 'Department pilot', institution: 'Whole institution' }

const PilotContext = createContext(() => {})
export const useRequestPilot = () => useContext(PilotContext)

// Indian mobile numbers: 10 digits starting 6 to 9, with an optional +91 or 0 in front.
const normalisePhone = (value) => value.replace(/[\s-]/g, '').replace(/^(\+91|91|0)(?=\d{10}$)/, '')
const PHONE_OK = /^[6-9]\d{9}$/
const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const EMPTY = { name: '', role: '', college: '', city: '', departments: '', phone: '', email: '', message: '' }

function validate(form) {
  const errors = {}
  if (!form.name.trim()) errors.name = 'Enter your name.'
  if (!form.role) errors.role = 'Choose your role.'
  if (!form.college.trim()) errors.college = 'Enter your college name.'
  if (!form.city.trim()) errors.city = 'Enter the city.'
  if (!PHONE_OK.test(normalisePhone(form.phone))) errors.phone = 'Enter a 10-digit mobile number.'
  if (form.email.trim() && !EMAIL_OK.test(form.email.trim())) errors.email = 'Check the email address.'
  if (form.departments && !(Number(form.departments) >= 1 && Number(form.departments) <= 50)) {
    errors.departments = 'Enter a number from 1 to 50.'
  }
  return errors
}

const inputClass =
  'mt-1.5 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/35 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/30'

function Field({ id, label, optional, error, children }) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-white/90">
        {label} {optional && <span className="font-normal text-mist">(optional)</span>}
      </label>
      {children}
      {error && <p id={`${id}-error`} className="mt-1 text-xs text-red-300">{error}</p>}
    </div>
  )
}

// Stores the request. Visitors can add requests but never read them; admins see them in the dashboard.
async function saveRequest(form, plan) {
  const blank = (v) => (v.trim() ? v.trim() : null)
  const { error } = await supabase.from('pilot_requests').insert({
    plan,
    name: form.name.trim(),
    role: form.role,
    college: form.college.trim(),
    city: form.city.trim(),
    departments: form.departments ? Number(form.departments) : null,
    phone: normalisePhone(form.phone),
    email: blank(form.email),
    message: blank(form.message),
  })
  if (error) {
    throw new Error(error.code === 'P0001' ? error.message : 'Your request could not be sent. Check your connection and try again.')
  }
}

function PilotForm({ plan, onDone }) {
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle')
  const [sendError, setSendError] = useState('')
  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    if (errors[key]) setErrors((x) => ({ ...x, [key]: undefined }))
  }
  const field = (key) => ({
    id: `pilot-${key}`,
    value: form[key],
    onChange: set(key),
    'aria-invalid': errors[key] ? true : undefined,
    'aria-describedby': errors[key] ? `pilot-${key}-error` : undefined,
    className: cn(inputClass, errors[key] && 'border-red-400/70'),
  })

  const submit = async (e) => {
    e.preventDefault()
    const found = validate(form)
    setErrors(found)
    if (Object.keys(found).length) {
      document.getElementById(`pilot-${Object.keys(found)[0]}`)?.focus()
      return
    }
    setStatus('saving')
    setSendError('')
    try {
      await saveRequest(form, plan)
      setStatus('done')
    } catch (err) {
      setSendError(err.message)
      setStatus('idle')
    }
  }

  if (status === 'done') {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="py-6 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400" aria-hidden="true" />
        <DialogTitle className="mt-4 font-display text-2xl font-semibold text-white">Request received</DialogTitle>
        <DialogDescription className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-mist">
          Thanks, {form.name.trim().split(' ')[0]}. Your {PLANS[plan].toLowerCase()} request for {form.college.trim()} is saved. We'll
          call you on {normalisePhone(form.phone).replace(/(\d{5})(\d{5})/, '$1 $2')} to plan the next step.
        </DialogDescription>
        <button type="button" onClick={() => onDone()} className="mt-6 cursor-pointer rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-night hover:bg-white/90">
          Done
        </button>
      </motion.div>
    )
  }

  return (
    <form onSubmit={submit} noValidate>
      <DialogTitle className="font-display text-2xl font-semibold text-white">Request a pilot</DialogTitle>
      <DialogDescription className="mt-1.5 text-sm text-mist">
        Tell us about your college. It takes under a minute, and there's no commitment.
      </DialogDescription>

      <div role="radiogroup" aria-label="What would you like to start with?" className="mt-5 grid grid-cols-2 gap-2">
        {Object.entries(PLANS).map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={plan === key}
              onClick={() => onDone(key)}
              className={cn(
                'cursor-pointer rounded-lg border px-3 py-2 text-sm font-semibold',
                plan === key ? 'border-brand-500 bg-brand-500/15 text-white' : 'border-white/15 text-mist hover:text-white'
              )}
            >
              {label}
            </button>
        ))}
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field id="pilot-name" label="Your name" error={errors.name}>
          <input {...field('name')} maxLength={120} autoComplete="name" placeholder="Dr. Meena Rao" />
        </Field>
        <Field id="pilot-role" label="Your role" error={errors.role}>
          <select {...field('role')} className={cn(field('role').className, 'cursor-pointer [&>option]:bg-night')}>
            <option value="">Choose one</option>
            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </Field>
        <Field id="pilot-college" label="College name" error={errors.college}>
          <input {...field('college')} maxLength={200} autoComplete="organization" placeholder="Sri Example Institute of Technology" />
        </Field>
        <Field id="pilot-city" label="City" error={errors.city}>
          <input {...field('city')} maxLength={100} autoComplete="address-level2" placeholder="Mysuru" />
        </Field>
        <Field id="pilot-phone" label="Mobile number" error={errors.phone}>
          <input {...field('phone')} type="tel" inputMode="tel" autoComplete="tel" placeholder="98450 12345" />
        </Field>
        <Field id="pilot-email" label="Email" optional error={errors.email}>
          <input {...field('email')} maxLength={200} type="email" autoComplete="email" placeholder="principal@college.edu.in" />
        </Field>
        <Field id="pilot-departments" label="Number of departments" optional error={errors.departments}>
          <input {...field('departments')} type="number" inputMode="numeric" min="1" max="50" placeholder="6" />
        </Field>
        <Field id="pilot-message" label="Anything we should know?" optional>
          <input {...field('message')} maxLength={1000} placeholder="We want to start with CSE" />
        </Field>
      </div>

      {sendError && (
        <p role="alert" className="mt-5 rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">{sendError}</p>
      )}
      <button
        type="submit"
        disabled={status === 'saving'}
        className="mt-6 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-brand-500 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-600 disabled:cursor-wait disabled:opacity-80"
      >
        {status === 'saving' && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        {status === 'saving' ? 'Sending request' : 'Send request'}
      </button>
      <p className="mt-3 text-center text-xs text-mist">We only use these details to contact you about Campusnex.</p>
    </form>
  )
}

export function PilotRequestProvider({ children }) {
  const [open, setOpen] = useState(false)
  const [plan, setPlan] = useState('pilot')
  const [round, setRound] = useState(0)

  const request = useCallback((which = 'pilot') => {
    setPlan(which)
    setRound((r) => r + 1)
    setOpen(true)
  }, [])

  // The plan buttons inside the form switch the plan; "Done" (no plan) closes the form.
  const onDone = useCallback((which) => {
    if (which) setPlan(which)
    else setOpen(false)
  }, [])

  const value = useMemo(() => request, [request])
  return (
    <PilotContext.Provider value={value}>
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={false}
          data-lenis-prevent
          className="max-h-[90dvh] overflow-y-auto border border-white/10 bg-night-2 p-6 text-white ring-0 sm:max-w-xl sm:p-7"
        >
          <DialogClose className="absolute top-4 right-4 cursor-pointer rounded-md p-1.5 text-mist hover:bg-white/10 hover:text-white" aria-label="Close">
            <X className="h-4 w-4" aria-hidden="true" />
          </DialogClose>
          <PilotForm key={round} plan={plan} onDone={onDone} />
        </DialogContent>
      </Dialog>
    </PilotContext.Provider>
  )
}
