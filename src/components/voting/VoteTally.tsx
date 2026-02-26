interface VoteTallyProps {
  yesVotes: number
  noVotes: number
  totalParticipants: number
}

export function VoteTally({ yesVotes, noVotes, totalParticipants }: VoteTallyProps) {
  const totalVotes = yesVotes + noVotes
  const yesWidth = totalVotes > 0 ? (yesVotes / totalVotes) * 100 : 50
  const noWidth = 100 - yesWidth

  return (
    <div className="space-y-3">
      <div className="flex justify-between text-sm font-medium">
        <span className="text-green-400">Yes: {yesVotes}</span>
        <span className="text-muted-foreground">{totalVotes}/{totalParticipants} voted</span>
        <span className="text-red-400">No: {noVotes}</span>
      </div>
      <div className="flex h-3 rounded-full overflow-hidden bg-secondary">
        {yesVotes > 0 && (
          <div
            className="bg-green-500 transition-all duration-500"
            style={{ width: `${yesWidth}%` }}
          />
        )}
        {noVotes > 0 && (
          <div
            className="bg-red-500 transition-all duration-500"
            style={{ width: `${noWidth}%` }}
          />
        )}
      </div>
    </div>
  )
}
