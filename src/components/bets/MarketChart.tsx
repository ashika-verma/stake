'use client'

import type { Prediction } from '@/types/database'

interface DataPoint {
  time: number // unix ms
  yesPool: number
  noPool: number
}

interface MarketChartProps {
  participations: Array<{
    prediction: Prediction
    pledge_amount: number
    created_at: string
  }>
}

function buildSeries(
  participations: MarketChartProps['participations']
): DataPoint[] {
  const sorted = [...participations].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )

  const points: DataPoint[] = [{ time: sorted[0] ? new Date(sorted[0].created_at).getTime() - 1000 : Date.now(), yesPool: 0, noPool: 0 }]
  let yes = 0, no = 0

  for (const p of sorted) {
    if (p.prediction === 'yes') yes += Number(p.pledge_amount)
    else no += Number(p.pledge_amount)
    points.push({ time: new Date(p.created_at).getTime(), yesPool: yes, noPool: no })
  }

  return points
}

const W = 600
const H = 180
const PAD = { top: 12, right: 12, bottom: 28, left: 44 }

export function MarketChart({ participations }: MarketChartProps) {
  if (participations.length === 0) return null

  const series = buildSeries(participations)
  const maxPool = Math.max(...series.map(p => Math.max(p.yesPool, p.noPool)), 1)
  const minTime = series[0].time
  const maxTime = series[series.length - 1].time
  const timeRange = maxTime - minTime || 1

  const chartW = W - PAD.left - PAD.right
  const chartH = H - PAD.top - PAD.bottom

  const xScale = (t: number) => ((t - minTime) / timeRange) * chartW
  const yScale = (v: number) => chartH - (v / maxPool) * chartH

  // Build step-line paths (each bet causes an instant jump)
  function stepPath(getValue: (p: DataPoint) => number) {
    const pts = series.map((p, i) => ({ x: xScale(p.time), y: yScale(getValue(p)), i }))
    return pts.reduce((acc, pt, i) => {
      if (i === 0) return `M ${pt.x} ${pt.y}`
      const prev = pts[i - 1]
      return `${acc} H ${pt.x} V ${pt.y}` // horizontal then vertical = step
    }, '')
  }

  function fillPath(getValue: (p: DataPoint) => number) {
    const line = stepPath(getValue)
    const lastX = xScale(series[series.length - 1].time)
    return `${line} H ${lastX} V ${chartH} H 0 Z`
  }

  // Y-axis ticks
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(t => ({
    y: yScale(maxPool * t),
    label: `$${(maxPool * t).toFixed(0)}`,
  }))

  // X-axis: show up to 3 time labels
  const xTicks = series.length > 1
    ? [series[0], series[Math.floor(series.length / 2)], series[series.length - 1]]
    : [series[0]]

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Pool over time</p>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ height: H }}
        aria-label="Market chart"
      >
        <g transform={`translate(${PAD.left},${PAD.top})`}>
          {/* Grid lines */}
          {ticks.map(t => (
            <line
              key={t.label}
              x1={0} y1={t.y} x2={chartW} y2={t.y}
              stroke="currentColor"
              strokeOpacity={0.08}
              strokeWidth={1}
              className="text-foreground"
            />
          ))}

          {/* Yes fill */}
          <path
            d={fillPath(p => p.yesPool)}
            fill="#22c55e"
            fillOpacity={0.15}
          />
          {/* No fill */}
          <path
            d={fillPath(p => p.noPool)}
            fill="#ef4444"
            fillOpacity={0.15}
          />

          {/* Yes line */}
          <path
            d={stepPath(p => p.yesPool)}
            fill="none"
            stroke="#22c55e"
            strokeWidth={2}
            strokeLinejoin="round"
          />
          {/* No line */}
          <path
            d={stepPath(p => p.noPool)}
            fill="none"
            stroke="#ef4444"
            strokeWidth={2}
            strokeLinejoin="round"
          />

          {/* Y-axis labels */}
          {ticks.map(t => (
            <text
              key={t.label}
              x={-6}
              y={t.y + 4}
              textAnchor="end"
              fontSize={10}
              fill="currentColor"
              fillOpacity={0.4}
              className="text-foreground"
            >
              {t.label}
            </text>
          ))}

          {/* X-axis labels */}
          {xTicks.map((p, i) => {
            const date = new Date(p.time)
            const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            const x = xScale(p.time)
            const anchor = i === 0 ? 'start' : i === xTicks.length - 1 ? 'end' : 'middle'
            return (
              <text
                key={i}
                x={x}
                y={chartH + 18}
                textAnchor={anchor}
                fontSize={10}
                fill="currentColor"
                fillOpacity={0.4}
                className="text-foreground"
              >
                {label}
              </text>
            )
          })}

          {/* Legend */}
          <g transform={`translate(${chartW - 80}, 0)`}>
            <line x1={0} y1={6} x2={14} y2={6} stroke="#22c55e" strokeWidth={2} />
            <text x={18} y={10} fontSize={10} fill="#22c55e">Yes</text>
            <line x1={0} y1={20} x2={14} y2={20} stroke="#ef4444" strokeWidth={2} />
            <text x={18} y={24} fontSize={10} fill="#ef4444">No</text>
          </g>
        </g>
      </svg>
    </div>
  )
}
