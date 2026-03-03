import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfileForm } from '@/components/profile/ProfileForm'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { signOut } from '@/actions/auth'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, venmo_username')
    .eq('id', user.id)
    .single()

  if (!profile) notFound()

  return (
    <main className="max-w-2xl mx-auto p-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{profile.display_name}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{user.email}</p>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Venmo</span>
        {profile.venmo_username ? (
          <Badge variant="secondary" className="text-green-400 bg-green-500/10 border-green-500/20">
            @{profile.venmo_username} connected
          </Badge>
        ) : (
          <Badge variant="secondary" className="text-amber-400 bg-amber-500/10 border-amber-500/20">
            Not set — required for betting
          </Badge>
        )}
      </div>

      <ProfileForm
        displayName={profile.display_name}
        venmoUsername={profile.venmo_username}
      />

      <div className="pt-4 border-t">
        <form action={signOut}>
          <Button type="submit" variant="outline" className="w-full">Sign out</Button>
        </form>
      </div>
    </main>
  )
}
