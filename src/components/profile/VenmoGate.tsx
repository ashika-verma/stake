'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateProfile } from '@/actions/auth'

interface VenmoGateProps {
  displayName: string
  message?: string
}

export function VenmoGate({ displayName, message = 'Add your Venmo username to continue.' }: VenmoGateProps) {
  const router = useRouter()
  const [venmoUsername, setVenmoUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = venmoUsername.trim().replace(/^@/, '')
    if (!trimmed) return setError('Enter your Venmo username')
    if (!/^[a-zA-Z0-9_-]{1,30}$/.test(trimmed)) {
      return setError('Venmo usernames are letters, numbers, _ and - only.')
    }
    setError(null)
    setLoading(true)
    const result = await updateProfile({ displayName, venmoUsername: trimmed })
    setLoading(false)
    if (result?.error) {
      setError(result.error)
    } else {
      router.refresh()
    }
  }

  return (
    <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 space-y-3">
      <div className="space-y-1">
        <p className="text-sm font-medium text-amber-400">Venmo required</p>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
      <form onSubmit={handleSave} className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="venmo-gate-input">Venmo username</Label>
          <Input
            id="venmo-gate-input"
            placeholder="@yourname"
            value={venmoUsername}
            onChange={e => setVenmoUsername(e.target.value)}
            autoComplete="off"
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" size="sm" disabled={loading || !venmoUsername.trim()}>
          {loading ? 'Saving...' : 'Save & continue'}
        </Button>
      </form>
    </div>
  )
}
