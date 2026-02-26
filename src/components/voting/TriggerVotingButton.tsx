'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { triggerVotingPeriod } from '@/actions/bets'

export function TriggerVotingButton({ betId }: { betId: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function handleClick() {
    setLoading(true)
    setError(null)
    const result = await triggerVotingPeriod(betId)
    setLoading(false)
    if (result?.error) setError(result.error)
    else setDone(true)
  }

  if (done) return null

  return (
    <div className="space-y-2">
      <Button
        onClick={handleClick}
        disabled={loading}
        variant="outline"
        className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
      >
        {loading ? 'Opening voting...' : 'Open voting period'}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
