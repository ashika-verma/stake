'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { CreateBetInput, PlaceBetInput } from '@/types/app'

export async function createBet(input: CreateBetInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const { data: bet, error } = await supabase.rpc('create_bet', {
    p_group_id: input.groupId,
    p_title: input.title.trim(),
    p_description: input.description?.trim() ?? null,
    p_resolution_date: input.resolutionDate,
  })

  if (error) return { error: error.message }

  revalidatePath(`/groups/${input.groupId}`)
  revalidatePath('/dashboard')
  redirect(`/bets/${bet.id}`)
}

export async function placeBet(input: PlaceBetInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  // Require Venmo username before betting
  const { data: profile } = await supabase
    .from('profiles')
    .select('venmo_username')
    .eq('id', user.id)
    .single()

  if (!profile?.venmo_username) {
    return { error: 'Add your Venmo username in your profile before placing a bet' }
  }

  // Get group_id for revalidation
  const { data: bet } = await supabase
    .from('bets')
    .select('group_id')
    .eq('id', input.betId)
    .single()

  const { error } = await supabase.rpc('place_bet', {
    p_bet_id: input.betId,
    p_prediction: input.prediction,
    p_pledge_amount: input.pledgeAmount,
  })

  if (error) {
    if (error.message.includes('bet_participations_bet_id_user_id_prediction_key') || error.message.includes('already'))
      return { error: "You've already placed a bet on this side." }
    if (error.message.includes('not open')) return { error: 'This bet is no longer open.' }
    return { error: 'Something went wrong. Please try again.' }
  }

  revalidatePath(`/bets/${input.betId}`)
  if (bet?.group_id) revalidatePath(`/groups/${bet.group_id}`)
  revalidatePath('/dashboard')
  return { success: true }
}

export async function creatorResolveBet(betId: string, outcome: 'yes' | 'no') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const { data: bet } = await supabase
    .from('bets')
    .select('created_by, group_id')
    .eq('id', betId)
    .single()

  if (!bet) return { error: 'Bet not found' }
  if (bet.created_by !== user.id) return { error: 'Only the bet creator can resolve this bet' }

  const { error } = await supabase
    .from('bets')
    .update({
      outcome,
      status: 'resolved',
      creator_resolved_at: new Date().toISOString(),
      creator_resolved_outcome: outcome,
    })
    .eq('id', betId)
    .eq('status', 'voting')

  if (error) return { error: error.message }

  revalidatePath(`/bets/${betId}`)
  if (bet.group_id) revalidatePath(`/groups/${bet.group_id}`)
  revalidatePath('/dashboard')
  return { success: true }
}

export async function cancelBet(betId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const { data: bet } = await supabase
    .from('bets')
    .select('group_id')
    .eq('id', betId)
    .single()

  const { error } = await supabase.rpc('cancel_bet', { p_bet_id: betId })

  if (error) return { error: error.message }

  revalidatePath(`/bets/${betId}`)
  if (bet?.group_id) revalidatePath(`/groups/${bet.group_id}`)
  revalidatePath('/dashboard')
  return {}
}

export async function triggerVotingPeriod(betId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const { data: bet } = await supabase
    .from('bets')
    .select('group_id')
    .eq('id', betId)
    .single()

  const { error } = await supabase.rpc('open_voting', { p_bet_id: betId })

  if (error) return { error: error.message }

  revalidatePath(`/bets/${betId}`)
  if (bet?.group_id) revalidatePath(`/groups/${bet.group_id}`)
  return { success: true }
}
