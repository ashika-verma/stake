import { BetCard } from './BetCard'
import type { Bet } from '@/types/database'

interface BetListProps {
  bets: Array<Bet & {
    profiles?: { display_name: string } | null
    bet_participations?: Array<{ user_id: string; pledge_amount: number; prediction: string }>
  }>
  currentUserId?: string
}

export function BetList({ bets, currentUserId }: BetListProps) {
  return (
    <div className="space-y-3">
      {bets.map(bet => (
        <BetCard key={bet.id} bet={bet} currentUserId={currentUserId} />
      ))}
    </div>
  )
}
