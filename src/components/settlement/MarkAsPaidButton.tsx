'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { markDebtPaid } from '@/actions/settlements'

interface MarkAsPaidButtonProps {
  betId: string
  toUserId: string
  amount: number
}

export function MarkAsPaidButton({ betId, toUserId, amount }: MarkAsPaidButtonProps) {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    await markDebtPaid(betId, toUserId, amount)
    setLoading(false)
  }

  return (
    <Button
      size="sm"
      variant="outline"
      className="text-muted-foreground"
      onClick={handleClick}
      disabled={loading}
    >
      {loading ? 'Saving...' : 'Mark as paid'}
    </Button>
  )
}
