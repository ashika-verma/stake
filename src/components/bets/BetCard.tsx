import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BetStatusBadge } from './BetStatusBadge'
import type { Bet } from '@/types/database'

interface BetCardProps {
  bet: Bet & {
    profiles?: { display_name: string } | null
    bet_participations?: Array<{ user_id: string; pledge_amount: number; prediction: string }>
  }
  currentUserId?: string
}

export function BetCard({ bet, currentUserId }: BetCardProps) {
  const participations = bet.bet_participations ?? []
  const totalPool = participations.reduce((s, p) => s + Number(p.pledge_amount), 0)
  const hasParticipated = currentUserId
    ? participations.some(p => p.user_id === currentUserId)
    : false

  const resolutionDate = new Date(bet.resolution_date + 'T00:00:00')
  const isPastDue = resolutionDate <= new Date()

  return (
    <Link href={`/bets/${bet.id}`}>
      <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base leading-snug">{bet.title}</CardTitle>
            <BetStatusBadge status={bet.status} />
          </div>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-1">
          <div className="flex items-center justify-between">
            <span>
              {participations.length} participant{participations.length !== 1 ? 's' : ''}
              {totalPool > 0 && ` · $${totalPool.toFixed(2)} pool`}
            </span>
            {hasParticipated && (
              <span className="text-green-400 text-xs">✓ In</span>
            )}
          </div>
          <p>
            Resolves {isPastDue && bet.status === 'open' ? 'overdue' : ''}{' '}
            {resolutionDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </CardContent>
      </Card>
    </Link>
  )
}
