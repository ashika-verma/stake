import Link from 'next/link'
import type { BetStatus } from '@/types/database'

interface ActivityEvent {
  type: 'bet_created' | 'bet_participated' | 'voting_opened' | 'bet_resolved'
  betId: string
  betTitle: string
  actorName: string
  timestamp: string
  meta?: {
    prediction?: 'yes' | 'no'
    amount?: number
    outcome?: 'yes' | 'no'
    status?: BetStatus
  }
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(diff / 86400000)
  if (d > 0) return `${d}d ago`
  if (h > 0) return `${h}h ago`
  if (m > 0) return `${m}m ago`
  return 'just now'
}

function eventDescription(e: ActivityEvent): string {
  switch (e.type) {
    case 'bet_created':
      return `${e.actorName} created a bet`
    case 'bet_participated':
      return `${e.actorName} bet ${e.meta?.prediction === 'yes' ? '✓ Yes' : '✗ No'}${e.meta?.amount ? ` ($${e.meta.amount.toFixed(2)})` : ''}`
    case 'voting_opened':
      return `Voting opened`
    case 'bet_resolved':
      return `Resolved: ${e.meta?.outcome === 'yes' ? '✓ Yes' : e.meta?.outcome === 'no' ? '✗ No' : 'cancelled'}`
  }
}

function eventDot(e: ActivityEvent): string {
  switch (e.type) {
    case 'bet_created': return 'bg-primary/60'
    case 'bet_participated':
      return e.meta?.prediction === 'yes' ? 'bg-green-500' : 'bg-red-500'
    case 'voting_opened': return 'bg-amber-500'
    case 'bet_resolved': return 'bg-zinc-400'
  }
}

interface ActivityFeedProps {
  events: ActivityEvent[]
}

export function ActivityFeed({ events }: ActivityFeedProps) {
  if (events.length === 0) return null

  return (
    <div className="space-y-1">
      {events.map((e, i) => (
        <Link
          key={i}
          href={`/bets/${e.betId}`}
          className="flex items-start gap-3 py-2 px-1 rounded-md hover:bg-accent/40 transition-colors group"
        >
          <div className={`mt-1.5 h-2 w-2 rounded-full flex-shrink-0 ${eventDot(e)}`} />
          <div className="min-w-0 flex-1">
            <p className="text-sm leading-snug">
              <span className="text-muted-foreground">{eventDescription(e)}</span>
              {' '}
              <span className="font-medium text-foreground truncate">&ldquo;{e.betTitle}&rdquo;</span>
            </p>
          </div>
          <span className="text-xs text-muted-foreground flex-shrink-0 pt-0.5">
            {timeAgo(e.timestamp)}
          </span>
        </Link>
      ))}
    </div>
  )
}

export type { ActivityEvent }
