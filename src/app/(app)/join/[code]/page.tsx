import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { JoinGroupForm } from '@/components/groups/JoinGroupForm'

interface Props {
  params: Promise<{ code: string }>
}

export default async function JoinPage({ params }: Props) {
  const { code } = await params

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
          <JoinGroupForm code={code} />
        </CardContent>
      </Card>
    </main>
  )
}
