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

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, venmo_username')
    .eq('id', user.id)
    .single()

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Join group</CardTitle>
          <CardDescription>
            You&apos;ve been invited to join a betting group using code{' '}
            <span className="font-mono font-bold">{code.toUpperCase()}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <JoinGroupForm
            code={code}
            hasVenmo={!!profile?.venmo_username}
            displayName={profile?.display_name ?? ''}
          />
        </CardContent>
      </Card>
    </main>
  )
}
