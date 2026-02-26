'use client'

import { Button } from '@/components/ui/button'
import { useEffect } from 'react'

export default function BetError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="max-w-2xl mx-auto p-4 pt-16 text-center space-y-4">
      <h2 className="text-xl font-semibold">Something went wrong</h2>
      <p className="text-muted-foreground text-sm">
        {error.message || 'Failed to load this bet.'}
      </p>
      <Button onClick={reset} variant="outline">
        Try again
      </Button>
    </main>
  )
}
