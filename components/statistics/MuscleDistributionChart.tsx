import type { MuscleDistributionEntry } from '@/lib/statistics/aggregate'
import type { MuscleGroup } from '@/types'
import { MUSCLE_LABELS } from '@/components/exercises/labels'
import { EmptyState } from '@/components/common/EmptyState'
import { BarChart3 } from 'lucide-react'

/** Ranked bar chart: category identity comes from the row label, so a single
 * brand hue encodes magnitude — no categorical palette needed here. */
export function MuscleDistributionChart({ distribution }: { distribution: MuscleDistributionEntry[] }) {
  if (distribution.length === 0) return <EmptyState icon={BarChart3} title="Sin series registradas todavía" description="Completá series de entrenamiento para ver tu distribución muscular." />

  const max = Math.max(...distribution.map((d) => d.sets))

  return (
    <ul style={{ display: 'grid', gap: 10, listStyle: 'none', margin: 0, padding: 0 }} aria-label="Series completadas por grupo muscular">
      {distribution.map((d) => (
        <li key={d.muscleGroup}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
            <span style={{ color: 'var(--foreground)' }}>{MUSCLE_LABELS[d.muscleGroup as MuscleGroup] ?? d.muscleGroup}</span>
            <span style={{ color: 'var(--muted)' }}>{d.sets} series</span>
          </div>
          <div style={{ height: 8, borderRadius: 4, background: 'var(--line)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(d.sets / max) * 100}%`, background: 'var(--orange)', borderRadius: 4 }} />
          </div>
        </li>
      ))}
    </ul>
  )
}
