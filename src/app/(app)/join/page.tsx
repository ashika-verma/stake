'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

export default function JoinPage() {
  const router = useRouter()
  const [code, setCode] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = code.trim()
    if (trimmed) router.push(`/join/${trimmed.toLowerCase()}`)
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Join a group</CardTitle>
          <CardDescription>Enter the invite code shared by a friend.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Invite code</Label>
              <Input
                id="code"
                placeholder="e.g. ABC123"
                value={code}
                onChange={e => setCode(e.target.value)}
                autoFocus
              />
            </div>
            <Button type="submit" className="w-full" disabled={!code.trim()}>
              Continue
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
