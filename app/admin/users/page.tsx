'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button, Input, Label, Alert, AlertDescription } from '@/components/ui'

interface AdminUserRow {
  id: string
  is_admin: boolean
  created_at: string
  email: string | null
}

export default function AdminUsersPage() {
  const [admins, setAdmins] = useState<AdminUserRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const fetchAdmins = useCallback(async () => {
    setIsLoading(true)
    const res = await fetch('/api/admin/users')
    if (res.ok) {
      const { data } = await res.json()
      setAdmins(data)
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    fetchAdmins()
  }, [fetchAdmins])

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)
    setMessage(null)

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const body = await res.json()

      if (!res.ok) throw new Error(body.error || 'Failed to create admin user')

      setMessage({ type: 'success', text: `Admin user created: ${email}` })
      setEmail('')
      setPassword('')
      fetchAdmins()
    } catch (err) {
      console.error('Error creating admin:', err)
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to create admin user',
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleRemoveAdmin = async (adminId: string) => {
    if (!confirm('Are you sure you want to remove this admin?')) return

    const res = await fetch(`/api/admin/users/${adminId}`, { method: 'DELETE' })
    const body = await res.json().catch(() => ({}))

    if (!res.ok) {
      setMessage({ type: 'error', text: body.error || 'Failed to remove admin' })
    } else {
      setMessage({ type: 'success', text: 'Admin removed' })
      fetchAdmins()
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1
          className="text-[22px] font-bold text-slate-800"
          style={{ fontFamily: 'var(--font-outfit)' }}
        >
          Admin Users
        </h1>
        <p className="text-sm text-slate-500 mt-1">Manage admin access to the dashboard</p>
      </div>

      {/* Create new admin */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6 max-w-md">
        <h2 className="text-base font-semibold text-slate-700 mb-4" style={{ fontFamily: 'var(--font-outfit)' }}>
          Create Admin User
        </h2>

        {message && (
          <Alert variant={message.type === 'success' ? 'success' : 'destructive'} className="mb-4">
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleCreateAdmin} className="space-y-4">
          <div>
            <Label htmlFor="email" required>Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="password" required>Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              required
              minLength={6}
              className="mt-1.5"
            />
          </div>
          <Button type="submit" variant="primary" loading={isCreating}>
            Create Admin
          </Button>
        </form>
      </div>

      {/* Admin list */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="text-left px-5 py-3 text-[11px] uppercase tracking-wide text-slate-500 font-medium">Email</th>
              <th className="text-left px-5 py-3 text-[11px] uppercase tracking-wide text-slate-500 font-medium">Created</th>
              <th className="text-right px-5 py-3 text-[11px] uppercase tracking-wide text-slate-500 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {isLoading ? (
              <tr>
                <td colSpan={3} className="px-5 py-8 text-center text-slate-400 text-sm">
                  Loading...
                </td>
              </tr>
            ) : admins.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-5 py-8 text-center text-slate-400 text-sm">
                  No admin users found
                </td>
              </tr>
            ) : (
              admins.map((admin) => (
                <tr key={admin.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-4 text-slate-700">
                    {admin.email || <span className="font-mono text-xs text-slate-400">{admin.id}</span>}
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-400">
                    {new Date(admin.created_at).toLocaleDateString('en-AU')}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => handleRemoveAdmin(admin.id)}
                      className="text-xs text-destructive hover:underline"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
