'use client'

import { useState } from 'react'
import { ImageOff, Link2 } from 'lucide-react'
import type { Exercise } from '@/types'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface ExerciseImageProps {
  exercise: Pick<Exercise, 'image' | 'name'>
  className?: string
  size?: number
  onSetCustomUrl?: (url: string | null) => void
}

export function ExerciseImage({ exercise, className, size = 70, onSetCustomUrl }: ExerciseImageProps) {
  const [broken, setBroken] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')

  const src = exercise.image.customUrl ?? exercise.image.gifUrl
  const showImage = src && !broken

  if (showImage) {
    return (
      <img
        src={src}
        alt={`Cómo hacer ${exercise.name}`}
        className={className}
        style={{ width: size, height: size, objectFit: 'cover', borderRadius: 8, background: 'var(--line)' }}
        onError={() => setBroken(true)}
        loading="lazy"
      />
    )
  }

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: 8,
        background: 'var(--line)',
        display: 'grid',
        placeItems: 'center',
        flexShrink: 0,
        color: 'var(--muted)',
        position: 'relative',
      }}
    >
      {!editing ? (
        onSetCustomUrl ? (
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label={`Agregar imagen para ${exercise.name}`}
            style={{ display: 'grid', placeItems: 'center', width: '100%', height: '100%', background: 'transparent', border: 0, cursor: 'pointer' }}
          >
            <ImageOff size={Math.round(size * 0.34)} aria-hidden />
          </button>
        ) : (
          <div role="img" aria-label={`Sin imagen para ${exercise.name}`} style={{ display: 'grid', placeItems: 'center', width: '100%', height: '100%' }}>
            <ImageOff size={Math.round(size * 0.34)} aria-hidden />
          </div>
        )
      ) : (
        <div style={{ position: 'absolute', zIndex: 5, top: 0, left: 0, width: 260, background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: 10, padding: 10, display: 'grid', gap: 8, boxShadow: '0 8px 24px rgba(0,0,0,.2)' }}>
          <label style={{ fontSize: 11, color: 'var(--muted-foreground)', display: 'flex', gap: 6, alignItems: 'center' }}>
            <Link2 size={13} aria-hidden /> URL de imagen o GIF
          </label>
          <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="https://…" autoFocus />
          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
            <Button size="sm" variant="ghost" type="button" onClick={() => setEditing(false)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              type="button"
              onClick={() => {
                onSetCustomUrl?.(draft.trim() || null)
                setBroken(false)
                setEditing(false)
              }}
            >
              Guardar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
