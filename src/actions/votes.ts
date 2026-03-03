'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { checkVoteResolution } from '@/lib/resolution'
import type { CastVoteInput } from '@/types/app'

export async function castVote(input: CastVoteInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const { error: voteError } = await supabase.rpc('cast_vote', {
    p_bet_id: input.betId,
    p_vote: input.vote,
  })

  if (voteError) {
    if (voteError.message.includes('resolution_votes_bet_id_user_id_key') || voteError.message.includes('already'))
      return { error: "You've already voted on this bet." }
    return { error: 'Something went wrong. Please try again.' }
  }

  // Check if bet should resolve
  return resolveIfReady(input.betId)
}

export async function resolveIfReady(betId: string) {
  const supabase = await createClient()

  const { data: bet } = await supabase
    .from('bets')
    .select('id, group_id, status, voting_opened_at')
    .eq('id', betId)
    .single()

  if (!bet || bet.status !== 'voting') {
    revalidatePath(`/bets/${betId}`)
    return { success: true }
  }

  const [{ data: participations }, { data: votes }] = await Promise.all([
    supabase.from('bet_participations').select('user_id').eq('bet_id', betId),
    supabase.from('resolution_votes').select('vote').eq('bet_id', betId),
  ])

  const uniqueParticipants = new Set((participations ?? []).map(p => p.user_id)).size
  const result = checkVoteResolution(
    votes ?? [],
    uniqueParticipants,
    bet.voting_opened_at!
  )

  if (!result.shouldResolve) {
    revalidatePath(`/bets/${betId}`)
    return { success: true }
  }

  await supabase.rpc('resolve_bet', {
    p_bet_id: betId,
    p_outcome: result.outcome ?? null,
    p_cancelled: result.cancelled,
  })

  revalidatePath(`/bets/${betId}`)
  revalidatePath(`/groups/${bet.group_id}`)
  revalidatePath('/dashboard')
  return { success: true }
}
