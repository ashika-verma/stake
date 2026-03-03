'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function markAsPaid(betId: string, toUserId: string, amount: number): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('settlement_payments')
    .insert({
      bet_id: betId,
      from_user_id: user.id,
      to_user_id: toUserId,
      amount,
    })

  if (error) {
    if (error.message.includes('settlement_payments_bet_id_from_user_id_to_user_id_key'))
      return { error: 'Already marked as paid.' }
    return { error: 'Something went wrong. Please try again.' }
  }

  revalidatePath(`/bets/${betId}`)
  return {}
}

export async function unmarkAsPaid(betId: string, toUserId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('settlement_payments')
    .delete()
    .eq('bet_id', betId)
    .eq('from_user_id', user.id)
    .eq('to_user_id', toUserId)

  if (error) return { error: 'Something went wrong. Please try again.' }

  revalidatePath(`/bets/${betId}`)
  return {}
}
