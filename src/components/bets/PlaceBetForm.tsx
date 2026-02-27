'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { placeBet } from '@/actions/bets'
import { VenmoGate } from '@/components/profile/VenmoGate'
import type { Prediction } from '@/types/database'

interface PlaceBetFormProps {
  betId: string
  myParticipations: Array<{ prediction: Prediction; pledge_amount: number }>
  venmoUsername: string | null
  displayName: string
}

function PositionSummary({ participations }: { participations: Array<{ prediction: Prediction; pledge_amount: number }> }) {
  if (participations.length === 0) return null

  const yesTotal = participations.filter(p => p.prediction === 'yes').reduce((s, p) => s + p.pledge_amount, 0)
  const noTotal  = participations.filter(p => p.prediction === 'no').reduce((s, p) => s + p.pledge_amount, 0)

  return (
    <div className="flex gap-2 flex-wrap">
      {yesTotal > 0 && (
        <span className="rounded-full bg-green-500/15 px-3 py-1 text-sm font-medium text-green-400">
          ${yesTotal.toFixed(2)} on Yes
        </span>
      )}
      {noTotal > 0 && (
        <span className="rounded-full bg-red-500/15 px-3 py-1 text-sm font-medium text-red-400">
          ${noTotal.toFixed(2)} on No
        </span>
      )}
    </div>
  )
}

export function PlaceBetForm({ betId, myParticipations, venmoUsername, displayName }: PlaceBetFormProps) {
  const [prediction, setPrediction] = useState<Prediction | null>(null)
  const [error, setError]   = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [localParticipations, setLocalParticipations] = useState(myParticipations)

  if (!venmoUsername) {
    return (
      <VenmoGate
        displayName={displayName}
        message="You need a Venmo username to place bets. Winnings and debts are settled via Venmo."
      />
    )
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!prediction) return setError('Select yes or no')

    const fd = new FormData(e.currentTarget)
    const amount = parseFloat(fd.get('pledgeAmount') as string)
    if (isNaN(amount) || amount < 0.01) return setError('Enter a valid amount')

    setError(null)
    setLoading(true)
    const result = await placeBet({ betId, prediction, pledgeAmount: amount })
    setLoading(false)

    if (result && 'error' in result) {
      setError(result.error ?? 'Something went wrong')
    } else {
      // Optimistically update local position
      setLocalParticipations(prev => [...prev, { prediction, pledge_amount: amount }])
      setPrediction(null)
      ;(e.target as HTMLFormElement).reset()
    }
  }

  return (
    <div className="space-y-4">
      {localParticipations.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Your position</p>
          <PositionSummary participations={localParticipations} />
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>Add to position</Label>
          <div className="grid grid-cols-2 gap-3">
            {(['yes', 'no'] as Prediction[]).map(side => (
              <button
                key={side}
                type="button"
                onClick={() => setPrediction(side)}
                className={`rounded-lg border-2 p-4 text-center font-semibold transition-colors ${
                  prediction === side
                    ? side === 'yes'
                      ? 'border-green-500 bg-green-500/20 text-green-400'
                      : 'border-red-500 bg-red-500/20 text-red-400'
                    : 'border-border hover:border-muted-foreground/50'
                }`}
              >
                {side === 'yes' ? '✓ Yes' : '✗ No'}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="pledgeAmount">Amount ($)</Label>
          <Input
            id="pledgeAmount"
            name="pledgeAmount"
            type="number"
            min="0.01"
            step="0.01"
            placeholder="5.00"
            required
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" className="w-full" disabled={loading || !prediction}>
          {loading ? 'Placing...' : prediction ? `Bet ${prediction === 'yes' ? 'Yes' : 'No'}` : 'Select a side'}
        </Button>
      </form>
    </div>
  )
}
