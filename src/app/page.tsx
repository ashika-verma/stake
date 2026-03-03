import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) redirect('/dashboard')

  return (
    <main className="min-h-screen flex flex-col">
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-5xl font-extrabold tracking-tight">
            Stake
          </h1>
          <p className="text-xl text-muted-foreground max-w-md">
            Make friendly bets with your crew. Put money where your mouth is.
            Settle up with Venmo when it&apos;s over.
          </p>
        </div>

        <div className="flex gap-4">
          <Link href="/signup">
            <Button size="lg">Get started</Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline">Sign in</Button>
          </Link>
        </div>

        {/* Feature list */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-8 max-w-2xl w-full text-left">
          {[
            {
              icon: '🎯',
              title: 'Make bets',
              description: 'Create yes/no questions on real-life events with a resolution date',
            },
            {
              icon: '🗳️',
              title: 'Vote on outcomes',
              description: 'When the date passes, participants vote on what actually happened',
            },
            {
              icon: '💸',
              title: 'Settle with Venmo',
              description: 'Get a clear breakdown of who owes whom with one-tap Venmo links',
            },
          ].map(f => (
            <div key={f.title} className="rounded-lg border p-4 space-y-2">
              <div className="text-2xl">{f.icon}</div>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.description}</p>
            </div>
          ))}
        </div>

        {/* F4: Example bet */}
        <div className="max-w-sm w-full text-left space-y-2">
          <p className="text-sm text-muted-foreground text-center font-medium">How it looks</p>
          <Card className="opacity-90">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base leading-snug">
                  Will the Bears make the playoffs?
                </CardTitle>
                <span className="shrink-0 rounded-full bg-green-500/20 px-2 py-0.5 text-xs font-medium text-green-400">
                  Open
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Closes Mar 15</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex h-3 rounded-full overflow-hidden bg-secondary">
                <div className="bg-green-500" style={{ width: '60%' }} />
                <div className="bg-red-500" style={{ width: '40%' }} />
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-lg bg-green-500/10 p-2">
                  <p className="font-semibold text-green-400">$45.00</p>
                  <p className="text-muted-foreground">Bet on Yes</p>
                </div>
                <div className="rounded-lg bg-secondary p-2">
                  <p className="font-semibold">$75.00</p>
                  <p className="text-muted-foreground">Total · 4 bets</p>
                </div>
                <div className="rounded-lg bg-red-500/10 p-2">
                  <p className="font-semibold text-red-400">$30.00</p>
                  <p className="text-muted-foreground">Bet on No</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <p className="text-xs text-muted-foreground text-center">Example bet — yours will look like this.</p>
        </div>
      </div>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        Stake — friendly betting for friend groups
      </footer>
    </main>
  )
}
