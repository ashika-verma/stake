'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { castVote } from '@/actions/votes'

interface VotingPanelProps {
  betId: string
  hasVoted: boolean
  currentVote?: 'yes' | 'no'
}

export function VotingPanel({ betId, hasVoted, currentVote }: VotingPanelProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [voted, setVoted] = useState(hasVoted)
  const [myVote, setMyVote] = useState(currentVote)

  async function handleVote(vote: 'yes' | 'no') {
    setError(null)
    setLoading(true)
    const result = await castVote({ betId, vote })
    setLoading(false)
    if (result && 'error' in result) {
      setError(result.error)
    } else {
      setVoted(true)
      setMyVote(vote)
    }
  }

  if (voted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your vote</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 font-semibold ${
            myVote === 'yes'
              ? 'bg-green-500/20 text-green-400'
              : 'bg-red-500/20 text-red-400'
          }`}>
            {myVote === 'yes' ? '✓ Yes' : '✗ No'}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Waiting for more votes to resolve...
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Cast your vote</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Did this happen? Vote based on what you observed.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleVote('yes')}
            disabled={loading}
            className="rounded-lg border-2 border-border p-4 text-center font-semibold transition-colors hover:border-green-500/50 hover:bg-green-500/5 disabled:opacity-50"
          >
            ✓ Yes
          </button>
          <button
            onClick={() => handleVote('no')}
            disabled={loading}
            className="rounded-lg border-2 border-border p-4 text-center font-semibold transition-colors hover:border-red-500/50 hover:bg-red-500/5 disabled:opacity-50"
          >
            ✗ No
          </button>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  )
}
