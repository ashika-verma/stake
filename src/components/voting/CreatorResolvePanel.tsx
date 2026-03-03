'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { creatorResolveBet } from '@/actions/bets'

interface CreatorResolvePanelProps {
  betId: string
  votingDeadline: string | null // ISO string of voting_opened_at + 48h
}

export function CreatorResolvePanel({ betId, votingDeadline }: CreatorResolvePanelProps) {
  const router = useRouter()
  const [pending, setPending] = useState<'yes' | 'no' | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleConfirm() {
    if (!pending) return
    setLoading(true)
    setError(null)
    const result = await creatorResolveBet(betId, pending)
    setLoading(false)
    if (result?.error) {
      setError(result.error)
      setPending(null)
    } else {
      router.refresh()
    }
  }

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Resolve this bet</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          You created this bet — you can resolve it directly. Pick what actually happened.
        </p>

        {pending ? (
          <div className="space-y-3">
            <p className="text-sm font-medium">
              Confirm: you&apos;re resolving this bet as{' '}
              <span className={pending === 'yes' ? 'text-green-400' : 'text-red-400'}>
                {pending === 'yes' ? '✓ Yes' : '✗ No'}
              </span>
              ?
            </p>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleConfirm} disabled={loading}>
                {loading ? 'Resolving...' : 'Confirm'}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setPending(null)} disabled={loading}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPending('yes')}
              className="rounded-lg border-2 border-green-500/40 bg-green-500/10 p-3 text-center font-semibold text-green-400 transition-colors hover:bg-green-500/20"
            >
              ✓ Yes happened
            </button>
            <button
              type="button"
              onClick={() => setPending('no')}
              className="rounded-lg border-2 border-red-500/40 bg-red-500/10 p-3 text-center font-semibold text-red-400 transition-colors hover:bg-red-500/20"
            >
              ✗ No happened
            </button>
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        {votingDeadline && (
          <p className="text-xs text-muted-foreground">
            Or wait for votes — participants will decide by{' '}
            {new Date(votingDeadline).toLocaleString('en-US', {
              month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
            })}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
