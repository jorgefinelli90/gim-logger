'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import type { ExerciseCategory, MuscleGroup, PlanDayId, TrackingMode } from '@/types'
import { useExercises } from '@/hooks/useExercises'
import { usePlanEditor } from '@/hooks/usePlanEditor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { MUSCLE_LABELS, TRACKING_LABELS } from '@/components/exercises/labels'

interface FormState {
  name: string
  muscleGroup: MuscleGroup
  trackingMode: TrackingMode
  targetSets: string
  targetReps: string
  restSeconds: string
}

const EMPTY_FORM: FormState = {
  name: '',
  muscleGroup: 'cuerpo-completo',
  trackingMode: 'reps',
  targetSets: '3',
  targetReps: '',
  restSeconds: '60',
}

interface AddExerciseDialogProps {
  planId: PlanDayId
  category: ExerciseCategory
  storageReady: boolean
  /** Called after the exercise is created and appended to the plan. */
  onAdded?: () => void
  triggerLabel?: string
}

/** Creates a custom exercise and appends it to a plan in one step. */
export function AddExerciseDialog({ planId, category, storageReady, onAdded, triggerLabel = 'Agregar ejercicio' }: AddExerciseDialogProps) {
  const { addExercise } = usePlanEditor(planId, storageReady)
  const { exercises, add: addExerciseRecord } = useExercises(storageReady)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)

  async function handleCreate() {
    if (!form.name.trim() || saving) return
    setSaving(true)
    try {
      const created = await addExerciseRecord({
        name: form.name.trim(),
        aliases: [],
        muscleGroup: form.muscleGroup,
        secondaryMuscles: [],
        category,
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
      setOpen(false)
      onAdded?.()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline">
            <Plus /> {triggerLabel}
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo ejercicio</DialogTitle>
        </DialogHeader>
        <div style={{ display: 'grid', gap: 12 }}>
          <div>
            <Label htmlFor="add-ex-name">Nombre</Label>
            <Input id="add-ex-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Ej: Fondos en banco" autoFocus />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <Label>Grupo muscular</Label>
              <Select items={MUSCLE_LABELS} value={form.muscleGroup} onValueChange={(v) => v && setForm((f) => ({ ...f, muscleGroup: v as MuscleGroup }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(MUSCLE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Se mide en</Label>
              <Select items={TRACKING_LABELS} value={form.trackingMode} onValueChange={(v) => v && setForm((f) => ({ ...f, trackingMode: v as TrackingMode }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TRACKING_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <div>
              <Label htmlFor="add-ex-sets">Series</Label>
              <Input id="add-ex-sets" inputMode="numeric" value={form.targetSets} onChange={(e) => setForm((f) => ({ ...f, targetSets: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="add-ex-reps">Objetivo</Label>
              <Input id="add-ex-reps" value={form.targetReps} onChange={(e) => setForm((f) => ({ ...f, targetReps: e.target.value }))} placeholder="12-15 reps" />
            </div>
            <div>
              <Label htmlFor="add-ex-rest">Descanso (s)</Label>
              <Input id="add-ex-rest" inputMode="numeric" value={form.restSeconds} onChange={(e) => setForm((f) => ({ ...f, restSeconds: e.target.value }))} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleCreate} disabled={!form.name.trim() || saving}>
            {saving ? 'Agregando…' : 'Agregar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
