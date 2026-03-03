interface LeaderboardEntry {
  userId: string
  displayName: string
  netPnl: number
}

interface GroupLeaderboardProps {
  entries: LeaderboardEntry[]
  currentUserId: string
}

const MEDALS = ['🥇', '🥈', '🥉']

export function GroupLeaderboard({ entries, currentUserId }: GroupLeaderboardProps) {
  if (entries.length === 0) return null

  return (
    <div>
      <div className="flex items-baseline gap-2 mb-3">
        <h2 className="font-semibold">Leaderboard</h2>
        <span className="text-xs text-muted-foreground">(resolved bets only)</span>
      </div>
      <div className="space-y-1">
        {entries.map((entry, i) => (
          <div
            key={entry.userId}
            className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
              entry.userId === currentUserId
                ? 'bg-primary/10 font-semibold'
                : 'bg-secondary/40'
            }`}
          >
            <span className="flex items-center gap-2">
              <span className="w-6 text-center">{i < 3 ? MEDALS[i] : ''}</span>
              <span>{entry.displayName}</span>
              {entry.userId === currentUserId && (
                <span className="text-xs text-muted-foreground font-normal">(you)</span>
              )}
            </span>
            <span className={entry.netPnl >= 0 ? 'text-green-400' : 'text-red-400'}>
              {entry.netPnl >= 0 ? '+' : ''}${entry.netPnl.toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
