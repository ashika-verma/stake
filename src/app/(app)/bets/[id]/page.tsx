import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { triggerVotingPeriod } from '@/actions/bets'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { BetStatusBadge } from '@/components/bets/BetStatusBadge'
import { PlaceBetForm } from '@/components/bets/PlaceBetForm'
import { BetParticipants } from '@/components/bets/BetParticipants'
import { MarketState } from '@/components/bets/MarketState'
import { MarketChart } from '@/components/bets/MarketChart'
import { CountdownTimer } from '@/components/bets/CountdownTimer'
import { CancelBetButton } from '@/components/bets/CancelBetButton'
import { TriggerVotingButton } from '@/components/voting/TriggerVotingButton'
import { VotingPanel } from '@/components/voting/VotingPanel'
import { VoteTally } from '@/components/voting/VoteTally'
import { CreatorResolvePanel } from '@/components/voting/CreatorResolvePanel'
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

  const [{ data: bet }, { data: currentUserProfile }] = await Promise.all([
    supabase
      .from('bets')
      .select(`
        *,
        groups(*),
        profiles!bets_created_by_fkey(*),
        bet_participations(*, profiles(*)),
        resolution_votes(*)
      `)
      .eq('id', id)
      .single(),
    supabase
      .from('profiles')
      .select('display_name, venmo_username')
      .eq('id', user.id)
      .single(),
  ])

  if (!bet) notFound()

  // F1: Check if user is a member of this bet's group
  const { data: membership } = await supabase
    .from('group_members')
    .select('id')
    .eq('group_id', bet.group_id)
    .eq('user_id', user.id)
    .maybeSingle()

  // F1: Non-member sees a join prompt instead of 404
  if (!membership) {
    return (
      <main className="max-w-2xl mx-auto p-4 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl leading-snug">{bet.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-sm">
              This bet is in <strong>{bet.groups?.name}</strong>. Join the group to see details and place a bet.
            </p>
            <Link href={`/join/${bet.groups?.invite_code}`}>
              <span className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors">
                Join group
              </span>
            </Link>
          </CardContent>
        </Card>
      </main>
    )
  }

  const today = new Date().toISOString().split('T')[0]
  if (bet.status === 'open' && bet.resolution_date <= today) {
    await triggerVotingPeriod(id)
    const { data: refreshed } = await supabase
      .from('bets')
      .select(`*, groups(*), profiles!bets_created_by_fkey(*), bet_participations(*, profiles(*)), resolution_votes(*)`)
      .eq('id', id)
      .single()
    if (refreshed) Object.assign(bet, refreshed)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const participations: ParticipationWithProfile[] = ((bet.bet_participations ?? []) as any[]).map(p => ({
    ...p,
    pledge_amount: Number(p.pledge_amount),
    profile: p.profiles,
  }))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const votes = (bet.resolution_votes ?? []) as any[]
  const yesVotes = votes.filter((v: { vote: string }) => v.vote === 'yes').length
  const noVotes  = votes.filter((v: { vote: string }) => v.vote === 'no').length

  const myParticipations = participations.filter(p => p.user_id === user.id)
  const currentUserVote = votes.find((v: { user_id: string }) => v.user_id === user.id) ?? null

  const uniqueParticipants = new Set(participations.map(p => p.user_id)).size

  const isOpen      = bet.status === 'open'
  const isVoting    = bet.status === 'voting'
  const isResolved  = bet.status === 'resolved'
  const isCancelled = bet.status === 'cancelled'
  const isPastDue   = bet.resolution_date <= today
  const canStillBet = isOpen && !isPastDue
  const isCreator   = bet.created_by === user.id

  // C1: Compute 48-hour voting deadline
  const votingDeadline = bet.voting_opened_at
    ? new Date(new Date(bet.voting_opened_at).getTime() + 48 * 60 * 60 * 1000).toISOString()
    : null

  let settlement = null
  if (isResolved || isCancelled) {
    if (isCancelled || !bet.outcome) {
      settlement = createCancelledSettlement(bet.id, bet.title)
    } else {
      settlement = calculateSettlement(
        bet.id, bet.title,
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

  // Fetch settlement payments for this bet (for mark-as-paid feature)
  let paidKeys = new Set<string>()
  if (settlement && settlement.transactions.length > 0) {
    const { data: payments } = await supabase
      .from('settlement_payments')
      .select('from_user_id, to_user_id')
      .eq('bet_id', id)

    if (payments) {
      paidKeys = new Set(payments.map(p => `${p.from_user_id}:${p.to_user_id}`))
    }
  }

  // V3: Check if current user is a payee in any settlement transaction
  const isPayee = settlement?.transactions.some(t => t.toUserId === user.id) ?? false

  return (
    <main className="max-w-2xl mx-auto p-4 space-y-6">
      {/* Breadcrumb */}
      <div className="text-sm text-muted-foreground">
        <Link href={`/groups/${bet.groups?.id}`} className="hover:text-foreground">
          {bet.groups?.name}
        </Link>
        {' / Bet'}
      </div>

      {/* Bet header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="text-xl leading-snug">{bet.title}</CardTitle>
            <div className="flex items-center gap-2 shrink-0">
              {isOpen && isCreator && <CancelBetButton betId={id} />}
              <BetStatusBadge status={bet.status} />
            </div>
          </div>
          {bet.description && (
            <p className="text-muted-foreground text-sm mt-1">{bet.description}</p>
          )}
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <div className="flex justify-between">
            <span>Betting closes / votes open</span>
            <span className="text-foreground">
              {new Date(bet.resolution_date + 'T00:00:00').toLocaleDateString('en-US', {
                month: 'long', day: 'numeric', year: 'numeric',
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

      {/* Trigger voting */}
      {isOpen && isPastDue && (
        <Card className="border-amber-500/30">
          <CardContent className="pt-6">
            <p className="text-sm text-amber-400 mb-3">
              Resolution date has passed — open voting for participants.
            </p>
            <TriggerVotingButton betId={id} />
          </CardContent>
        </Card>
      )}

      {/* Place bet — moved above market state */}
      {canStillBet && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Place a bet</CardTitle>
          </CardHeader>
          <CardContent>
            <PlaceBetForm
              betId={id}
              myParticipations={myParticipations.map(p => ({
                prediction: p.prediction,
                pledge_amount: p.pledge_amount,
              }))}
              allParticipations={participations.map(p => ({
                prediction: p.prediction,
                pledge_amount: p.pledge_amount,
              }))}
              venmoUsername={currentUserProfile?.venmo_username ?? null}
              displayName={currentUserProfile?.display_name ?? ''}
            />
          </CardContent>
        </Card>
      )}

      {/* Market state */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Market</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <MarketState participations={participations} />
          <MarketChart participations={participations.map(p => ({
            prediction: p.prediction,
            pledge_amount: p.pledge_amount,
            created_at: p.created_at,
          }))} />
        </CardContent>
      </Card>

      {/* Participants */}
      {participations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Participants ({uniqueParticipants})
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

      {/* Voting */}
      {isVoting && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Vote tally</CardTitle>
            </CardHeader>
            <CardContent>
              <VoteTally yesVotes={yesVotes} noVotes={noVotes} totalParticipants={uniqueParticipants} />
            </CardContent>
          </Card>

          {/* C1: Creator resolve panel */}
          {isCreator && (
            <CreatorResolvePanel betId={id} votingDeadline={votingDeadline} />
          )}

          {myParticipations.length > 0 ? (
            <VotingPanel betId={id} hasVoted={!!currentUserVote} currentVote={currentUserVote?.vote} />
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground text-center">
                  You didn&apos;t place a bet, so you can&apos;t vote.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* V3: Payee confirmation banner */}
      {isResolved && isPayee && currentUserProfile?.venmo_username && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-amber-400 font-medium">You&apos;re owed money</p>
            <p className="text-sm text-muted-foreground mt-1">
              Confirm your Venmo handle is correct so payments reach you.
              Your current handle: <span className="font-mono font-medium text-foreground">@{currentUserProfile.venmo_username}</span>
            </p>
            <Link href="/profile" className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 mt-2 inline-block">
              Edit in profile →
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Settlement */}
      {settlement && (
        <>
          <Separator />
          <SettlementCard settlement={settlement} currentUserId={user.id} />
          <div>
            <h3 className="font-semibold mb-3">Who pays whom</h3>
            <DebtList
              betId={id}
              transactions={settlement.transactions}
              currentUserId={user.id}
              paidKeys={paidKeys}
            />
          </div>
        </>
      )}
    </main>
  )
}
