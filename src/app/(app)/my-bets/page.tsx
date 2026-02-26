import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MyBetCard, type MyBetCardData } from '@/components/bets/MyBetCard'
import type { BetOutcome, BetStatus, Prediction } from '@/types/database'

interface RawParticipation {
  id: string
  prediction: Prediction
  pledge_amount: number
  created_at: string
  bets: {
    id: string
    title: string
    status: BetStatus
    outcome: BetOutcome | null
    resolution_date: string
    groups: { name: string } | null
  }
}

const STATUS_ORDER: BetStatus[] = ['voting', 'open', 'resolved', 'cancelled']

export default async function MyBetsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: participations } = await supabase
    .from('bet_participations')
    .select('id, prediction, pledge_amount, created_at, bets(id, title, status, outcome, resolution_date, groups(name))')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true }) // oldest first so bets are in order within each card

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = ((participations ?? []) as any[]) as RawParticipation[]

  // Aggregate: one entry per bet, grouped by side
  const byBet = new Map<string, MyBetCardData>()

  for (const row of rows) {
    const bet = row.bets
    if (!byBet.has(bet.id)) {
      byBet.set(bet.id, {
        betId: bet.id,
        betTitle: bet.title,
        betStatus: bet.status,
        betOutcome: bet.outcome,
        resolutionDate: bet.resolution_date,
        groupName: bet.groups?.name ?? null,
        positions: {},
      })
    }

    const entry = byBet.get(bet.id)!
    const side = row.prediction
    if (!entry.positions[side]) {
      entry.positions[side] = { total: 0, bets: [] }
    }
    entry.positions[side]!.total = Math.round((entry.positions[side]!.total + Number(row.pledge_amount)) * 100) / 100
    entry.positions[side]!.bets.push({
      amount: Number(row.pledge_amount),
      placedAt: row.created_at,
    })
  }

  // Sort bets by status priority, then by resolution date descending
  const cards = Array.from(byBet.values()).sort((a, b) => {
    const statusDiff = STATUS_ORDER.indexOf(a.betStatus) - STATUS_ORDER.indexOf(b.betStatus)
    if (statusDiff !== 0) return statusDiff
    return b.resolutionDate.localeCompare(a.resolutionDate)
  })

  return (
    <main className="max-w-2xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">My bets</h1>

      {cards.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg font-medium mb-1">No bets yet</p>
          <p className="text-sm">Join a group and place your first bet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {cards.map(card => (
            <MyBetCard key={card.betId} data={card} />
          ))}
        </div>
      )}
    </main>
  )
}
