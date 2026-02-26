import { Badge } from '@/components/ui/badge'
import type { BetStatus } from '@/types/database'

const statusConfig: Record<BetStatus, { label: string; className: string }> = {
  open: { label: 'Open', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  voting: { label: 'Voting', className: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  resolved: { label: 'Resolved', className: 'bg-green-500/20 text-green-400 border-green-500/30' },
  cancelled: { label: 'Cancelled', className: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30' },
}

export function BetStatusBadge({ status }: { status: BetStatus }) {
  const config = statusConfig[status]
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  )
}
