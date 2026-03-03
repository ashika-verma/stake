'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { generateUniqueInviteCode } from '@/lib/invite'

export async function createGroup(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const name = formData.get('name') as string
  if (!name?.trim()) return { error: 'Group name is required' }

  // Generate a unique invite code with retry loop
  const inviteCode = await generateUniqueInviteCode(async (code) => {
    const { data } = await supabase
      .from('groups')
      .select('id')
      .eq('invite_code', code)
      .maybeSingle()
    return !!data
  })

  // Use security definer RPC to bypass RLS evaluation timing issue
  const { data: group, error } = await supabase
    .rpc('create_group', { p_name: name.trim(), p_invite_code: inviteCode })

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  redirect(`/groups/${group.id}`)
}

export async function joinGroup(inviteCode: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const { data: group, error } = await supabase
    .rpc('join_group', { p_invite_code: inviteCode })

  if (error) {
    if (error.message.includes('Invalid invite code')) return { error: 'Invalid invite code' }
    if (error.message.includes('group_members_group_id_user_id_key') || error.message.includes('already a member')) return { error: "You're already in this group." }
    return { error: 'Something went wrong. Please try again.' }
  }

  revalidatePath('/dashboard')
  revalidatePath(`/groups/${group.id}`)
  redirect(`/groups/${group.id}`)
}
