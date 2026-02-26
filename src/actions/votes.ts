'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { checkVoteResolution } from '@/lib/resolution'
import type { CastVoteInput } from '@/types/app'

export async function castVote(input: CastVoteInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  // Insert vote
  const { error: voteError } = await supabase
    .from('resolution_votes')
    .insert({ bet_id: input.betId, user_id: user.id, vote: input.vote })

  if (voteError) {
    if (voteError.code === '23505') return { error: 'You have already voted' }
    return { error: voteError.message }
  }

  // Check if we should resolve
  const result = await resolveIfReady(input.betId)
  return result
}

export async function resolveIfReady(betId: string) {
  const supabase = await createClient()

  // Fetch bet + participations + votes
  const { data: bet } = await supabase
    .from('bets')
    .select('id, group_id, status, voting_opened_at')
    .eq('id', betId)
    .single()

  if (!bet || bet.status !== 'voting') return { success: true }

  const [{ data: participations }, { data: votes }] = await Promise.all([
    supabase.from('bet_participations').select('user_id').eq('bet_id', betId),
    supabase.from('resolution_votes').select('vote').eq('bet_id', betId),
  ])

  const totalParticipants = participations?.length ?? 0
  const allVotes = votes ?? []

  const result = checkVoteResolution(allVotes, totalParticipants, bet.voting_opened_at!)

  if (!result.shouldResolve) {
    revalidatePath(`/bets/${betId}`)
    return { success: true }
  }

  if (result.cancelled) {
    await supabase
      .from('bets')
      .update({ status: 'cancelled', outcome: null })
      .eq('id', betId)
      .eq('status', 'voting')
  } else {
    await supabase
      .from('bets')
      .update({ status: 'resolved', outcome: result.outcome })
      .eq('id', betId)
      .eq('status', 'voting')
  }

  revalidatePath(`/bets/${betId}`)
  revalidatePath(`/groups/${bet.group_id}`)
  revalidatePath('/dashboard')
  return { success: true }
}
