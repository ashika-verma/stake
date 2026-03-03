export type BetStatus = 'open' | 'voting' | 'resolved' | 'cancelled'
export type BetOutcome = 'yes' | 'no'
export type Prediction = 'yes' | 'no'
export type VoteValue = 'yes' | 'no'

export interface Profile {
  id: string
  display_name: string
  venmo_username: string | null
  created_at: string
  updated_at: string
}

export interface Group {
  id: string
  name: string
  invite_code: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface GroupMember {
  id: string
  group_id: string
  user_id: string
  joined_at: string
}

export interface Bet {
  id: string
  group_id: string
  title: string
  description: string | null
  resolution_date: string // 'YYYY-MM-DD'
  status: BetStatus
  outcome: BetOutcome | null
  voting_opened_at: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export interface BetParticipation {
  id: string
  bet_id: string
  user_id: string
  prediction: Prediction
  pledge_amount: number
  created_at: string
}

export interface ResolutionVote {
  id: string
  bet_id: string
  user_id: string
  vote: VoteValue
  created_at: string
}

export interface SettlementPayment {
  id: string
  bet_id: string
  from_user_id: string
  to_user_id: string
  amount: number
  marked_at: string
}
