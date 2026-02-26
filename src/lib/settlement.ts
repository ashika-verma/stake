import type { BetOutcome } from '@/types/database'
import type { BetSettlement, DebtTransaction, PersonBalance } from '@/types/app'

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/**
 * Calculate net balances after a bet resolves.
 * Winners receive proportional share of the total losing pool.
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

  return participations.map(p => {
    if (p.prediction === outcome) {
      // Winner: gets back pledge + proportional share of losing pool
      const share = totalWinningPledges > 0
        ? round2((p.pledgeAmount / totalWinningPledges) * totalLosingPool)
        : 0
      return {
        userId: p.userId,
        displayName: p.displayName,
        venmoUsername: p.venmoUsername,
        net: round2(share), // positive = owed money (from losers)
      }
    } else {
      // Loser: owes their pledge
      return {
        userId: p.userId,
        displayName: p.displayName,
        venmoUsername: p.venmoUsername,
        net: round2(-p.pledgeAmount), // negative = owes money
      }
    }
  })
}

/**
 * Greedy two-pointer debt simplification.
 * Produces the minimal set of transactions to settle all debts.
 */
export function simplifyDebts(balances: PersonBalance[], betTitle: string): DebtTransaction[] {
  const DUST = 0.005

  // Filter out dust amounts
  const filtered = balances.filter(b => Math.abs(b.net) >= DUST)

  const creditors = filtered
    .filter(b => b.net > 0)
    .map(b => ({ ...b }))
    .sort((a, b) => b.net - a.net) // largest creditor first

  const debtors = filtered
    .filter(b => b.net < 0)
    .map(b => ({ ...b }))
    .sort((a, b) => a.net - b.net) // largest debtor first (most negative)

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
      })
    }

    creditor.net = round2(creditor.net - amount)
    debtor.net = round2(debtor.net + amount)

    if (Math.abs(creditor.net) < DUST) ci++
    if (Math.abs(debtor.net) < DUST) di++
  }

  return transactions
}

/**
 * Full settlement calculation for a resolved bet.
 */
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
  const transactions = simplifyDebts(balances, betTitle)

  return {
    betId,
    betTitle,
    outcome,
    totalPool,
    winningPool,
    losingPool,
    balances,
    transactions,
  }
}

/**
 * Settlement for a cancelled bet (tie or no outcome) — no money changes hands.
 */
export function createCancelledSettlement(betId: string, betTitle: string): BetSettlement {
  return {
    betId,
    betTitle,
    outcome: null,
    totalPool: 0,
    winningPool: 0,
    losingPool: 0,
    balances: [],
    transactions: [],
  }
}
