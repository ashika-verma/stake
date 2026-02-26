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
      .single()
    return !!data
  })

  const { data: group, error: groupError } = await supabase
    .from('groups')
    .insert({ name: name.trim(), invite_code: inviteCode, created_by: user.id })
    .select()
    .single()

  if (groupError) return { error: groupError.message }

  // Auto-add creator as member
  const { error: memberError } = await supabase
    .from('group_members')
    .insert({ group_id: group.id, user_id: user.id })

  if (memberError) return { error: memberError.message }

  revalidatePath('/dashboard')
  redirect(`/groups/${group.id}`)
}

export async function joinGroup(inviteCode: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const { data: group, error: groupError } = await supabase
    .from('groups')
    .select('id, name')
    .eq('invite_code', inviteCode.toUpperCase().trim())
    .single()

  if (groupError || !group) return { error: 'Invalid invite code' }

  // Check if already a member
  const { data: existing } = await supabase
    .from('group_members')
    .select('id')
    .eq('group_id', group.id)
    .eq('user_id', user.id)
    .single()

  if (existing) {
    redirect(`/groups/${group.id}`)
  }

  const { error: memberError } = await supabase
    .from('group_members')
    .insert({ group_id: group.id, user_id: user.id })

  if (memberError) return { error: memberError.message }

  revalidatePath('/dashboard')
  revalidatePath(`/groups/${group.id}`)
  redirect(`/groups/${group.id}`)
}
