import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { InviteCodeDisplay } from '@/components/groups/InviteCodeDisplay'
import { ActivityFeed, type ActivityEvent } from '@/components/groups/ActivityFeed'
import { BetList } from '@/components/bets/BetList'
import type { BetStatus } from '@/types/database'

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

  // Fetch bets + recent participations for activity feed in parallel
  const [{ data: bets }, { data: recentParticipations }] = await Promise.all([
    supabase
      .from('bets')
      .select('*, profiles!bets_created_by_fkey(*), bet_participations(*)')
      .eq('group_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('bet_participations')
      .select('user_id, prediction, pledge_amount, created_at, bets!inner(id, title, group_id, status, outcome, voting_opened_at), profiles(display_name)')
      .eq('bets.group_id', id)
      .order('created_at', { ascending: false })
      .limit(30),
  ])

  const members = group.group_members as Array<{
    id: string
    user_id: string
    profiles: { id: string; display_name: string; venmo_username: string | null }
  }>

  // Build activity feed from bets + participations
  const events: ActivityEvent[] = []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const betsArr = (bets ?? []) as any[]

  for (const b of betsArr) {
    // Bet created event
    events.push({
      type: 'bet_created',
      betId: b.id,
      betTitle: b.title,
      actorName: b.profiles?.display_name ?? 'Someone',
      timestamp: b.created_at,
    })

    // Voting opened event
    if (b.voting_opened_at) {
      events.push({
        type: 'voting_opened',
        betId: b.id,
        betTitle: b.title,
        actorName: '',
        timestamp: b.voting_opened_at,
      })
    }

    // Resolved event
    if (b.status === 'resolved' || b.status === 'cancelled') {
      events.push({
        type: 'bet_resolved',
        betId: b.id,
        betTitle: b.title,
        actorName: '',
        timestamp: b.updated_at,
        meta: { outcome: b.outcome, status: b.status as BetStatus },
      })
    }
  }

  // Participation events
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const p of ((recentParticipations ?? []) as any[])) {
    events.push({
      type: 'bet_participated',
      betId: p.bets?.id,
      betTitle: p.bets?.title ?? '',
      actorName: p.profiles?.display_name ?? 'Someone',
      timestamp: p.created_at,
      meta: {
        prediction: p.prediction as 'yes' | 'no',
        amount: Number(p.pledge_amount),
      },
    })
  }

  // Sort by timestamp descending and take top 20
  events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  const feedEvents = events.slice(0, 20)

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

      <InviteCodeDisplay inviteCode={group.invite_code} />

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

      <Separator />

      {feedEvents.length > 0 && (
        <>
          <div>
            <h2 className="font-semibold mb-3">Activity</h2>
            <ActivityFeed events={feedEvents} />
          </div>
          <Separator />
        </>
      )}

      <div>
        <h2 className="font-semibold mb-3">Bets</h2>
        {betsArr.length > 0 ? (
          <BetList bets={bets as Parameters<typeof BetList>[0]['bets']} currentUserId={user.id} />
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg font-medium mb-1">No bets yet</p>
            <p className="text-sm mb-4">Be the first to create a bet for this group</p>
            <Link href={`/groups/${id}/bets/new`}>
              <Button variant="outline">Create first bet</Button>
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}
