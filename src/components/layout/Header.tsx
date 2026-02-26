import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { signOut } from '@/actions/auth'

interface HeaderProps {
  displayName?: string
}

export function Header({ displayName }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/dashboard" className="font-bold text-lg tracking-tight">
          Stake
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/my-bets" className="hidden md:block text-sm text-muted-foreground hover:text-foreground transition-colors">
            My bets
          </Link>
          {displayName && (
            <span className="text-sm text-muted-foreground hidden sm:block">{displayName}</span>
          )}
          <form action={signOut}>
            <Button type="submit" variant="ghost" size="sm">
              Sign out
            </Button>
          </form>
        </div>
      </div>
    </header>
  )
}
