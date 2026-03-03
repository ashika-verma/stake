import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/Header'
import { MobileNav } from '@/components/layout/MobileNav'

const BUG_REPORT_URL = 'https://github.com/ashika-verma/stake/issues/new?labels=bug&template=&title=Bug%3A+&body=%23%23+What+happened%0A%0A%23%23+Steps+to+reproduce%0A1.+%0A2.+%0A%0A%23%23+Expected+behavior%0A%0A%23%23+Actual+behavior%0A'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch profile (may be null briefly after signup if trigger hasn't fired)
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .single()

  return (
    <div className="flex flex-col h-[100dvh]">
      <Header displayName={profile?.display_name} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
      <MobileNav />
      <div className="hidden md:block border-t py-2 text-center">
        <Link
          href={BUG_REPORT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Report a bug
        </Link>
      </div>
    </div>
  )
}
