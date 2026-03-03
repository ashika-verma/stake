import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { InviteCodeDisplay } from '@/components/groups/InviteCodeDisplay'
import { BetList } from '@/components/bets/BetList'

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

  // Fetch bets for this group
  const { data: bets } = await supabase
    .from('bets')
    .select('*, profiles!bets_created_by_fkey(*), bet_participations(*)')
    .eq('group_id', id)
    .order('created_at', { ascending: false })

  const members = group.group_members as Array<{
    id: string
    user_id: string
    profiles: { id: string; display_name: string; venmo_username: string | null }
  }>

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
