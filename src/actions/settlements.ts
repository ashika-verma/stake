'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function markDebtPaid(betId: string, toUserId: string, amount: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('debt_payments')
    .insert({
      bet_id: betId,
      from_user_id: user.id,
      to_user_id: toUserId,
      amount,
    })

  if (error) {
    // Unique violation = already marked paid
    if (error.code === '23505') return { error: 'Already marked as paid' }
    return { error: error.message }
  }

  revalidatePath(`/bets/${betId}`)
  return { success: true }
}
