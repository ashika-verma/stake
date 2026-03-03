import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { signOut } from '@/actions/auth'

interface HeaderProps {
  displayName?: string
}

export function Header({ displayName }: HeaderProps) {
  return (
    <header className="border-b bg-background shrink-0">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/dashboard" className="font-bold text-lg tracking-tight">
          Stake
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/my-bets" className="hidden md:block text-sm text-muted-foreground hover:text-foreground transition-colors">
            My bets
          </Link>
          {displayName && (
            <Link href="/profile" className="text-sm text-muted-foreground hidden sm:block hover:text-foreground transition-colors">
              {displayName}
            </Link>
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
