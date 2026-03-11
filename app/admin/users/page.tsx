'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button, Input, Label, Alert, AlertDescription } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'

interface AdminUserRow {
  id: string
  is_admin: boolean
  created_at: string
  email?: string
}

export default function AdminUsersPage() {
  const [admins, setAdmins] = useState<AdminUserRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const fetchAdmins = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('admin_users')
      .select('*')
      .order('created_at', { ascending: true })

    if (data) {
      // Fetch emails for each admin from auth
      const adminsWithEmail = await Promise.all(
        data.map(async (admin) => {
          // We can't query auth.users from client, so just show the ID
          return { ...admin } as AdminUserRow
        })
      )
      setAdmins(adminsWithEmail)
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
      const supabase = createClient()

      // Create the auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('Failed to create user')

      // Add to admin_users table
      const { error: adminError } = await supabase
        .from('admin_users')
        .insert({ id: authData.user.id, is_admin: true })

      if (adminError) throw adminError

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

    const supabase = createClient()
    const { error } = await supabase
      .from('admin_users')
      .delete()
      .eq('id', adminId)

    if (error) {
      setMessage({ type: 'error', text: 'Failed to remove admin' })
    } else {
      setMessage({ type: 'success', text: 'Admin removed' })
      fetchAdmins()
    }
  }

  return (
    <div className="container-page py-8">
      <h1 className="text-2xl font-bold mb-6">Admin Users</h1>

      {/* Create new admin */}
      <div className="bg-background rounded-lg border border-border p-6 mb-8 max-w-md">
        <h2 className="text-lg font-semibold mb-4">Create Admin User</h2>

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
      <div className="bg-background rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-3 font-medium">User ID</th>
              <th className="text-left px-4 py-3 font-medium">Created</th>
              <th className="text-right px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                  Loading...
                </td>
              </tr>
            ) : admins.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                  No admin users found
                </td>
              </tr>
            ) : (
              admins.map((admin) => (
                <tr key={admin.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-mono text-xs">{admin.id}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(admin.created_at).toLocaleDateString('en-AU')}
                  </td>
                  <td className="px-4 py-3 text-right">
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
