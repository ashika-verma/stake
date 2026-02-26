import type { Bet, BetOutcome, BetParticipation, Group, GroupMember, Profile, ResolutionVote } from './database'

// ============================================================
// Rich joined types
// ============================================================

export interface GroupWithMemberCount extends Group {
  member_count: number
}

export interface GroupDetail extends Group {
  members: (GroupMember & { profile: Profile })[]
}

export interface ParticipationWithProfile extends BetParticipation {
  profile: Profile
}

export interface VoteWithProfile extends ResolutionVote {
  profile: Profile
}

export interface BetDetail extends Bet {
  group: Group
  creator: Profile
  participations: ParticipationWithProfile[]
  votes: VoteWithProfile[]
  current_user_participation: BetParticipation | null
  current_user_vote: ResolutionVote | null
}

// ============================================================
// Settlement types
// ============================================================

export interface PersonBalance {
  userId: string
  displayName: string
  venmoUsername: string | null
  net: number // positive = owed money, negative = owes money
}

export interface DebtTransaction {
  fromUserId: string
  fromDisplayName: string
  toUserId: string
  toDisplayName: string
  toVenmoUsername: string | null
  amount: number
  betTitle: string
}

export interface BetSettlement {
  betId: string
  betTitle: string
  outcome: BetOutcome | null
  totalPool: number
  winningPool: number
  losingPool: number
  balances: PersonBalance[]
  transactions: DebtTransaction[]
}

// ============================================================
// Form input types
// ============================================================

export interface SignUpInput {
  email: string
  password: string
  displayName: string
  venmoUsername?: string
}

export interface SignInInput {
  email: string
  password: string
}

export interface UpdateProfileInput {
  displayName: string
  venmoUsername?: string
}

export interface CreateGroupInput {
  name: string
}

export interface CreateBetInput {
  groupId: string
  title: string
  description?: string
  resolutionDate: string // 'YYYY-MM-DD'
}

export interface PlaceBetInput {
  betId: string
  prediction: 'yes' | 'no'
  pledgeAmount: number
}

export interface CastVoteInput {
  betId: string
  vote: 'yes' | 'no'
}

// ============================================================
// Vote resolution result
// ============================================================

export interface VoteResult {
  shouldResolve: boolean
  outcome: 'yes' | 'no' | null
  cancelled: boolean
  yesVotes: number
  noVotes: number
  totalVotes: number
  totalParticipants: number
}
