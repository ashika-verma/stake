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

  // Require Venmo username before joining a group
  const { data: profile } = await supabase
    .from('profiles')
    .select('venmo_username')
    .eq('id', user.id)
    .single()

  if (!profile?.venmo_username) {
    return { error: 'Add your Venmo username in your profile before joining a group' }
  }

  const { data: group, error } = await supabase
    .rpc('join_group', { p_invite_code: inviteCode })

  if (error) {
    if (error.message.includes('Invalid invite code')) return { error: 'Invalid invite code' }
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  revalidatePath(`/groups/${group.id}`)
  redirect(`/groups/${group.id}`)
}
