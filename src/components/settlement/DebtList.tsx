import { VenmoButton } from './VenmoButton'
import { MarkAsPaidButton } from './MarkAsPaidButton'
import type { DebtTransaction } from '@/types/app'

interface DebtListProps {
  transactions: DebtTransaction[]
  currentUserId: string
  paidKeys: Set<string>
}

/** key format: `${betId}:${fromUserId}:${toUserId}` */
function makePaidKey(t: DebtTransaction) {
  return `${t.betId}:${t.fromUserId}:${t.toUserId}`
}

export function DebtList({ transactions, currentUserId, paidKeys }: DebtListProps) {
  if (transactions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No payments needed — everyone was on the same side!
      </p>
    )
  }

  const myTransactions = transactions.filter(
    t => t.fromUserId === currentUserId || t.toUserId === currentUserId
  )
  const otherTransactions = transactions.filter(
    t => t.fromUserId !== currentUserId && t.toUserId !== currentUserId
  )

  const renderTransaction = (t: DebtTransaction, isMe: boolean) => {
    const iOwe = t.fromUserId === currentUserId
    const theyOweMe = t.toUserId === currentUserId
    const isPaid = paidKeys.has(makePaidKey(t))

    return (
      <div
        key={`${t.fromUserId}-${t.toUserId}`}
        className={`rounded-lg border p-4 space-y-3 ${
          isPaid
            ? 'border-green-500/20 bg-green-500/5 opacity-60'
            : isMe
            ? 'border-primary/30 bg-primary/5'
            : 'border-border'
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
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg">${t.amount.toFixed(2)}</span>
            {isPaid && (
              <span className="text-xs font-medium text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">
                Paid
              </span>
            )}
          </div>
        </div>

        {!isPaid && iOwe && (
          <div className="flex gap-2 flex-wrap items-center">
            {t.toVenmoUsername && (
              <VenmoButton
                username={t.toVenmoUsername}
                amount={t.amount}
                note={`Stake bet: ${t.betTitle}`}
              />
            )}
            <MarkAsPaidButton betId={t.betId} toUserId={t.toUserId} amount={t.amount} />
          </div>
        )}

        {!isPaid && theyOweMe && (
          <p className="text-xs text-muted-foreground italic">
            Waiting for {t.fromDisplayName} to pay
          </p>
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
