import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { InviteCodeDisplay } from '@/components/groups/InviteCodeDisplay'
import { BetList } from '@/components/bets/BetList'
import { GroupLeaderboard } from '@/components/groups/GroupLeaderboard'
import { calculateBalances } from '@/lib/settlement'

interface Props {
  params: Promise<{ id: string }>
}

export default async function GroupPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  // Fetch group with members
  const { data: group } = await supabase
    .from('groups')
    .select('*, group_members(*, profiles(*))')
    .eq('id', id)
    .single()

  if (!group) notFound()

  // Fetch bets for this group (with participations + profiles for leaderboard)
  const { data: bets } = await supabase
    .from('bets')
    .select('*, profiles!bets_created_by_fkey(*), bet_participations(*, profiles(*))')
    .eq('group_id', id)
    .order('created_at', { ascending: false })

  const members = group.group_members as Array<{
    id: string
    user_id: string
    profiles: { id: string; display_name: string; venmo_username: string | null }
  }>

  // F3: Compute leaderboard from resolved bets
  const resolvedBets = (bets ?? []).filter(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (b: any) => b.status === 'resolved' && b.outcome
  )

  const netPnlByUser = new Map<string, { displayName: string; net: number }>()

  for (const bet of resolvedBets) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const participations = ((bet.bet_participations ?? []) as any[]).map((p: any) => ({
      userId: p.user_id as string,
      displayName: (p.profiles?.display_name ?? 'Unknown') as string,
      venmoUsername: (p.profiles?.venmo_username ?? null) as string | null,
      prediction: p.prediction as 'yes' | 'no',
      pledgeAmount: Number(p.pledge_amount),
    }))

    if (participations.length === 0) continue

    const balances = calculateBalances(participations, bet.outcome)
    for (const b of balances) {
      const existing = netPnlByUser.get(b.userId)
      if (existing) {
        existing.net = Math.round((existing.net + b.net) * 100) / 100
      } else {
        netPnlByUser.set(b.userId, { displayName: b.displayName, net: b.net })
      }
    }
  }

  const leaderboardEntries = Array.from(netPnlByUser.entries())
    .map(([userId, { displayName, net }]) => ({ userId, displayName, netPnl: net }))
    .sort((a, b) => b.netPnl - a.netPnl)

  return (
    <main className="max-w-2xl mx-auto p-4 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{group.name}</h1>
          <p className="text-muted-foreground text-sm">{members.length} member{members.length !== 1 ? 's' : ''}</p>
        </div>
        <Link href={`/groups/${id}/bets/new`}>
          <Button>+ New bet</Button>
        </Link>
      </div>

      <InviteCodeDisplay inviteCode={group.invite_code} groupId={group.id} />

      <Separator />

      <div>
        <h2 className="font-semibold mb-3">Members</h2>
        <div className="flex flex-wrap gap-2">
          {members.map(m => (
            <span key={m.user_id} className="text-sm bg-secondary px-3 py-1 rounded-full">
              {m.profiles.display_name}
              {m.user_id === user.id && <span className="text-muted-foreground"> (you)</span>}
            </span>
          ))}
        </div>
      </div>

      {/* F3: Leaderboard — only shown if ≥1 resolved bet */}
      {leaderboardEntries.length > 0 && (
        <>
          <Separator />
          <GroupLeaderboard entries={leaderboardEntries} currentUserId={user.id} />
        </>
      )}

      <Separator />

      <div>
        <h2 className="font-semibold mb-3">Bets</h2>
        {bets && bets.length > 0 ? (
          <BetList bets={bets} currentUserId={user.id} />
        ) : (
          <div className="rounded-lg border border-dashed p-8 text-center space-y-4">
            <div>
              <p className="font-medium">No bets yet</p>
              <p className="text-sm text-muted-foreground mt-1">Be the first to post one.</p>
            </div>
            <Link href={`/groups/${id}/bets/new`}>
              <Button>New bet</Button>
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}
