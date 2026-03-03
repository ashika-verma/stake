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
  const [titleLength, setTitleLength] = useState(0)

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
          placeholder="Will the Lakers win the championship? · Will it snow before March?"
          required
          autoFocus
          maxLength={120}
          onChange={e => setTitleLength(e.target.value.length)}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Phrase as a yes/no question</span>
          <span>{titleLength}/120</span>
        </div>
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
          Set this to the day after the event — betting closes on this date, then participants vote on the outcome.
        </p>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Creating...' : 'Create bet'}
      </Button>
    </form>
  )
}
