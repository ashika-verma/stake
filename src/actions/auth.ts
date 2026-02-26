'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { SignInInput, SignUpInput, UpdateProfileInput } from '@/types/app'

export async function signUp(input: SignUpInput) {
  const supabase = await createClient()

  const { error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        display_name: input.displayName,
        venmo_username: input.venmoUsername ?? null,
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  // If email confirmation is disabled, user is logged in immediately
  // Update venmo_username in profile if provided (trigger only sets display_name)
  if (input.venmoUsername) {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase
        .from('profiles')
        .update({ venmo_username: input.venmoUsername })
        .eq('id', user.id)
    }
  }

  redirect('/dashboard')
}

export async function signIn(input: SignInInput) {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  })

  if (error) {
    return { error: error.message }
  }

  redirect('/dashboard')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function updateProfile(input: UpdateProfileInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('profiles')
    .update({
      display_name: input.displayName,
      venmo_username: input.venmoUsername ?? null,
    })
    .eq('id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  return { success: true }
}
