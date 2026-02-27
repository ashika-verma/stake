'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface InviteCodeDisplayProps {
  inviteCode: string
}

export function InviteCodeDisplay({ inviteCode }: InviteCodeDisplayProps) {
  const [copied, setCopied] = useState(false)

  const joinUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/join/${inviteCode}`
    : `/join/${inviteCode}`

  async function handleCopy() {
    await navigator.clipboard.writeText(joinUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-2">
      <Label>Invite link</Label>
      <div className="flex gap-2">
        <Input value={joinUrl} readOnly className="font-mono text-sm" />
        <Button variant="outline" onClick={handleCopy} className="shrink-0">
          {copied ? 'Copied!' : 'Copy'}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Code: <span className="font-mono font-semibold tracking-widest">{inviteCode}</span>
      </p>
    </div>
  )
}
