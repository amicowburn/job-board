'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button, Input, Alert, AlertDescription } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'

export default function AdminLoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/admin/jobs'
  const errorParam = searchParams.get('error')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(
    errorParam === 'unauthorized' ? 'You do not have admin access.' : ''
  )
  const [isSendingReset, setIsSendingReset] = useState(false)
  const [resetMessage, setResetMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const supabase = createClient()

      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        throw authError
      }

      // Check if user is admin
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Authentication failed')
      }

      const { data: adminUser } = await supabase
        .from('admin_users')
        .select('is_admin')
        .eq('id', user.id)
        .single() as { data: { is_admin: boolean } | null }

      if (!adminUser?.is_admin) {
        await supabase.auth.signOut()
        throw new Error('You do not have admin access.')
      }

      router.push(redirectTo)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Enter your email above first, then click "Forgot password?"')
      return
    }
    setIsSendingReset(true)
    setError('')
    setResetMessage('')
    try {
      const supabase = createClient()
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/admin/reset-password`,
      })
      if (resetError) throw resetError
      setResetMessage('If an account exists for that email, a reset link has been sent.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email')
    } finally {
      setIsSendingReset(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-muted">
      <div className="w-full max-w-md">
        <div className="bg-background rounded-lg border border-border shadow-sm p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold">Admin Login</h1>
            <p className="text-muted-foreground mt-1">
              Sign in to access the admin dashboard
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {resetMessage && (
            <Alert variant="success" className="mb-6">
              <AlertDescription>{resetMessage}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1.5">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1.5">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              loading={isLoading}
            >
              Sign In
            </Button>
          </form>

          <p className="text-center text-sm mt-4">
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={isSendingReset}
              className="text-muted-foreground hover:text-foreground underline disabled:opacity-50"
            >
              {isSendingReset ? 'Sending…' : 'Forgot password?'}
            </button>
          </p>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-4">
          <Link href="/" className="hover:text-foreground">
            &larr; Back to Job Board
          </Link>
        </p>
      </div>
    </main>
  )
}
