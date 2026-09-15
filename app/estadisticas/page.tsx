'use client'

import { useState } from 'react'
import { Clock3, Dumbbell, Flame, Layers, ListOrdered, Repeat2, TrendingUp, Trophy } from 'lucide-react'
import { useStorageReady } from '@/hooks/useStorageReady'
import { useStatistics } from '@/hooks/useStatistics'
import { usePreferences } from '@/hooks/usePreferences'
import { useActiveProfile } from '@/lib/profile/ProfileContext'
import { trainingDaysPerWeek } from '@/lib/date/profile-schedule'
import { StatTile } from '@/components/statistics/StatTile'
import { MuscleDistributionChart } from '@/components/statistics/MuscleDistributionChart'
import { WeightProgressChart } from '@/components/statistics/WeightProgressChart'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function EstadisticasPage() {
  const { ready } = useStorageReady()
  const { profile } = useActiveProfile()
  const stats = useStatistics(profile, ready)
  const { preferences } = usePreferences()
  const exerciseList = Object.values(stats.exercises)
    .filter((e) => e.trackingMode === 'reps')
    .sort((a, b) => a.name.localeCompare(b.name))
  const [exerciseId, setExerciseId] = useState<string>('')
  const activeExerciseId = exerciseId || exerciseList[0]?.id || ''
  const weightPoints = activeExerciseId ? stats.weightProgressionByExercise(activeExerciseId) : []

  const hours = Math.floor(stats.totalTrainingMinutes / 60)
  const minutes = stats.totalTrainingMinutes % 60

  return (
    <>
      <header className="topbar">
        <div>
          <p className="eyebrow">TU EVOLUCIÓN</p>
          <h1>
            <em>Estadísticas.</em>
          </h1>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginTop: 28, maxWidth: 900 }}>
        <StatTile icon={Dumbbell} label="Entrenamientos" value={stats.totals.workoutsCompleted} />
        <StatTile icon={Flame} label="Racha actual" value={stats.streaks.current} hint="días seguidos" />
        <StatTile icon={Trophy} label="Racha máxima" value={stats.streaks.max} hint="días seguidos" />
        <StatTile icon={Layers} label="Volumen total" value={`${Math.round(stats.totals.totalVolume).toLocaleString('es')} ${preferences.units}`} />
        <StatTile icon={ListOrdered} label="Series totales" value={stats.totals.totalSets} />
        <StatTile icon={Repeat2} label="Repeticiones" value={stats.totals.totalReps} />
        <StatTile icon={Clock3} label="Tiempo entrenado" value={stats.totalTrainingMinutes > 0 ? `${hours}h ${minutes}m` : '—'} />
        <StatTile icon={TrendingUp} label="Esta semana" value={`${stats.weeklyCount}/${trainingDaysPerWeek(profile)}`} hint="días de rutina" />
      </div>

      <section style={{ marginTop: 36, maxWidth: 640 }}>
        <h2 style={{ fontSize: 16, marginBottom: 14 }}>Distribución por grupo muscular</h2>
        <MuscleDistributionChart distribution={stats.muscleDistribution} />
      </section>

      <section style={{ marginTop: 36, maxWidth: 620 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
          <h2 style={{ fontSize: 16, margin: 0 }}>Evolución de peso</h2>
          {exerciseList.length > 0 && (
            <Select items={Object.fromEntries(exerciseList.map((e) => [e.id, e.name]))} value={activeExerciseId} onValueChange={(v) => v && setExerciseId(v)}>
              <SelectTrigger className="w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {exerciseList.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <WeightProgressChart points={weightPoints} unit={preferences.units} />
      </section>

      <section style={{ marginTop: 36, maxWidth: 640, marginBottom: 40 }}>
        <h2 style={{ fontSize: 16, marginBottom: 14 }}>Récords personales</h2>
        {stats.records.length === 0 ? (
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>Todavía no hay récords. Completá series para empezar a registrar tus mejores marcas.</p>
        ) : (
          <ul style={{ display: 'grid', gap: 6, listStyle: 'none', margin: 0, padding: 0 }}>
            {stats.records
              .slice()
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((r) => (
                <li key={r.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, borderBottom: '1px solid var(--border)', padding: '8px 2px' }}>
                  <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <Trophy size={14} style={{ color: 'var(--orange)' }} aria-hidden />
                    {stats.exercises[r.exerciseId]?.name ?? r.exerciseId}
                  </span>
                  <span style={{ color: 'var(--foreground)', fontWeight: 600 }}>
                    {r.type === 'max-weight' && `${r.value}${r.unit}`}
                    {r.type === 'max-reps' && `${r.value} reps`}
                    {r.type === 'max-volume' && `${Math.round(r.value)} vol.`}
                    {r.type === 'best-time' && `${r.value}s`}
                  </span>
                </li>
              ))}
          </ul>
        )}
      </section>
    </>
  )
}
