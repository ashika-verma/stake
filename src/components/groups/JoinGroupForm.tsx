'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { joinGroup } from '@/actions/groups'

interface JoinGroupFormProps {
  code: string
}

export function JoinGroupForm({ code }: JoinGroupFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
