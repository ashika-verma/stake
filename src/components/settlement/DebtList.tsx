'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { markAsPaid, unmarkAsPaid } from '@/actions/settlements'
import { buildVenmoLink, buildVenmoWebLink } from '@/lib/venmo'
import type { DebtTransaction } from '@/types/app'

interface DebtListProps {
  betId: string
  transactions: DebtTransaction[]
  currentUserId: string
  paidKeys: Set<string>
}

export function DebtList({ betId, transactions, currentUserId, paidKeys: initialPaidKeys }: DebtListProps) {
  const [paidKeys, setPaidKeys] = useState<Set<string>>(initialPaidKeys)
  const [loadingKey, setLoadingKey] = useState<string | null>(null)
  const [confirmPending, setConfirmPending] = useState<DebtTransaction | null>(null)

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

  async function handleMarkPaid(t: DebtTransaction) {
    const key = `${t.fromUserId}:${t.toUserId}`
    setLoadingKey(key)
    const result = await markAsPaid(betId, t.toUserId, t.amount)
    setLoadingKey(null)
    if (!result.error) {
      setPaidKeys(prev => new Set([...prev, key]))
    }
  }

  async function handleUnmarkPaid(t: DebtTransaction) {
    const key = `${t.fromUserId}:${t.toUserId}`
    setLoadingKey(key)
    const result = await unmarkAsPaid(betId, t.toUserId)
    setLoadingKey(null)
    if (!result.error) {
      setPaidKeys(prev => {
        const next = new Set(prev)
        next.delete(key)
        return next
      })
    }
  }

  const renderTransaction = (t: DebtTransaction, isMe: boolean) => {
    const iOwe = t.fromUserId === currentUserId
    const theyOweMe = t.toUserId === currentUserId
    const txKey = `${t.fromUserId}:${t.toUserId}`
    const isPaid = paidKeys.has(txKey)
    const isLoading = loadingKey === txKey

    return (
      <div
        key={txKey}
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

        {iOwe && (
          <div className="space-y-2">
            {!isPaid && t.toVenmoUsername && (
              <Button
                size="sm"
                className="bg-[#3D95CE] hover:bg-[#2e7db5] text-white"
                onClick={() => setConfirmPending(t)}
              >
                Pay via Venmo
              </Button>
            )}
            {isPaid ? (
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-green-400">✓ Paid</span>
                <button
                  onClick={() => handleUnmarkPaid(t)}
                  disabled={isLoading}
                  className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 disabled:opacity-50"
                >
                  {isLoading ? 'Undoing...' : 'Undo'}
                </button>
              </div>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleMarkPaid(t)}
                disabled={isLoading}
                className="text-xs h-7 px-2"
              >
                {isLoading ? 'Marking...' : 'Mark as paid'}
              </Button>
            )}
          </div>
        )}

        {theyOweMe && (
          <p className="text-xs text-muted-foreground">
            {isPaid
              ? <span className="text-green-400 font-medium">✓ Paid</span>
              : 'Awaiting payment'}
          </p>
        )}
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3">
        {myTransactions.map(t => renderTransaction(t, true))}
        {otherTransactions.map(t => renderTransaction(t, false))}
      </div>

      {/* V2: Pre-payment confirmation dialog */}
      {confirmPending && (
        <VenmoConfirmDialog
          transaction={confirmPending}
          onClose={() => setConfirmPending(null)}
        />
      )}
    </>
  )
}

function VenmoConfirmDialog({
  transaction,
  onClose,
}: {
  transaction: DebtTransaction
  onClose: () => void
}) {
  const deepLink = buildVenmoLink({
    username: transaction.toVenmoUsername!,
    amount: transaction.amount,
    note: `Stake bet: ${transaction.betTitle}`,
  })
  const webLink = buildVenmoWebLink({
    username: transaction.toVenmoUsername!,
    amount: transaction.amount,
    note: `Stake bet: ${transaction.betTitle}`,
  })

  return (
    <AlertDialog open onOpenChange={open => { if (!open) onClose() }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm payment</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2 text-sm">
              <p>
                Paying <span className="font-mono font-medium text-foreground">@{transaction.toVenmoUsername}</span>{' '}
                <span className="font-semibold text-foreground">${transaction.amount.toFixed(2)}</span>
              </p>
              <p>
                Ask <strong>{transaction.toDisplayName}</strong> to confirm this is their correct Venmo handle before paying.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction asChild>
            <a
              href={typeof window !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ? deepLink : webLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onClose}
            >
              Open Venmo
            </a>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
