import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { GroupCard } from '@/components/groups/GroupCard'
import { BetList } from '@/components/bets/BetList'
import { JoinByCodeForm } from '@/components/groups/JoinByCodeForm'
import { Separator } from '@/components/ui/separator'
import type { Group } from '@/types/database'

type GroupWithMeta = Group & { member_count: number }

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get all groups the user is a member of
  const { data: memberships } = await supabase
    .from('group_members')
    .select('group_id, groups(*, group_members(count))')
    .eq('user_id', user.id)
    .order('joined_at', { ascending: false })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const groups: GroupWithMeta[] = ((memberships ?? []) as any[]).map((m) => {
    const g = m.groups
    return {
      ...(g as Group),
      member_count: (g?.group_members?.[0]?.count as number) ?? 0,
    }
  })

  // Get recent bets across all user's groups
  const groupIds = groups.map(g => g.id)
  let recentBets: Parameters<typeof BetList>[0]['bets'] = []

  if (groupIds.length > 0) {
    const { data: bets } = await supabase
      .from('bets')
      .select('*, bet_participations(*), groups(name)')
      .in('group_id', groupIds)
      .order('created_at', { ascending: false })
      .limit(10)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recentBets = (bets ?? []) as any
  }

  return (
    <main className="max-w-2xl mx-auto p-4 space-y-8">
      {/* Groups section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Your groups</h2>
          <Link href="/groups/new">
            <Button variant="outline" size="sm">+ New group</Button>
          </Link>
        </div>

        {groups.length > 0 ? (
          <div className="space-y-3">
            {groups.map(group => (
              <GroupCard key={group.id} group={group} />
            ))}
          </div>
        ) : (
          <div className="space-y-6 py-12 border border-dashed rounded-lg px-6 text-center">
            <div className="space-y-1">
              <p className="font-medium">Welcome to Stake</p>
              <p className="text-sm text-muted-foreground">
                Bet on anything with friends and settle up via Venmo.
              </p>
            </div>
            <div className="space-y-3">
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Have an invite code?</p>
                <JoinByCodeForm />
              </div>
              <div className="flex items-center gap-3 max-w-xs mx-auto">
                <Separator className="flex-1" />
                <span className="text-xs text-muted-foreground">or</span>
                <Separator className="flex-1" />
              </div>
              <Link href="/groups/new">
                <Button variant="outline" className="w-full max-w-xs">Create a group</Button>
              </Link>
            </div>
          </div>
        )}
      </section>

      {recentBets.length > 0 && (
        <>
          <Separator />
          <section>
            <h2 className="text-lg font-semibold mb-4">Recent bets</h2>
            <BetList bets={recentBets} currentUserId={user.id} />
          </section>
        </>
      )}
    </main>
  )
}
