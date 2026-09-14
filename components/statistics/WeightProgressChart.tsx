import type { WeightPoint } from '@/lib/statistics/aggregate'
import { formatDayMonth } from '@/lib/date/date-utils'
import { EmptyState } from '@/components/common/EmptyState'
import { TrendingUp } from 'lucide-react'

interface WeightProgressChartProps {
  points: WeightPoint[]
  unit: string
}

const WIDTH = 560
const HEIGHT = 180
const PADDING = { top: 16, right: 16, bottom: 24, left: 36 }

export function WeightProgressChart({ points, unit }: WeightProgressChartProps) {
  if (points.length === 0) {
    return <EmptyState icon={TrendingUp} title="Sin datos de peso todavía" description="Registrá el peso de tus series para ver tu progreso acá." />
  }
  if (points.length === 1) {
    return (
      <p style={{ fontSize: 14, color: 'var(--foreground)' }}>
        Un solo registro por ahora: <strong>{points[0].maxWeight}{unit}</strong> el {formatDayMonth(points[0].date)}. Seguí registrando para ver tu curva de progreso.
      </p>
    )
  }

  const values = points.map((p) => p.maxWeight)
  const minValue = Math.min(...values)
  const maxValue = Math.max(...values)
  const range = maxValue - minValue || 1
  const plotWidth = WIDTH - PADDING.left - PADDING.right
  const plotHeight = HEIGHT - PADDING.top - PADDING.bottom

  const coords = points.map((p, i) => {
    const x = PADDING.left + (i / (points.length - 1)) * plotWidth
    const y = PADDING.top + plotHeight - ((p.maxWeight - minValue) / range) * plotHeight
    return { x, y, point: p }
  })

  const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' ')

  return (
    <div role="img" aria-label={`Evolución de peso máximo: de ${points[0].maxWeight}${unit} el ${formatDayMonth(points[0].date)} a ${points[points.length - 1].maxWeight}${unit} el ${formatDayMonth(points[points.length - 1].date)}`}>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} width="100%" height={HEIGHT} role="presentation">
        <line x1={PADDING.left} y1={PADDING.top} x2={PADDING.left} y2={HEIGHT - PADDING.bottom} stroke="var(--border)" strokeWidth={1} />
        <line x1={PADDING.left} y1={HEIGHT - PADDING.bottom} x2={WIDTH - PADDING.right} y2={HEIGHT - PADDING.bottom} stroke="var(--border)" strokeWidth={1} />

        <text x={PADDING.left - 6} y={PADDING.top + 4} textAnchor="end" fontSize={10} fill="var(--muted)">
          {maxValue}
        </text>
        <text x={PADDING.left - 6} y={HEIGHT - PADDING.bottom} textAnchor="end" fontSize={10} fill="var(--muted)">
          {minValue}
        </text>

        <path d={linePath} fill="none" stroke="var(--lime)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

        {coords.map((c, i) => (
          <g key={c.point.date}>
            <circle cx={c.x} cy={c.y} r={i === coords.length - 1 ? 5 : 3.5} fill="var(--lime)" stroke="var(--card)" strokeWidth={1.5}>
              <title>
                {formatDayMonth(c.point.date)}: {c.point.maxWeight}
                {unit}
              </title>
            </circle>
            {(i === 0 || i === coords.length - 1) && (
              <text x={c.x} y={c.y - 10} textAnchor="middle" fontSize={10} fontWeight={700} fill="var(--foreground)">
                {c.point.maxWeight}
                {unit}
              </text>
            )}
          </g>
        ))}

        <text x={PADDING.left} y={HEIGHT - 6} fontSize={9} fill="var(--muted)">
          {formatDayMonth(points[0].date)}
        </text>
        <text x={WIDTH - PADDING.right} y={HEIGHT - 6} textAnchor="end" fontSize={9} fill="var(--muted)">
          {formatDayMonth(points[points.length - 1].date)}
        </text>
      </svg>
    </div>
  )
}
