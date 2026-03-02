import type { ParticipationWithProfile } from '@/types/app'

interface BetParticipantsProps {
  participations: ParticipationWithProfile[]
  currentUserId: string
  showAmounts: boolean
}

export function BetParticipants({ participations, currentUserId, showAmounts }: BetParticipantsProps) {
  const yes = participations.filter(p => p.prediction === 'yes')
  const no = participations.filter(p => p.prediction === 'no')

  if (participations.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-4">No one has placed a bet yet.</p>
  }

  const renderGroup = (group: ParticipationWithProfile[], label: string, colorClass: string) => (
    <div>
      <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${colorClass}`}>{label}</p>
      <div className="space-y-1">
        {group.map(p => (
          <div key={p.id} className="flex justify-between items-center text-sm py-1">
            <span>
              {p.profile.display_name}
              {p.user_id === currentUserId && (
                <span className="text-muted-foreground text-xs ml-1">(you)</span>
              )}
            </span>
            {showAmounts && (
              <span className="font-medium">${Number(p.pledge_amount).toFixed(2)}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      {yes.length > 0 && renderGroup(yes, 'Yes', 'text-green-400')}
      {no.length > 0 && renderGroup(no, 'No', 'text-red-400')}
    </div>
  )
}
