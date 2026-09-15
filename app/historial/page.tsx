'use client'

import { useMemo, useState } from 'react'
import { History as HistoryIcon, Trophy } from 'lucide-react'
import { useStorageReady } from '@/hooks/useStorageReady'
import { useStatistics } from '@/hooks/useStatistics'
import { useActiveProfile } from '@/lib/profile/ProfileContext'
import { Tabs, TabsList, TabsPanel, TabsTab } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EmptyState } from '@/components/common/EmptyState'
import { MuscleDistributionChart } from '@/components/statistics/MuscleDistributionChart'
import { formatLongDate, sessionTypeLabel } from '@/lib/date/date-utils'
import type { SessionType } from '@/types'

export default function HistorialPage() {
  const { ready } = useStorageReady()
  const { profile } = useActiveProfile()
  const stats = useStatistics(profile, ready)
  const [tab, setTab] = useState('fecha')

  return (
    <>
      <header className="topbar">
        <div>
          <p className="eyebrow">TU PROGRESO</p>
          <h1>
            <em>Historial.</em>
          </h1>
        </div>
      </header>

      <Tabs value={tab} onValueChange={(v) => setTab(v as string)} className="mt-6">
        <TabsList>
          <TabsTab value="fecha">Por fecha</TabsTab>
          <TabsTab value="ejercicio">Por ejercicio</TabsTab>
          <TabsTab value="grupo">Por grupo muscular</TabsTab>
        </TabsList>

        <TabsPanel value="fecha" className="mt-6">
          <ByDateHistory stats={stats} />
        </TabsPanel>
        <TabsPanel value="ejercicio" className="mt-6">
          <ByExerciseHistory stats={stats} />
        </TabsPanel>
        <TabsPanel value="grupo" className="mt-6">
          <ByMuscleHistory stats={stats} />
        </TabsPanel>
      </Tabs>
    </>
  )
}

type Stats = ReturnType<typeof useStatistics>

function ByDateHistory({ stats }: { stats: Stats }) {
  const rows = useMemo(() => {
    const completedByDate = new Map<string, { date: string; type: SessionType; sets: number; volume: number }>()
    for (const session of stats.sessions) {
      if (session.type === 'descanso') continue
      const sets = stats.sets.filter((s) => s.sessionId === session.id && s.completed)
      if (sets.length === 0) continue
      const volume = sets.reduce((sum, s) => sum + (s.weight ?? 0) * (s.actualReps ?? 0), 0)
      completedByDate.set(session.id, { date: session.date, type: session.type, sets: sets.length, volume })
    }
    return [...completedByDate.values()].sort((a, b) => b.date.localeCompare(a.date))
  }, [stats])

  if (rows.length === 0) return <EmptyState icon={HistoryIcon} title="Todavía no hay entrenamientos registrados" description="Cuando completes series, tu historial va a aparecer acá." />

  return (
    <ul style={{ display: 'grid', gap: 8, maxWidth: 640, listStyle: 'none', margin: 0, padding: 0 }}>
      {rows.map((row) => (
        <li key={row.date + row.type} className="exercise-card" style={{ height: 'auto', padding: '14px 16px' }}>
          <div className="exercise-copy">
            <span style={{ fontSize: 10, letterSpacing: '.08em', color: 'var(--muted)' }}>{sessionTypeLabel(row.type).toUpperCase()}</span>
            <h3 style={{ textTransform: 'capitalize' }}>{formatLongDate(row.date)}</h3>
            <p>
              {row.sets} series completadas{row.volume > 0 ? ` · ${Math.round(row.volume)} kg de volumen` : ''}
            </p>
          </div>
        </li>
      ))}
    </ul>
  )
}

function ByExerciseHistory({ stats }: { stats: Stats }) {
  const exerciseList = Object.values(stats.exercises).sort((a, b) => a.name.localeCompare(b.name))
  const [exerciseId, setExerciseId] = useState<string>(exerciseList[0]?.id ?? '')
  const exercise = stats.exercises[exerciseId]

  const sessionDateById = Object.fromEntries(stats.sessions.map((s) => [s.id, s.date]))
  const rows = useMemo(() => {
    return stats.sets
      .filter((s) => s.exerciseId === exerciseId && s.completed)
      .map((s) => ({ ...s, date: sessionDateById[s.sessionId] }))
      .filter((s) => s.date)
      .sort((a, b) => b.date.localeCompare(a.date))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats.sets, exerciseId])

  const records = stats.records.filter((r) => r.exerciseId === exerciseId)

  if (exerciseList.length === 0) return <EmptyState icon={HistoryIcon} title="Sin ejercicios todavía" />

  return (
    <div style={{ maxWidth: 640 }}>
      <Select items={Object.fromEntries(exerciseList.map((e) => [e.id, e.name]))} value={exerciseId} onValueChange={(v) => v && setExerciseId(v)}>
        <SelectTrigger className="w-full sm:w-72">
          <SelectValue placeholder="Elegí un ejercicio" />
        </SelectTrigger>
        <SelectContent>
          {exerciseList.map((e) => (
            <SelectItem key={e.id} value={e.id}>
              {e.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {records.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
          {records.map((r) => (
            <span key={r.id} style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 11, fontWeight: 700, background: 'var(--muted-surface, var(--line))', borderRadius: 999, padding: '5px 10px', color: 'var(--foreground)' }}>
              <Trophy size={13} style={{ color: 'var(--orange)' }} /> {r.type === 'max-weight' ? `PR peso: ${r.value}${r.unit ?? ''}` : r.type === 'max-reps' ? `PR reps: ${r.value}` : r.type === 'max-volume' ? `PR volumen: ${Math.round(r.value)}` : `Mejor tiempo: ${r.value}s`}
            </span>
          ))}
        </div>
      )}

      <ul style={{ display: 'grid', gap: 6, marginTop: 16, listStyle: 'none', padding: 0 }}>
        {rows.length === 0 && <p style={{ color: 'var(--muted)', fontSize: 13 }}>Sin series completadas todavía para {exercise?.name}.</p>}
        {rows.map((row, i) => {
          const previous = rows[i + 1]
          const delta = previous && row.weight != null && previous.weight != null ? row.weight - previous.weight : null
          return (
            <li key={row.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, borderBottom: '1px solid var(--border)', padding: '8px 2px' }}>
              <span style={{ textTransform: 'capitalize', color: 'var(--muted)' }}>{formatLongDate(row.date)}</span>
              <span style={{ color: 'var(--foreground)' }}>
                {row.weight != null ? `${row.weight}${row.unit} × ${row.actualReps ?? '?'}` : row.durationSeconds != null ? `${row.durationSeconds}s` : `${row.actualReps ?? '?'} reps`}
                {delta != null && delta !== 0 && (
                  <span style={{ marginLeft: 8, color: delta > 0 ? 'var(--lime)' : 'var(--danger)', fontWeight: 700 }}>
                    {delta > 0 ? '+' : ''}
                    {delta}
                    {row.unit}
                  </span>
                )}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function ByMuscleHistory({ stats }: { stats: Stats }) {
  return (
    <div style={{ maxWidth: 480 }}>
      <MuscleDistributionChart distribution={stats.muscleDistribution} />
    </div>
  )
}
