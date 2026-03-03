import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ProfileForm } from '@/components/profile/ProfileForm'
import { Badge } from '@/components/ui/badge'

const BUG_REPORT_URL = 'https://github.com/ashika-verma/stake/issues/new?labels=bug&template=&title=Bug%3A+&body=%23%23+What+happened%0A%0A%23%23+Steps+to+reproduce%0A1.+%0A2.+%0A%0A%23%23+Expected+behavior%0A%0A%23%23+Actual+behavior%0A'

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
        <Link
          href={BUG_REPORT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Report a bug
        </Link>
      </div>
    </main>
  )
}
