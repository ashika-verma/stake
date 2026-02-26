'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { CreateBetInput, PlaceBetInput } from '@/types/app'

export async function createBet(input: CreateBetInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const { data: bet, error } = await supabase
    .from('bets')
    .insert({
      group_id: input.groupId,
      title: input.title.trim(),
      description: input.description?.trim() ?? null,
      resolution_date: input.resolutionDate,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath(`/groups/${input.groupId}`)
  revalidatePath('/dashboard')
  redirect(`/bets/${bet.id}`)
}

export async function placeBet(input: PlaceBetInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  // Verify bet is still open
  const { data: bet } = await supabase
    .from('bets')
    .select('id, group_id, status')
    .eq('id', input.betId)
    .single()

  if (!bet) return { error: 'Bet not found' }
  if (bet.status !== 'open') return { error: 'This bet is no longer open' }

  const { error } = await supabase
    .from('bet_participations')
    .insert({
      bet_id: input.betId,
      user_id: user.id,
      prediction: input.prediction,
      pledge_amount: input.pledgeAmount,
    })

  if (error) {
    if (error.code === '23505') return { error: 'You have already placed a bet' }
    return { error: error.message }
  }

  revalidatePath(`/bets/${input.betId}`)
  revalidatePath(`/groups/${bet.group_id}`)
  revalidatePath('/dashboard')
  return { success: true }
}

export async function triggerVotingPeriod(betId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  // Atomically update only if status is still 'open'
  const today = new Date().toISOString().split('T')[0]

  const { data: bet, error } = await supabase
    .from('bets')
    .update({ status: 'voting', voting_opened_at: new Date().toISOString() })
    .eq('id', betId)
    .eq('status', 'open') // atomic guard against double-trigger
    .lte('resolution_date', today)
    .select()
    .single()

  if (error) return { error: error.message }
  if (!bet) return { error: 'Could not open voting period' }

  revalidatePath(`/bets/${betId}`)
  revalidatePath(`/groups/${bet.group_id}`)
  return { success: true }
}
