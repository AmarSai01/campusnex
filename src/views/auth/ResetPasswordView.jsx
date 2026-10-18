import React, { useState } from 'react'
import { AlertCircle, GraduationCap, Lock } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const MIN_PASSWORD_LENGTH = 8

// Shown after the user opens a password-reset link from their email.
export default function ResetPasswordView() {
  const { updatePassword } = useAuth()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Choose a password with at least ${MIN_PASSWORD_LENGTH} characters.`)
      return
    }
    if (password !== confirm) {
      setError('The two passwords do not match.')
      return
    }
    setIsLoading(true)
    try {
      await updatePassword(password)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col justify-center bg-muted/40 px-4 py-12">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-glow">
            <GraduationCap className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-foreground">Set a new password</h2>
          <p className="mt-2 text-sm text-muted-foreground">Choose a new password for your Campusnex account.</p>
        </div>

        <Card className="mt-8 rounded-3xl py-0">
          <CardContent className="space-y-4 px-6 py-6 sm:px-8">
            {error && (
              <Alert variant="destructive" className="border-rose-200 bg-rose-50 text-rose-700">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              {[
                { id: 'new-password', label: 'New password', value: password, set: setPassword },
                { id: 'confirm-password', label: 'Confirm new password', value: confirm, set: setConfirm },
              ].map((field) => (
                <div key={field.id} className="space-y-1.5">
                  <Label htmlFor={field.id} className="text-xs font-bold">{field.label}</Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id={field.id}
                      type="password"
                      required
                      minLength={MIN_PASSWORD_LENGTH}
                      autoComplete="new-password"
                      value={field.value}
                      onChange={(e) => field.set(e.target.value)}
                      className="h-10 rounded-xl pl-9"
                    />
                  </div>
                </div>
              ))}
              <Button
                type="submit"
                disabled={isLoading}
                size="lg"
                className="h-11 w-full rounded-xl bg-brand-500 text-sm font-bold hover:bg-brand-600"
              >
                {isLoading ? 'Saving…' : 'Save new password'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
