'use client'

import { useState } from 'react'
import { Check, MessageSquarePlus, RotateCcw } from 'lucide-react'
import type { ExerciseSet, TrackingMode, WeightUnit } from '@/types'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

interface SetRowProps {
  set: ExerciseSet
  index: number
  unit: WeightUnit
  trackingMode: TrackingMode
  previousValue?: string | null
  onToggle: () => void
  onUpdate: (patch: Partial<Pick<ExerciseSet, 'actualReps' | 'weight' | 'rpe' | 'durationSeconds' | 'distanceMeters' | 'note'>>) => void
  onReset: () => void
}

function numberOrNull(value: string): number | null {
  if (value.trim() === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

export function SetRow({ set, index, unit, trackingMode, previousValue, onToggle, onUpdate, onReset }: SetRowProps) {
  const [noteOpen, setNoteOpen] = useState(Boolean(set.note))

  return (
    <div style={{ display: 'grid', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 22, fontSize: 11, color: 'var(--muted)', fontVariantNumeric: 'tabular-nums' }}>#{index + 1}</span>

        {trackingMode === 'reps' && (
          <>
            <Input
              inputMode="numeric"
              aria-label={`Repeticiones reales, serie ${index + 1}${set.targetReps ? ` (objetivo: ${set.targetReps})` : ''}`}
              placeholder="reps"
              value={set.actualReps ?? ''}
              onChange={(e) => onUpdate({ actualReps: numberOrNull(e.target.value) })}
              className="h-9 w-16 text-center"
            />
            <Input
              inputMode="decimal"
              aria-label={`Peso, serie ${index + 1}`}
              placeholder={`${unit}`}
              value={set.weight ?? ''}
              onChange={(e) => onUpdate({ weight: numberOrNull(e.target.value) })}
              className="h-9 w-20 text-center"
            />
          </>
        )}

        {trackingMode === 'time' && (
          <Input
            inputMode="numeric"
            aria-label={`Duración en segundos, serie ${index + 1}`}
            placeholder="segundos"
            value={set.durationSeconds ?? ''}
            onChange={(e) => onUpdate({ durationSeconds: numberOrNull(e.target.value) })}
            className="h-9 w-24 text-center"
          />
        )}

        {trackingMode === 'distance' && (
          <Input
            inputMode="decimal"
            aria-label={`Distancia en metros, serie ${index + 1}`}
            placeholder="metros"
            value={set.distanceMeters ?? ''}
            onChange={(e) => onUpdate({ distanceMeters: numberOrNull(e.target.value) })}
            className="h-9 w-24 text-center"
          />
        )}

        <Input
          inputMode="numeric"
          aria-label={`RPE, serie ${index + 1}`}
          placeholder="RPE"
          value={set.rpe ?? ''}
          onChange={(e) => onUpdate({ rpe: numberOrNull(e.target.value) })}
          className="h-9 w-14 text-center"
          title="Esfuerzo percibido (1-10), opcional"
        />

        <button
          type="button"
          onClick={() => setNoteOpen((v) => !v)}
          aria-label={`Nota de la serie ${index + 1}`}
          aria-pressed={noteOpen}
          style={{ border: 0, background: 'transparent', color: set.note ? 'var(--orange)' : 'var(--muted)', padding: 4 }}
        >
          <MessageSquarePlus size={16} />
        </button>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
          {(set.completed || set.actualReps != null || set.weight != null || set.durationSeconds != null) && (
            <button type="button" onClick={onReset} aria-label={`Deshacer serie ${index + 1}`} style={{ border: 0, background: 'transparent', color: 'var(--muted)', padding: 4 }}>
              <RotateCcw size={16} />
            </button>
          )}
          <button
            type="button"
            onClick={onToggle}
            aria-pressed={set.completed}
            aria-label={set.completed ? `Serie ${index + 1} completada` : `Marcar serie ${index + 1} como completada`}
            style={{
              width: 30,
              height: 30,
              borderRadius: '50%',
              border: `1px solid ${set.completed ? 'var(--lime)' : 'var(--border)'}`,
              background: set.completed ? 'var(--lime)' : 'var(--background)',
              color: 'var(--ink)',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            {set.completed && <Check size={15} />}
          </button>
        </div>
      </div>

      {previousValue && !set.completed && <p style={{ margin: 0, fontSize: 11, color: 'var(--muted)', paddingLeft: 30 }}>Anterior: {previousValue}</p>}

      {noteOpen && (
        <Textarea
          value={set.note ?? ''}
          onChange={(e) => onUpdate({ note: e.target.value || null })}
          placeholder="Nota de esta serie…"
          className="ml-[30px] min-h-14 text-xs"
        />
      )}
    </div>
  )
}
