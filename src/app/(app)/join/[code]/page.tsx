import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { JoinGroupForm } from '@/components/groups/JoinGroupForm'

interface Props {
  params: Promise<{ code: string }>
}

export default async function JoinPage({ params }: Props) {
  const { code } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const { data: group } = await supabase
    .from('groups')
    .select('name, group_members(count)')
    .ilike('invite_code', code)
    .single()

  const memberCount = group
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? (group.group_members as any)?.[0]?.count ?? 0
    : 0

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Join group</CardTitle>
          <CardDescription>
            {group ? (
              <>
                You&apos;ve been invited to join <strong>{group.name}</strong> — {memberCount} member{memberCount !== 1 ? 's' : ''}.
              </>
            ) : (
              <span className="text-destructive">Invalid invite code — no group found.</span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!group && (
            <p className="text-sm text-muted-foreground">Double-check the link and try again.</p>
          )}
          {group && <JoinGroupForm code={code} />}
        </CardContent>
      </Card>
    </main>
  )
}
