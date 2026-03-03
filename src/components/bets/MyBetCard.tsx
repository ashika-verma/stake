'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BetStatusBadge } from './BetStatusBadge'
import type { BetOutcome, BetStatus, Prediction } from '@/types/database'

interface IndividualBet {
  amount: number
  placedAt: string // ISO string
}

interface PositionSide {
  total: number
  bets: IndividualBet[]
}

export interface MyBetCardData {
  betId: string
  betTitle: string
  betStatus: BetStatus
  betOutcome: BetOutcome | null
  resolutionDate: string
  groupName: string | null
  positions: {
    yes?: PositionSide
    no?: PositionSide
  }
  netPnl?: number
}

function SideDetails({ side, outcome, position }: {
  side: Prediction
  outcome: BetOutcome | null
  position: PositionSide
}) {
  const isResolved = outcome !== null
  const won = isResolved && outcome === side
  const lost = isResolved && outcome !== side

  return (
    <div className={`rounded-lg p-3 space-y-2 ${
      side === 'yes' ? 'bg-green-500/10' : 'bg-red-500/10'
    }`}>
      <div className="flex items-center justify-between">
        <span className={`text-sm font-semibold ${side === 'yes' ? 'text-green-400' : 'text-red-400'}`}>
          {side === 'yes' ? '✓ Yes' : '✗ No'} — ${position.total.toFixed(2)}
        </span>
        {won && <span className="text-xs font-medium text-green-400">Won</span>}
        {lost && <span className="text-xs font-medium text-red-400">Lost</span>}
      </div>

      {position.bets.length > 1 && (
        <div className="space-y-1 border-t border-white/10 pt-2">
          {position.bets.map((b, i) => (
            <div key={i} className="flex justify-between text-xs text-muted-foreground">
              <span>${b.amount.toFixed(2)}</span>
              <span>{new Date(b.placedAt).toLocaleString('en-US', {
                month: 'short', day: 'numeric',
                hour: 'numeric', minute: '2-digit',
              })}</span>
            </div>
          ))}
        </div>
      )}

      {position.bets.length === 1 && (
        <p className="text-xs text-muted-foreground">
          {new Date(position.bets[0].placedAt).toLocaleString('en-US', {
            month: 'short', day: 'numeric',
            hour: 'numeric', minute: '2-digit',
          })}
        </p>
      )}
    </div>
  )
}

export function MyBetCard({ data }: { data: MyBetCardData }) {
  const [expanded, setExpanded] = useState(false)

  const { positions, betOutcome } = data
  const sides = (['yes', 'no'] as Prediction[]).filter(s => positions[s])
  const resolutionDate = new Date(data.resolutionDate + 'T00:00:00')

  return (
    <Card
      className="cursor-pointer hover:bg-accent/40 transition-colors"
      onClick={() => setExpanded(e => !e)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-snug">{data.betTitle}</CardTitle>
          <div className="flex items-center gap-2 shrink-0">
            {data.betStatus === 'resolved' && data.netPnl !== undefined && (
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                data.netPnl >= 0
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-red-500/20 text-red-400'
              }`}>
                {data.netPnl >= 0
                  ? <>{`+$${data.netPnl.toFixed(2)}`} <span className="font-normal opacity-70">profit</span></>
                  : <>{`-$${Math.abs(data.netPnl).toFixed(2)}`} <span className="font-normal opacity-70">owed</span></>
                }
              </span>
            )}
            <BetStatusBadge status={data.betStatus} />
          </div>
        </div>
        {data.groupName && (
          <p className="text-xs text-muted-foreground">{data.groupName}</p>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Rolled-up position pills — always visible */}
        <div className="flex flex-wrap gap-2">
          {positions.yes && (
            <span className={`rounded-full px-3 py-1 text-sm font-medium ${
              betOutcome === 'yes' ? 'bg-green-500/30 text-green-300' :
              betOutcome === 'no'  ? 'bg-green-500/10 text-green-600 line-through' :
              'bg-green-500/15 text-green-400'
            }`}>
              ${positions.yes.total.toFixed(2)} on Yes
              {positions.yes.bets.length > 1 && (
                <span className="ml-1 opacity-60">×{positions.yes.bets.length}</span>
              )}
            </span>
          )}
          {positions.no && (
            <span className={`rounded-full px-3 py-1 text-sm font-medium ${
              betOutcome === 'no'  ? 'bg-red-500/30 text-red-300' :
              betOutcome === 'yes' ? 'bg-red-500/10 text-red-600 line-through' :
              'bg-red-500/15 text-red-400'
            }`}>
              ${positions.no.total.toFixed(2)} on No
              {positions.no.bets.length > 1 && (
                <span className="ml-1 opacity-60">×{positions.no.bets.length}</span>
              )}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {resolutionDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          <span>{expanded ? '▲ Hide details' : '▼ Show details'}</span>
        </div>

        {/* Expanded detail view */}
        {expanded && (
          <div className="space-y-2 pt-1" onClick={e => e.stopPropagation()}>
            {sides.map(side => (
              <SideDetails
                key={side}
                side={side}
                outcome={betOutcome}
                position={positions[side]!}
              />
            ))}
            <Link
              href={`/bets/${data.betId}`}
              className="block text-center text-xs text-muted-foreground hover:text-foreground underline underline-offset-4 pt-1"
              onClick={e => e.stopPropagation()}
            >
              View full bet →
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
