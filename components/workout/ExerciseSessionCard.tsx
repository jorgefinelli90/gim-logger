'use client'

import { useState } from 'react'
import { ChevronRight, Clock3, Copy, Minus, Plus } from 'lucide-react'
import type { Exercise, ExerciseSet, PlanExercise } from '@/types'
import { ExerciseImage } from '@/components/exercises/ExerciseImage'
import { SetRow } from './SetRow'
import { ExerciseDetailSheet } from './ExerciseDetailSheet'
import { useTimerContext } from '@/lib/timer/TimerContext'
import { updateExercise } from '@/lib/storage/repositories/exercise-repo'

interface ExerciseSessionCardProps {
  exercise: Exercise
  planExercise?: PlanExercise
  sets: ExerciseSet[]
  index: number
  onToggleSet: (setId: string) => void
  onUpdateSet: (setId: string, patch: Partial<Pick<ExerciseSet, 'actualReps' | 'weight' | 'rpe' | 'durationSeconds' | 'distanceMeters' | 'note'>>) => void
  onResetSet: (setId: string) => void
  onAddSet: () => void
  onRemoveSet: () => void
  onDuplicateLastWeight: () => void
  onExerciseUpdated?: (exercise: Exercise) => void
}

export function ExerciseSessionCard({
  exercise,
  planExercise,
  sets,
  index,
  onToggleSet,
  onUpdateSet,
  onResetSet,
  onAddSet,
  onRemoveSet,
  onDuplicateLastWeight,
  onExerciseUpdated,
}: ExerciseSessionCardProps) {
  const [detailOpen, setDetailOpen] = useState(false)
  const [liveExercise, setLiveExercise] = useState(exercise)
  const timer = useTimerContext()

  const completed = sets.filter((s) => s.completed).length
  const restSeconds = planExercise?.restSeconds
  const restRunning = timer.active && timer.sourceId === exercise.id
  const restMm = String(Math.floor(timer.remainingSeconds / 60)).padStart(2, '0')
  const restSs = String(timer.remainingSeconds % 60).padStart(2, '0')

  return (
    <article className={`exercise-card ${completed === sets.length && sets.length > 0 ? 'complete' : ''}`} style={{ flexDirection: 'column', alignItems: 'stretch', height: 'auto', padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
        <ExerciseImage
          exercise={liveExercise}
          onSetCustomUrl={async (url) => {
            const updated = await updateExercise(liveExercise.id, { image: { ...liveExercise.image, customUrl: url } })
            setLiveExercise(updated)
            onExerciseUpdated?.(updated)
          }}
        />
        <div className="exercise-copy" style={{ flex: 1, minWidth: 0 }}>
          <div className="exercise-top">
            <span>
              {String(index + 1).padStart(2, '0')} / {exercise.muscleGroup.toUpperCase()}
            </span>
            {completed > 0 && <b>{completed}/{sets.length} SERIES</b>}
          </div>
          <h3>{exercise.name}</h3>
          <p>
            {planExercise?.targetSets ?? sets.length} series{planExercise?.targetReps ? ` · ${planExercise.targetReps}` : ''}
          </p>
        </div>
        <button type="button" onClick={() => setDetailOpen(true)} aria-label={`Ver detalle de ${exercise.name}`} className="icon-button">
          <ChevronRight className="arrow" aria-hidden />
        </button>
      </div>

      <div style={{ marginTop: 12, display: 'grid', gap: 8, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
        {sets.map((set, i) => (
          <SetRow
            key={set.id}
            set={set}
            index={i}
            unit={set.unit}
            trackingMode={exercise.trackingMode}
            onToggle={() => onToggleSet(set.id)}
            onUpdate={(patch) => onUpdateSet(set.id, patch)}
            onReset={() => onResetSet(set.id)}
          />
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
        <button type="button" onClick={onAddSet} className="icon-button" style={{ display: 'flex', gap: 5, alignItems: 'center', fontSize: 11, border: '1px solid var(--border)', borderRadius: 8, padding: '6px 10px' }}>
          <Plus size={14} /> Serie
        </button>
        {sets.length > 1 && (
          <button
            type="button"
            onClick={onRemoveSet}
            aria-label={`Quitar la última serie de ${exercise.name}`}
            className="icon-button"
            style={{ display: 'flex', gap: 5, alignItems: 'center', fontSize: 11, border: '1px solid var(--border)', borderRadius: 8, padding: '6px 10px' }}
          >
            <Minus size={14} /> Serie
          </button>
        )}
        {exercise.trackingMode === 'reps' && (
          <button type="button" onClick={onDuplicateLastWeight} className="icon-button" style={{ display: 'flex', gap: 5, alignItems: 'center', fontSize: 11, border: '1px solid var(--border)', borderRadius: 8, padding: '6px 10px' }}>
            <Copy size={14} /> Duplicar último peso
          </button>
        )}
        {restSeconds != null && (
          <button
            type="button"
            onClick={() => timer.start(restSeconds, exercise.name, exercise.id)}
            className="icon-button"
            aria-label={restRunning ? `Descanso en curso, ${restMm}:${restSs} restantes. Tocá para reiniciarlo.` : `Iniciar descanso de ${restSeconds} segundos`}
            style={{
              display: 'flex',
              gap: 5,
              alignItems: 'center',
              fontSize: 11,
              fontWeight: restRunning ? 700 : 400,
              fontVariantNumeric: 'tabular-nums',
              border: `1px solid ${restRunning ? 'var(--lime)' : 'var(--border)'}`,
              borderRadius: 8,
              padding: '6px 10px',
              marginLeft: 'auto',
              background: restRunning ? 'var(--lime)' : 'transparent',
              color: restRunning ? 'var(--ink)' : 'var(--muted)',
              transition: 'background .15s ease, color .15s ease, border-color .15s ease',
            }}
          >
            <Clock3 size={14} /> {restRunning ? `${restMm}:${restSs}` : `Descanso ${restSeconds}s`}
          </button>
        )}
      </div>

      <ExerciseDetailSheet
        exercise={liveExercise}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onExerciseUpdated={(updated) => {
          setLiveExercise(updated)
          onExerciseUpdated?.(updated)
        }}
      />
    </article>
  )
}
