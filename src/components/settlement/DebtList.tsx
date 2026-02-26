import { VenmoButton } from './VenmoButton'
import type { DebtTransaction } from '@/types/app'

interface DebtListProps {
  transactions: DebtTransaction[]
  currentUserId: string
}

export function DebtList({ transactions, currentUserId }: DebtListProps) {
  if (transactions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No payments needed — everyone was on the same side!
      </p>
    )
  }

  // Show transactions involving the current user first
  const myTransactions = transactions.filter(
    t => t.fromUserId === currentUserId || t.toUserId === currentUserId
  )
  const otherTransactions = transactions.filter(
    t => t.fromUserId !== currentUserId && t.toUserId !== currentUserId
  )

  const renderTransaction = (t: DebtTransaction, isMe: boolean) => {
    const iOwe = t.fromUserId === currentUserId
    const theyOweMe = t.toUserId === currentUserId

    return (
      <div
        key={`${t.fromUserId}-${t.toUserId}`}
        className={`rounded-lg border p-4 space-y-3 ${
          isMe ? 'border-primary/30 bg-primary/5' : 'border-border'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="font-medium text-sm">
              <span className={iOwe ? 'text-red-400' : theyOweMe ? 'text-green-400' : ''}>
                {t.fromDisplayName}
              </span>
              {' → '}
              <span className={theyOweMe ? 'text-green-400' : ''}>
                {t.toDisplayName}
              </span>
            </p>
            <p className="text-xs text-muted-foreground">for &quot;{t.betTitle}&quot;</p>
          </div>
          <span className="font-bold text-lg">${t.amount.toFixed(2)}</span>
        </div>
        {iOwe && t.toVenmoUsername && (
          <VenmoButton
            username={t.toVenmoUsername}
            amount={t.amount}
            note={`Stake bet: ${t.betTitle}`}
          />
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {myTransactions.map(t => renderTransaction(t, true))}
      {otherTransactions.map(t => renderTransaction(t, false))}
    </div>
  )
}
