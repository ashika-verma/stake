'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { cancelBet } from '@/actions/bets'

interface CancelBetButtonProps {
  betId: string
}

export function CancelBetButton({ betId }: CancelBetButtonProps) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleConfirm() {
    setLoading(true)
    setError(null)
    const result = await cancelBet(betId)
    setLoading(false)
    if (result.error) {
      setError(result.error)
      setConfirming(false)
    } else {
      router.refresh()
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Cancel this bet?</span>
        <Button
          size="sm"
          variant="destructive"
          onClick={handleConfirm}
          disabled={loading}
        >
          {loading ? 'Cancelling...' : 'Confirm cancel'}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setConfirming(false)}
          disabled={loading}
        >
          Nevermind
        </Button>
        {error && <span className="text-xs text-destructive">{error}</span>}
      </div>
    )
  }

  return (
    <Button
      size="sm"
      variant="outline"
      className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
      onClick={() => setConfirming(true)}
    >
      Cancel bet
    </Button>
  )
}
