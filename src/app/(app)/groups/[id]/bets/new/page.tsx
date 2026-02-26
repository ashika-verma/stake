import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CreateBetForm } from '@/components/bets/CreateBetForm'

interface Props {
  params: Promise<{ id: string }>
}

export default async function NewBetPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: group } = await supabase
    .from('groups')
    .select('id, name')
    .eq('id', id)
    .single()

  if (!group) notFound()

  return (
    <main className="max-w-md mx-auto p-4 pt-8">
      <Card>
        <CardHeader>
          <CardTitle>New bet</CardTitle>
          <CardDescription>Create a bet for <strong>{group.name}</strong></CardDescription>
        </CardHeader>
        <CardContent>
          <CreateBetForm groupId={id} />
        </CardContent>
      </Card>
    </main>
  )
}
