'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function JoinByCodeForm() {
  const router = useRouter()
  const [code, setCode] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) return
    router.push(`/join/${trimmed}`)
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 justify-center">
      <Input
        placeholder="Invite code"
        value={code}
        onChange={e => setCode(e.target.value)}
        className="max-w-[160px] font-mono text-center uppercase"
        maxLength={10}
      />
      <Button type="submit" variant="outline" disabled={!code.trim()}>
        Join
      </Button>
    </form>
  )
}
