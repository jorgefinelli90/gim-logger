'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, GripVertical, Plus, Trash2 } from 'lucide-react'
import type { Exercise, MuscleGroup, PlanExercise, TrackingMode } from '@/types'
import { useCalisthenicsPlan } from '@/hooks/useCalisthenicsPlan'
import { useExercises } from '@/hooks/useExercises'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { EmptyState } from '@/components/common/EmptyState'
import { PersonStanding } from 'lucide-react'

const MUSCLE_OPTIONS: { value: MuscleGroup; label: string }[] = [
  { value: 'pecho', label: 'Pecho' },
  { value: 'espalda', label: 'Espalda' },
  { value: 'hombros', label: 'Hombros' },
  { value: 'biceps', label: 'Bíceps' },
  { value: 'triceps', label: 'Tríceps' },
  { value: 'antebrazos', label: 'Antebrazos' },
  { value: 'piernas', label: 'Piernas' },
  { value: 'gluteos', label: 'Glúteos' },
  { value: 'abdominales', label: 'Abdominales' },
  { value: 'pantorrillas', label: 'Pantorrillas' },
  { value: 'cuerpo-completo', label: 'Cuerpo completo' },
  { value: 'otro', label: 'Otro' },
]

const TRACKING_OPTIONS: { value: TrackingMode; label: string }[] = [
  { value: 'reps', label: 'Repeticiones' },
  { value: 'time', label: 'Tiempo' },
  { value: 'distance', label: 'Distancia' },
]

interface NewExerciseFormState {
  name: string
  muscleGroup: MuscleGroup
  trackingMode: TrackingMode
  targetSets: string
  targetReps: string
  restSeconds: string
}

const EMPTY_FORM: NewExerciseFormState = { name: '', muscleGroup: 'cuerpo-completo', trackingMode: 'reps', targetSets: '3', targetReps: '', restSeconds: '60' }

export function CalisthenicsEditor({ storageReady }: { storageReady: boolean }) {
  const { plan, addExercise, updateExercise, removeExercise, moveExercise } = useCalisthenicsPlan(storageReady)
  const { exercises, add: addExerciseRecord } = useExercises(storageReady)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState<NewExerciseFormState>(EMPTY_FORM)

  const exerciseMap = Object.fromEntries(exercises.map((e) => [e.id, e]))
  const sortedPlanExercises = plan?.exercises.slice().sort((a, b) => a.order - b.order) ?? []

  async function handleCreate() {
    if (!form.name.trim()) return
    const created = await addExerciseRecord({
      name: form.name.trim(),
      aliases: [],
      muscleGroup: form.muscleGroup,
      secondaryMuscles: [],
      category: 'calistenia',
      trackingMode: form.trackingMode,
      equipment: [],
      instructions: [],
      commonMistakes: [],
      alternatives: [],
      image: { gifUrl: null, customUrl: null, sourceSlug: null },
      hidden: false,
      isCustom: true,
      source: 'custom',
      order: exercises.length,
    })
    await addExercise(created.id, Number(form.targetSets) || 3, form.targetReps.trim() || null, Number(form.restSeconds) || 60)
    setForm(EMPTY_FORM)
    setDialogOpen(false)
  }

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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger
          render={
            <Button variant="outline" className="justify-self-start">
              <Plus /> Agregar ejercicio
            </Button>
          }
        />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo ejercicio de calistenia</DialogTitle>
          </DialogHeader>
          <div style={{ display: 'grid', gap: 12 }}>
            <div>
              <Label htmlFor="ex-name">Nombre</Label>
              <Input id="ex-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Ej: Fondos en banco" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <Label>Grupo muscular</Label>
                <Select
                  items={Object.fromEntries(MUSCLE_OPTIONS.map((o) => [o.value, o.label]))}
                  value={form.muscleGroup}
                  onValueChange={(v) => setForm((f) => ({ ...f, muscleGroup: v as MuscleGroup }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MUSCLE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Se mide en</Label>
                <Select
                  items={Object.fromEntries(TRACKING_OPTIONS.map((o) => [o.value, o.label]))}
                  value={form.trackingMode}
                  onValueChange={(v) => setForm((f) => ({ ...f, trackingMode: v as TrackingMode }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRACKING_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <div>
                <Label htmlFor="ex-sets">Series</Label>
                <Input id="ex-sets" inputMode="numeric" value={form.targetSets} onChange={(e) => setForm((f) => ({ ...f, targetSets: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="ex-reps">Objetivo</Label>
                <Input id="ex-reps" value={form.targetReps} onChange={(e) => setForm((f) => ({ ...f, targetReps: e.target.value }))} placeholder="Ej: 12-15 reps" />
              </div>
              <div>
                <Label htmlFor="ex-rest">Descanso (s)</Label>
                <Input id="ex-rest" inputMode="numeric" value={form.restSeconds} onChange={(e) => setForm((f) => ({ ...f, restSeconds: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={!form.name.trim()}>
              Agregar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
