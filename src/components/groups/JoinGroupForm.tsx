'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { joinGroup } from '@/actions/groups'
import { VenmoGate } from '@/components/profile/VenmoGate'

interface JoinGroupFormProps {
  code: string
  hasVenmo: boolean
  displayName: string
}

export function JoinGroupForm({ code, hasVenmo, displayName }: JoinGroupFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!hasVenmo) {
    return (
      <VenmoGate
        displayName={displayName}
        message="You need a Venmo username to join betting groups. It's used to settle debts after bets resolve."
      />
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const result = await joinGroup(code)
    setLoading(false)
    if (result?.error) setError(result.error)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Joining...' : 'Join group'}
      </Button>
    </form>
  )
}
