import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { BetSettlement, PersonBalance } from '@/types/app'

interface SettlementCardProps {
  settlement: BetSettlement
  currentUserId: string
}

function BalanceRow({ balance, isMe }: { balance: PersonBalance; isMe: boolean }) {
  const isPositive = balance.net > 0
  return (
    <div className={`flex justify-between items-center py-2 ${isMe ? 'font-semibold' : ''}`}>
      <span className="text-sm">
        {balance.displayName}
        {isMe && <span className="text-muted-foreground font-normal"> (you)</span>}
      </span>
      <span className={`text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
        {isPositive ? '+' : ''}${Math.abs(balance.net).toFixed(2)}
        {isPositive ? ' earned' : ' lost'}
      </span>
    </div>
  )
}

export function SettlementCard({ settlement, currentUserId }: SettlementCardProps) {
  const { outcome, totalPool, winningPool, losingPool, balances } = settlement

  if (!outcome) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base text-zinc-400">Bet cancelled — no winner</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            The vote ended in a tie after 48 hours. No money changes hands.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Outcome:{' '}
          <span className={outcome === 'yes' ? 'text-green-400' : 'text-red-400'}>
            {outcome === 'yes' ? '✓ Yes' : '✗ No'}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-lg bg-secondary p-3">
            <p className="text-2xl font-bold">${totalPool.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Total pool</p>
          </div>
          <div className="rounded-lg bg-green-500/10 p-3">
            <p className="text-2xl font-bold text-green-400">${winningPool.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Winners staked</p>
          </div>
          <div className="rounded-lg bg-red-500/10 p-3">
            <p className="text-2xl font-bold text-red-400">${losingPool.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Losers staked</p>
          </div>
        </div>

        {balances.length > 0 && (
          <>
            <Separator />
            <div>
              <p className="text-sm font-medium mb-2">P&amp;L breakdown</p>
              {balances.map(b => (
                <BalanceRow
                  key={b.userId}
                  balance={b}
                  isMe={b.userId === currentUserId}
                />
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
