'use client'

import { useMemo, useState } from 'react'
import { EyeOff, ListChecks, Plus, Search } from 'lucide-react'
import { useStorageReady } from '@/hooks/useStorageReady'
import { useExercises } from '@/hooks/useExercises'
import type { Exercise, ExerciseCategory, MuscleGroup } from '@/types'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { ExerciseImage } from '@/components/exercises/ExerciseImage'
import { ExerciseEditSheet } from '@/components/exercises/ExerciseEditSheet'
import { EmptyState } from '@/components/common/EmptyState'
import { MUSCLE_LABELS, CATEGORY_LABELS } from '@/components/exercises/labels'
import { searchExercises } from '@/lib/exercise-matching/match'

const BLANK_EXERCISE: Exercise = {
  id: '',
  name: '',
  aliases: [],
  muscleGroup: 'cuerpo-completo',
  secondaryMuscles: [],
  category: 'gimnasio',
  trackingMode: 'reps',
  equipment: [],
  instructions: [],
  commonMistakes: [],
  alternatives: [],
  image: { gifUrl: null, customUrl: null, sourceSlug: null },
  hidden: false,
  isCustom: true,
  source: 'custom',
  order: 0,
  createdAt: '',
  updatedAt: '',
}

export default function EjerciciosPage() {
  const { ready } = useStorageReady()
  const { exercises, add, edit } = useExercises(ready)
  const [query, setQuery] = useState('')
  const [muscle, setMuscle] = useState<MuscleGroup | 'todos'>('todos')
  const [category, setCategory] = useState<ExerciseCategory | 'todos'>('todos')
  const [showHidden, setShowHidden] = useState(false)
  const [editing, setEditing] = useState<Exercise | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const filtered = useMemo(() => {
    let list = exercises.filter((e) => showHidden || !e.hidden)
    if (muscle !== 'todos') list = list.filter((e) => e.muscleGroup === muscle)
    if (category !== 'todos') list = list.filter((e) => e.category === category)
    if (query.trim()) {
      const matches = searchExercises(query, list, { limit: 200, minScore: 0.15 })
      list = matches.map((m) => m.candidate)
    }
    return list
  }, [exercises, showHidden, muscle, category, query])

  async function handleSave(patch: Partial<Exercise>) {
    if (editing && editing.id) {
      await edit(editing.id, patch)
    } else {
      const { id: _id, createdAt: _c, updatedAt: _u, ...input } = { ...BLANK_EXERCISE, ...patch }
      await add(input)
    }
  }

  return (
    <>
      <header className="topbar">
        <div>
          <p className="eyebrow">TU LIBRERÍA</p>
          <h1>
            <em>Ejercicios.</em>
          </h1>
        </div>
        <Button
          onClick={() => {
            setEditing(BLANK_EXERCISE)
            setSheetOpen(true)
          }}
        >
          <Plus /> Crear ejercicio
        </Button>
      </header>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 24, marginBottom: 20 }}>
        <div style={{ position: 'relative', flex: '1 1 220px' }}>
          <Search size={15} style={{ position: 'absolute', left: 10, top: 12, color: 'var(--muted)' }} aria-hidden />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nombre…" className="pl-8" aria-label="Buscar ejercicio" />
        </div>
        <Select items={{ todos: 'Todos los músculos', ...MUSCLE_LABELS }} value={muscle} onValueChange={(v) => setMuscle(v as MuscleGroup | 'todos')}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los músculos</SelectItem>
            {Object.entries(MUSCLE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select items={{ todos: 'Todas las categorías', ...CATEGORY_LABELS }} value={category} onValueChange={(v) => setCategory(v as ExerciseCategory | 'todos')}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas las categorías</SelectItem>
            {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--muted)' }}>
          <Switch checked={showHidden} onCheckedChange={(v) => setShowHidden(Boolean(v))} /> Mostrar ocultos
        </label>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={ListChecks} title="No se encontraron ejercicios" description="Probá con otro nombre, grupo muscular o categoría." />
      ) : (
        <div className="exercise-list">
          {filtered.map((exercise) => (
            <button
              key={exercise.id}
              type="button"
              onClick={() => {
                setEditing(exercise)
                setSheetOpen(true)
              }}
              className="exercise-card"
              style={{ textAlign: 'left', cursor: 'pointer' }}
            >
              <ExerciseImage exercise={exercise} />
              <div className="exercise-copy">
                <div className="exercise-top">
                  <span>{MUSCLE_LABELS[exercise.muscleGroup]}</span>
                  {exercise.hidden && (
                    <b style={{ color: 'var(--muted)', display: 'flex', gap: 4, alignItems: 'center' }}>
                      <EyeOff size={11} /> OCULTO
                    </b>
                  )}
                </div>
                <h3>{exercise.name}</h3>
                <p>{CATEGORY_LABELS[exercise.category]}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      <ExerciseEditSheet exercise={editing} open={sheetOpen} onOpenChange={setSheetOpen} onSave={handleSave} />
    </>
  )
}
