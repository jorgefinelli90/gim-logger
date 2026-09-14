'use client'

import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import type { Exercise, ExerciseCategory, MuscleGroup, TrackingMode } from '@/types'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ExerciseImage } from './ExerciseImage'
import { CATALOG_MUSCLES, searchCatalogMuscle, type CatalogItem, type CatalogMuscleSlug } from '@/lib/exercise-matching/catalog-client'
import { MUSCLE_LABELS, CATEGORY_LABELS, TRACKING_LABELS } from './labels'

interface ExerciseEditSheetProps {
  exercise: Exercise | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (patch: Partial<Exercise>) => Promise<void>
}

function linesToList(value: string): string[] {
  return value.split('\n').map((line) => line.trim()).filter(Boolean)
}

function csvToList(value: string): string[] {
  return value.split(',').map((v) => v.trim()).filter(Boolean)
}

export function ExerciseEditSheet({ exercise, open, onOpenChange, onSave }: ExerciseEditSheetProps) {
  const [form, setForm] = useState<Exercise | null>(exercise)
  const [imageSearchOpen, setImageSearchOpen] = useState(false)

  useEffect(() => setForm(exercise), [exercise])

  if (!form) return null

  async function handleSave() {
    if (!form) return
    await onSave(form)
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent aria-describedby={undefined}>
        <SheetHeader>
          <SheetTitle>Editar ejercicio</SheetTitle>
        </SheetHeader>

        <div style={{ display: 'grid', gap: 14 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <ExerciseImage exercise={form} size={64} onSetCustomUrl={(url) => setForm((f) => f && { ...f, image: { ...f.image, customUrl: url } })} />
            <Button type="button" variant="outline" size="sm" onClick={() => setImageSearchOpen((v) => !v)}>
              <Search size={14} /> Buscar imagen
            </Button>
          </div>

          {imageSearchOpen && <ImageSearchPanel onPick={(item) => setForm((f) => f && { ...f, image: { ...f.image, customUrl: item.gifUrl, sourceSlug: item.slug } })} />}

          <div>
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" value={form.name} onChange={(e) => setForm((f) => f && { ...f, name: e.target.value })} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <Label>Grupo muscular</Label>
              <Select items={MUSCLE_LABELS} value={form.muscleGroup} onValueChange={(v) => setForm((f) => f && { ...f, muscleGroup: v as MuscleGroup })}>
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
              <Label>Categoría</Label>
              <Select items={CATEGORY_LABELS} value={form.category} onValueChange={(v) => setForm((f) => f && { ...f, category: v as ExerciseCategory })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Se mide en</Label>
            <Select items={TRACKING_LABELS} value={form.trackingMode} onValueChange={(v) => setForm((f) => f && { ...f, trackingMode: v as TrackingMode })}>
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

          <div>
            <Label htmlFor="aliases">Alias (separados por coma)</Label>
            <Input id="aliases" value={form.aliases.join(', ')} onChange={(e) => setForm((f) => f && { ...f, aliases: csvToList(e.target.value) })} />
          </div>

          <div>
            <Label htmlFor="equipment">Equipo (separado por coma)</Label>
            <Input id="equipment" value={form.equipment.join(', ')} onChange={(e) => setForm((f) => f && { ...f, equipment: csvToList(e.target.value) })} />
          </div>

          <div>
            <Label htmlFor="alternatives">Alternativas equivalentes (separadas por coma)</Label>
            <Input id="alternatives" value={form.alternatives.join(', ')} onChange={(e) => setForm((f) => f && { ...f, alternatives: csvToList(e.target.value) })} />
          </div>

          <div>
            <Label htmlFor="instructions">Instrucciones de ejecución (una por línea)</Label>
            <Textarea id="instructions" className="min-h-24" value={form.instructions.join('\n')} onChange={(e) => setForm((f) => f && { ...f, instructions: linesToList(e.target.value) })} />
          </div>

          <div>
            <Label htmlFor="mistakes">Errores comunes / consejos (uno por línea)</Label>
            <Textarea id="mistakes" className="min-h-20" value={form.commonMistakes.join('\n')} onChange={(e) => setForm((f) => f && { ...f, commonMistakes: linesToList(e.target.value) })} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Label htmlFor="hidden">Ocultar de la biblioteca activa</Label>
            <Switch id="hidden" checked={form.hidden} onCheckedChange={(v) => setForm((f) => f && { ...f, hidden: Boolean(v) })} />
          </div>

          <Button onClick={handleSave}>Guardar cambios</Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function ImageSearchPanel({ onPick }: { onPick: (item: CatalogItem) => void }) {
  const [muscle, setMuscle] = useState<CatalogMuscleSlug>('pectorals')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<CatalogItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    searchCatalogMuscle(muscle, query).then((items) => {
      if (!cancelled) {
        setResults(items)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [muscle, query])

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 10, display: 'grid', gap: 8 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <Select items={Object.fromEntries(CATALOG_MUSCLES.map((m) => [m.slug, m.label]))} value={muscle} onValueChange={(v) => setMuscle(v as CatalogMuscleSlug)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATALOG_MUSCLES.map((m) => (
              <SelectItem key={m.slug} value={m.slug}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input placeholder="Buscar…" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      {loading ? (
        <p className="text-xs text-muted-foreground">Buscando…</p>
      ) : results.length === 0 ? (
        <p className="text-xs text-muted-foreground">Sin resultados. Probá otro grupo muscular o revisá tu conexión.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, maxHeight: 220, overflowY: 'auto' }}>
          {results.map((item) => (
            <button key={item.slug} type="button" onClick={() => onPick(item)} title={item.name} style={{ border: 0, padding: 0, borderRadius: 8, overflow: 'hidden' }}>
              <img src={item.thumbUrl} alt={item.name} style={{ width: '100%', height: 56, objectFit: 'cover' }} loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
