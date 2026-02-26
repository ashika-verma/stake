import type { Prediction } from '@/types/database'

interface MarketStateProps {
  participations: Array<{ prediction: Prediction; pledge_amount: number }>
}

function round2(n: number) {
  return Math.round(n * 100) / 100
}

export function MarketState({ participations }: MarketStateProps) {
  const yesPool = round2(
    participations.filter(p => p.prediction === 'yes').reduce((s, p) => s + Number(p.pledge_amount), 0)
  )
  const noPool = round2(
    participations.filter(p => p.prediction === 'no').reduce((s, p) => s + Number(p.pledge_amount), 0)
  )
  const total = round2(yesPool + noPool)

  if (total === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-2">
        No bets placed yet — be the first.
      </p>
    )
  }

  const yesWidth = total > 0 ? (yesPool / total) * 100 : 50
  const noWidth = 100 - yesWidth

  // Implied payout multipliers (how much you get back per $1 bet if you win)
  const yesPayout = yesPool > 0 ? round2(1 + noPool / yesPool) : null
  const noPayout  = noPool  > 0 ? round2(1 + yesPool / noPool)  : null

  return (
    <div className="space-y-3">
      {/* Pool bar */}
      <div className="flex h-4 rounded-full overflow-hidden bg-secondary">
        {yesPool > 0 && (
          <div className="bg-green-500 transition-all duration-500 flex items-center justify-center"
            style={{ width: `${yesWidth}%` }} />
        )}
        {noPool > 0 && (
          <div className="bg-red-500 transition-all duration-500"
            style={{ width: `${noWidth}%` }} />
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 text-center text-sm">
        <div className="rounded-lg bg-green-500/10 p-2">
          <p className="font-semibold text-green-400">${yesPool.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">Yes pool</p>
          {yesPayout && (
            <p className="text-xs text-green-400 font-medium">{yesPayout}x payout</p>
          )}
        </div>
        <div className="rounded-lg bg-secondary p-2">
          <p className="font-semibold">${total.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-xs text-muted-foreground">{participations.length} bet{participations.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="rounded-lg bg-red-500/10 p-2">
          <p className="font-semibold text-red-400">${noPool.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">No pool</p>
          {noPayout && (
            <p className="text-xs text-red-400 font-medium">{noPayout}x payout</p>
          )}
        </div>
      </div>
    </div>
  )
}
