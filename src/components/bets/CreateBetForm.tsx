'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createBet } from '@/actions/bets'

interface CreateBetFormProps {
  groupId: string
}

export function CreateBetForm({ groupId }: CreateBetFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Min date is tomorrow
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split('T')[0]

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const fd = new FormData(e.currentTarget)
    const result = await createBet({
      groupId,
      title: fd.get('title') as string,
      description: (fd.get('description') as string) || undefined,
      resolutionDate: fd.get('resolutionDate') as string,
    })

    setLoading(false)
    if (result?.error) setError(result.error)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Question</Label>
        <Input
          id="title"
          name="title"
          placeholder="Will X happen by the resolution date?"
          required
          autoFocus
        />
        <p className="text-xs text-muted-foreground">Phrase as a yes/no question</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description <span className="text-muted-foreground">(optional)</span></Label>
        <Input
          id="description"
          name="description"
          placeholder="Any additional context or rules"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="resolutionDate">Resolution date</Label>
        <Input
          id="resolutionDate"
          name="resolutionDate"
          type="date"
          min={minDate}
          required
        />
        <p className="text-xs text-muted-foreground">
          Voting will open on this date. Bets must be placed before then.
        </p>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Creating...' : 'Create bet'}
      </Button>
    </form>
  )
}
