'use client'

import { ChevronDown, ChevronUp, GripVertical, Trash2, PersonStanding } from 'lucide-react'
import type { Exercise, PlanExercise } from '@/types'
import { usePlanEditor } from '@/hooks/usePlanEditor'
import { useExercises } from '@/hooks/useExercises'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { EmptyState } from '@/components/common/EmptyState'
import { AddExerciseDialog } from './AddExerciseDialog'

export function CalisthenicsEditor({ storageReady }: { storageReady: boolean }) {
  const { plan, updateExercise, removeExercise, moveExercise, refresh } = usePlanEditor('calistenia', storageReady)
  const { exercises } = useExercises(storageReady)

  const exerciseMap = Object.fromEntries(exercises.map((e) => [e.id, e]))
  const sortedPlanExercises = plan?.exercises.slice().sort((a, b) => a.order - b.order) ?? []

  if (!plan) return null

  return (
    <div style={{ display: 'grid', gap: 14, maxWidth: 720 }}>
      {sortedPlanExercises.length === 0 && (
        <EmptyState icon={PersonStanding} title="Sin ejercicios de calistenia" description="Agregá tu primer ejercicio para empezar a registrar tu rutina." />
      )}

      {sortedPlanExercises.map((pe, index) => {
        const exercise = exerciseMap[pe.exerciseId]
        if (!exercise) return null
        return (
          <PlanExerciseRow
            key={pe.id}
            planExercise={pe}
            exercise={exercise}
            index={index}
            total={sortedPlanExercises.length}
            onMoveUp={() => moveExercise(pe.id, -1)}
            onMoveDown={() => moveExercise(pe.id, 1)}
            onUpdate={(patch) => updateExercise(pe.id, patch)}
            onRemove={() => removeExercise(pe.id)}
          />
        )
      })}

      <div style={{ justifySelf: 'start' }}>
        <AddExerciseDialog planId="calistenia" category="calistenia" storageReady={storageReady} onAdded={refresh} />
      </div>
    </div>
  )
}

function PlanExerciseRow({
  planExercise,
  exercise,
  index,
  total,
  onMoveUp,
  onMoveDown,
  onUpdate,
  onRemove,
}: {
  planExercise: PlanExercise
  exercise: Exercise
  index: number
  total: number
  onMoveUp: () => void
  onMoveDown: () => void
  onUpdate: (patch: Partial<PlanExercise>) => void
  onRemove: () => void
}) {
  return (
    <div className="exercise-card" style={{ flexDirection: 'column', alignItems: 'stretch', height: 'auto', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <GripVertical size={16} style={{ color: 'var(--muted)' }} aria-hidden />
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: 0 }}>{exercise.name}</h3>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)' }}>{exercise.muscleGroup}</p>
        </div>
        <div style={{ display: 'flex', gap: 2 }}>
          <button className="icon-button" onClick={onMoveUp} disabled={index === 0} aria-label={`Mover ${exercise.name} arriba`}>
            <ChevronUp size={16} />
          </button>
          <button className="icon-button" onClick={onMoveDown} disabled={index === total - 1} aria-label={`Mover ${exercise.name} abajo`}>
            <ChevronDown size={16} />
          </button>
          <AlertDialog>
            <AlertDialogTrigger
              render={
                <button className="icon-button" aria-label={`Eliminar ${exercise.name}`}>
                  <Trash2 size={16} />
                </button>
              }
            />
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar {exercise.name} de la rutina?</AlertDialogTitle>
                <AlertDialogDescription>Esto no borra tu historial anterior, solo lo quita de la rutina de calistenia.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={onRemove}>Eliminar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        <div>
          <Label className="text-xs">Series</Label>
          <Input inputMode="numeric" value={planExercise.targetSets} onChange={(e) => onUpdate({ targetSets: Number(e.target.value) || 1 })} />
        </div>
        <div>
          <Label className="text-xs">Objetivo</Label>
          <Input value={planExercise.targetReps ?? ''} onChange={(e) => onUpdate({ targetReps: e.target.value || null })} />
        </div>
        <div>
          <Label className="text-xs">Descanso (s)</Label>
          <Input inputMode="numeric" value={planExercise.restSeconds ?? ''} onChange={(e) => onUpdate({ restSeconds: Number(e.target.value) || null })} />
        </div>
      </div>
    </div>
  )
}
