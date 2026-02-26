'use client'

import { useEffect, useState } from 'react'

interface CountdownTimerProps {
  resolutionDate: string // 'YYYY-MM-DD'
}

function getTimeRemaining(resolutionDate: string) {
  // Compare as date strings to avoid timezone issues
  const now = new Date()
  const target = new Date(resolutionDate + 'T00:00:00')
  const diff = target.getTime() - now.getTime()

  if (diff <= 0) return null

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  return { days, hours, minutes }
}

export function CountdownTimer({ resolutionDate }: CountdownTimerProps) {
  const [remaining, setRemaining] = useState(getTimeRemaining(resolutionDate))

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(getTimeRemaining(resolutionDate))
    }, 60000)
    return () => clearInterval(interval)
  }, [resolutionDate])

  if (!remaining) {
    return <span className="text-amber-400 text-sm font-medium">Resolution date passed</span>
  }

  const { days, hours, minutes } = remaining

  if (days > 0) {
    return (
      <span className="text-muted-foreground text-sm">
        {days}d {hours}h remaining
      </span>
    )
  }

  return (
    <span className="text-amber-400 text-sm font-medium">
      {hours}h {minutes}m remaining
    </span>
  )
}
