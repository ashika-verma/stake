import type { VoteResult } from '@/types/app'

const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000

/**
 * Determine if a bet should be resolved based on current votes.
 *
 * Rules:
 * - Early resolve: >50% of participants have voted AND one outcome has
 *   a strict majority of votes cast
 * - 48hr fallback: after 48 hours from voting_opened_at, whichever has
 *   more votes wins; true tie → cancel
 */
export function checkVoteResolution(
  votes: Array<{ vote: 'yes' | 'no' }>,
  totalParticipants: number,
  votingOpenedAt: string
): VoteResult {
  const yesVotes = votes.filter(v => v.vote === 'yes').length
  const noVotes = votes.filter(v => v.vote === 'no').length
  const totalVotes = yesVotes + noVotes

  const openedAt = new Date(votingOpenedAt).getTime()
  const elapsed = Date.now() - openedAt
  const past48Hours = elapsed >= FORTY_EIGHT_HOURS_MS

  // Base result
  const base: Omit<VoteResult, 'shouldResolve' | 'outcome' | 'cancelled'> = {
    yesVotes,
    noVotes,
    totalVotes,
    totalParticipants,
  }

  // 48-hour fallback
  if (past48Hours) {
    if (yesVotes === noVotes) {
      // True tie → cancel
      return { ...base, shouldResolve: true, outcome: null, cancelled: true }
    }
    const outcome = yesVotes > noVotes ? 'yes' : 'no'
    return { ...base, shouldResolve: true, outcome, cancelled: false }
  }

  // Early resolve: >50% participation AND one side has strict majority of votes cast
  const participationRate = totalParticipants > 0 ? totalVotes / totalParticipants : 0
  if (participationRate > 0.5 && totalVotes > 0) {
    if (yesVotes > noVotes) {
      return { ...base, shouldResolve: true, outcome: 'yes', cancelled: false }
    }
    if (noVotes > yesVotes) {
      return { ...base, shouldResolve: true, outcome: 'no', cancelled: false }
    }
  }

  return { ...base, shouldResolve: false, outcome: null, cancelled: false }
}
