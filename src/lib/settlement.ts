import type { BetOutcome } from '@/types/database'
import type { BetSettlement, DebtTransaction, PersonBalance } from '@/types/app'

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/**
 * Calculate net balances after a bet resolves.
 * Supports hedging: a user may have both a yes and a no participation.
 * Net = sum of winning shares earned - sum of losing pledges paid.
 */
export function calculateBalances(
  participations: Array<{
    userId: string
    displayName: string
    venmoUsername: string | null
    prediction: 'yes' | 'no'
    pledgeAmount: number
  }>,
  outcome: BetOutcome
): PersonBalance[] {
  const winners = participations.filter(p => p.prediction === outcome)
  const losers = participations.filter(p => p.prediction !== outcome)

  const totalWinningPledges = round2(winners.reduce((s, p) => s + p.pledgeAmount, 0))
  const totalLosingPool = round2(losers.reduce((s, p) => s + p.pledgeAmount, 0))

  // Aggregate per user — a hedger appears on both sides
  const byUser = new Map<string, { displayName: string; venmoUsername: string | null; net: number }>()

  const ensureUser = (p: typeof participations[0]) => {
    if (!byUser.has(p.userId)) {
      byUser.set(p.userId, { displayName: p.displayName, venmoUsername: p.venmoUsername, net: 0 })
    }
    return byUser.get(p.userId)!
  }

  for (const p of winners) {
    const user = ensureUser(p)
    const share = totalWinningPledges > 0
      ? round2((p.pledgeAmount / totalWinningPledges) * totalLosingPool)
      : 0
    user.net = round2(user.net + share) // positive: owed money
  }

  for (const p of losers) {
    const user = ensureUser(p)
    user.net = round2(user.net - p.pledgeAmount) // negative: owes money
  }

  return Array.from(byUser.entries()).map(([userId, u]) => ({
    userId,
    displayName: u.displayName,
    venmoUsername: u.venmoUsername,
    net: u.net,
  }))
}

/**
 * Greedy two-pointer debt simplification.
 */
export function simplifyDebts(balances: PersonBalance[], betTitle: string, betId: string): DebtTransaction[] {
  const DUST = 0.005

  const creditors = balances
    .filter(b => b.net > DUST)
    .map(b => ({ ...b }))
    .sort((a, b) => b.net - a.net)

  const debtors = balances
    .filter(b => b.net < -DUST)
    .map(b => ({ ...b }))
    .sort((a, b) => a.net - b.net)

  const transactions: DebtTransaction[] = []
  let ci = 0
  let di = 0

  while (ci < creditors.length && di < debtors.length) {
    const creditor = creditors[ci]
    const debtor = debtors[di]
    const amount = round2(Math.min(creditor.net, -debtor.net))

    if (amount >= DUST) {
      transactions.push({
        fromUserId: debtor.userId,
        fromDisplayName: debtor.displayName,
        toUserId: creditor.userId,
        toDisplayName: creditor.displayName,
        toVenmoUsername: creditor.venmoUsername,
        amount,
        betTitle,
        betId,
      })
    }

    creditor.net = round2(creditor.net - amount)
    debtor.net = round2(debtor.net + amount)

    if (Math.abs(creditor.net) < DUST) ci++
    if (Math.abs(debtor.net) < DUST) di++
  }

  return transactions
}

export function calculateSettlement(
  betId: string,
  betTitle: string,
  participations: Array<{
    userId: string
    displayName: string
    venmoUsername: string | null
    prediction: 'yes' | 'no'
    pledgeAmount: number
  }>,
  outcome: BetOutcome
): BetSettlement {
  const totalPool = round2(participations.reduce((s, p) => s + p.pledgeAmount, 0))
  const winningPool = round2(
    participations.filter(p => p.prediction === outcome).reduce((s, p) => s + p.pledgeAmount, 0)
  )
  const losingPool = round2(totalPool - winningPool)

  const balances = calculateBalances(participations, outcome)
  const transactions = simplifyDebts(balances, betTitle, betId)

  return { betId, betTitle, outcome, totalPool, winningPool, losingPool, balances, transactions }
}

export function createCancelledSettlement(betId: string, betTitle: string): BetSettlement {
  return {
    betId, betTitle, outcome: null,
    totalPool: 0, winningPool: 0, losingPool: 0,
    balances: [], transactions: [],
  }
}
