import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { triggerVotingPeriod } from '@/actions/bets'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { BetStatusBadge } from '@/components/bets/BetStatusBadge'
import { PlaceBetForm } from '@/components/bets/PlaceBetForm'
import { BetParticipants } from '@/components/bets/BetParticipants'
import { CountdownTimer } from '@/components/bets/CountdownTimer'
import { TriggerVotingButton } from '@/components/voting/TriggerVotingButton'
import { VotingPanel } from '@/components/voting/VotingPanel'
import { VoteTally } from '@/components/voting/VoteTally'
import { SettlementCard } from '@/components/settlement/SettlementCard'
import { DebtList } from '@/components/settlement/DebtList'
import { calculateSettlement, createCancelledSettlement } from '@/lib/settlement'
import type { ParticipationWithProfile } from '@/types/app'

interface Props {
  params: Promise<{ id: string }>
}

export default async function BetDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  // Fetch bet with all related data
  const { data: bet } = await supabase
    .from('bets')
    .select(`
      *,
      groups(*),
      profiles!bets_created_by_fkey(*),
      bet_participations(*, profiles(*)),
      resolution_votes(*)
    `)
    .eq('id', id)
    .single()

  if (!bet) notFound()

  // Auto-trigger voting if resolution_date has passed and bet is still open
  const today = new Date().toISOString().split('T')[0]
  if (bet.status === 'open' && bet.resolution_date <= today) {
    await triggerVotingPeriod(id)
    // Re-fetch after potential status change
    const { data: refreshed } = await supabase
      .from('bets')
      .select(`
        *,
        groups(*),
        profiles!bets_created_by_fkey(*),
        bet_participations(*, profiles(*)),
        resolution_votes(*)
      `)
      .eq('id', id)
      .single()
    if (refreshed) Object.assign(bet, refreshed)
  }

  const participations: ParticipationWithProfile[] = (bet.bet_participations ?? []).map((p: {
    id: string; bet_id: string; user_id: string; prediction: 'yes' | 'no'; pledge_amount: number; created_at: string; profiles: { id: string; display_name: string; venmo_username: string | null; created_at: string; updated_at: string }
  }) => ({
    ...p,
    pledge_amount: Number(p.pledge_amount),
    profile: p.profiles,
  }))

  const votes = bet.resolution_votes ?? []
  const yesVotes = votes.filter((v: { vote: string }) => v.vote === 'yes').length
  const noVotes = votes.filter((v: { vote: string }) => v.vote === 'no').length

  const currentUserParticipation = participations.find(p => p.user_id === user.id) ?? null
  const currentUserVote = votes.find((v: { user_id: string }) => v.user_id === user.id) ?? null

  const isOpen = bet.status === 'open'
  const isVoting = bet.status === 'voting'
  const isResolved = bet.status === 'resolved'
  const isCancelled = bet.status === 'cancelled'
  const isPastDue = bet.resolution_date <= today

  // Build settlement if resolved or cancelled
  let settlement = null
  if (isResolved || isCancelled) {
    if (isCancelled || !bet.outcome) {
      settlement = createCancelledSettlement(bet.id, bet.title)
    } else {
      settlement = calculateSettlement(
        bet.id,
        bet.title,
        participations.map(p => ({
          userId: p.user_id,
          displayName: p.profile.display_name,
          venmoUsername: p.profile.venmo_username,
          prediction: p.prediction,
          pledgeAmount: p.pledge_amount,
        })),
        bet.outcome
      )
    }
  }

  return (
    <main className="max-w-2xl mx-auto p-4 space-y-6">
      {/* Breadcrumb */}
      <div className="text-sm text-muted-foreground">
        <Link href={`/groups/${bet.groups?.id}`} className="hover:text-foreground">
          {bet.groups?.name}
        </Link>
        {' / '}
        <span>Bet</span>
      </div>

      {/* Bet header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="text-xl leading-snug">{bet.title}</CardTitle>
            <BetStatusBadge status={bet.status} />
          </div>
          {bet.description && (
            <p className="text-muted-foreground text-sm mt-1">{bet.description}</p>
          )}
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <div className="flex justify-between">
            <span>Resolution date</span>
            <span className="text-foreground">
              {new Date(bet.resolution_date + 'T00:00:00').toLocaleDateString('en-US', {
                month: 'long', day: 'numeric', year: 'numeric'
              })}
            </span>
          </div>
          {isOpen && !isPastDue && (
            <div className="flex justify-between">
              <span>Betting closes</span>
              <CountdownTimer resolutionDate={bet.resolution_date} />
            </div>
          )}
          <div className="flex justify-between">
            <span>Created by</span>
            <span className="text-foreground">{bet.profiles?.display_name}</span>
          </div>
        </CardContent>
      </Card>

      {/* Trigger voting if past due and open */}
      {isOpen && isPastDue && (
        <Card className="border-amber-500/30">
          <CardContent className="pt-6">
            <p className="text-sm text-amber-400 mb-3">
              The resolution date has passed. Open voting to let participants decide the outcome.
            </p>
            <TriggerVotingButton betId={id} />
          </CardContent>
        </Card>
      )}

      {/* Place bet form (only if open and not participated) */}
      {isOpen && !isPastDue && !currentUserParticipation && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Place your bet</CardTitle>
          </CardHeader>
          <CardContent>
            <PlaceBetForm betId={id} />
          </CardContent>
        </Card>
      )}

      {/* Participants */}
      {participations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Participants ({participations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BetParticipants
              participations={participations}
              currentUserId={user.id}
              showAmounts={!isOpen}
            />
          </CardContent>
        </Card>
      )}

      {/* Voting section */}
      {isVoting && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Vote tally</CardTitle>
            </CardHeader>
            <CardContent>
              <VoteTally
                yesVotes={yesVotes}
                noVotes={noVotes}
                totalParticipants={participations.length}
              />
            </CardContent>
          </Card>

          {currentUserParticipation && (
            <VotingPanel
              betId={id}
              hasVoted={!!currentUserVote}
              currentVote={currentUserVote?.vote}
            />
          )}

          {!currentUserParticipation && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground text-center">
                  You didn&apos;t place a bet, so you can&apos;t vote on the outcome.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Settlement */}
      {settlement && (
        <>
          <Separator />
          <SettlementCard settlement={settlement} currentUserId={user.id} />
          <div>
            <h3 className="font-semibold mb-3">Who pays whom</h3>
            <DebtList transactions={settlement.transactions} currentUserId={user.id} />
          </div>
        </>
      )}
    </main>
  )
}
