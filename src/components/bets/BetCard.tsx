import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
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
  const uniqueParticipants = new Set(participations.map(p => p.user_id)).size
  const totalPool = participations.reduce((s, p) => s + Number(p.pledge_amount), 0)
  const hasParticipated = currentUserId
    ? participations.some(p => p.user_id === currentUserId)
    : false

  const resolutionDate = new Date(bet.resolution_date + 'T00:00:00')
  const isPastDue = resolutionDate <= new Date()

  return (
    <Link href={`/bets/${bet.id}`}>
      <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
        <CardContent className="pt-4 pb-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <span className="font-semibold text-base leading-snug">{bet.title}</span>
            <BetStatusBadge status={bet.status} />
          </div>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {uniqueParticipants} participant{uniqueParticipants !== 1 ? 's' : ''}
              {totalPool > 0 && ` · $${totalPool.toFixed(2)} pool`}
              {isPastDue && bet.status === 'open' && ' · overdue'}
            </span>
            {hasParticipated
              ? <span className="text-green-500 text-xs font-medium">✓ In</span>
              : <span className="text-xs">{resolutionDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            }
          </div>
          {hasParticipated && (
            <p className="text-xs text-muted-foreground">
              Resolves {resolutionDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
