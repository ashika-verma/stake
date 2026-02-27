'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { buildVenmoLink, buildVenmoWebLink } from '@/lib/venmo'

interface VenmoButtonProps {
  username: string
  amount: number
  note: string
}

export function VenmoButton({ username, amount, note }: VenmoButtonProps) {
  const [isMobile] = useState(() =>
    typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
  )

  const deepLink = buildVenmoLink({ username, amount, note })
  const webLink = buildVenmoWebLink({ username, amount, note })

  return (
    <div className="flex gap-2 flex-wrap">
      {isMobile && (
        <a href={deepLink}>
          <Button size="sm" className="bg-[#3D95CE] hover:bg-[#2e7db5] text-white">
            Pay with Venmo
          </Button>
        </a>
      )}
      <a href={webLink} target="_blank" rel="noopener noreferrer">
        <Button size="sm" variant="outline">
          {isMobile ? 'Open on web' : 'Pay via Venmo'}
        </Button>
      </a>
    </div>
  )
}
