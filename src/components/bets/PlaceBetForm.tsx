'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { placeBet } from '@/actions/bets'

interface PlaceBetFormProps {
  betId: string
}

export function PlaceBetForm({ betId }: PlaceBetFormProps) {
  const [prediction, setPrediction] = useState<'yes' | 'no' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!prediction) return setError('Please select yes or no')

    const fd = new FormData(e.currentTarget)
    const amount = parseFloat(fd.get('pledgeAmount') as string)

    if (isNaN(amount) || amount < 0.01) return setError('Enter a valid pledge amount')

    setError(null)
    setLoading(true)

    const result = await placeBet({ betId, prediction, pledgeAmount: amount })

    setLoading(false)
    if (result?.error) {
      setError(result.error)
    } else {
      setSuccess(true)
    }
  }

  if (success) {
    return (
      <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-center">
        <p className="font-medium text-green-400">Bet placed!</p>
        <p className="text-sm text-muted-foreground mt-1">
          You&apos;ve voted <strong>{prediction}</strong>. Good luck!
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Your prediction</Label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setPrediction('yes')}
            className={`rounded-lg border-2 p-4 text-center font-semibold transition-colors ${
              prediction === 'yes'
                ? 'border-green-500 bg-green-500/20 text-green-400'
                : 'border-border hover:border-green-500/50 hover:bg-green-500/5'
            }`}
          >
            ✓ Yes
          </button>
          <button
            type="button"
            onClick={() => setPrediction('no')}
            className={`rounded-lg border-2 p-4 text-center font-semibold transition-colors ${
              prediction === 'no'
                ? 'border-red-500 bg-red-500/20 text-red-400'
                : 'border-border hover:border-red-500/50 hover:bg-red-500/5'
            }`}
          >
            ✗ No
          </button>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="pledgeAmount">Pledge amount ($)</Label>
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
        {loading ? 'Placing bet...' : 'Place bet'}
      </Button>
    </form>
  )
}
