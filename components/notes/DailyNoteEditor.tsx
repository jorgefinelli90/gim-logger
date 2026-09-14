'use client'

import { Flame } from 'lucide-react'
import type { DailyNote } from '@/types'

interface DailyNoteEditorProps {
  note: DailyNote | null
  onChange: (patch: Partial<Pick<DailyNote, 'general' | 'energyLevel' | 'mood' | 'soreness'>>) => void
}

const LEVELS = [1, 2, 3, 4, 5]

function LevelPicker({ label, value, onSelect }: { label: string; value: number | null; onSelect: (v: number) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
      <span style={{ fontSize: 10, color: 'var(--muted)', width: 62, letterSpacing: '.06em' }}>{label}</span>
      <div style={{ display: 'flex', gap: 4 }} role="radiogroup" aria-label={label}>
        {LEVELS.map((level) => (
          <button
            key={level}
            type="button"
            role="radio"
            aria-checked={value === level}
            onClick={() => onSelect(level)}
            style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              fontSize: 11,
              border: `1px solid ${value === level ? 'var(--lime)' : 'var(--border)'}`,
              background: value === level ? 'var(--lime)' : 'transparent',
              color: value === level ? 'var(--ink)' : 'var(--muted-foreground)',
            }}
          >
            {level}
          </button>
        ))}
      </div>
    </div>
  )
}

export function DailyNoteEditor({ note, onChange }: DailyNoteEditorProps) {
  return (
    <section className="notes-card">
      <div className="card-title">
        <span>
          <Flame aria-hidden /> NOTAS DE HOY
        </span>
        <span className="saved">GUARDADO AUTOMÁTICO</span>
      </div>

      <div style={{ marginTop: 16 }}>
        <LevelPicker label="ENERGÍA" value={note?.energyLevel ?? null} onSelect={(v) => onChange({ energyLevel: v })} />
        <LevelPicker label="ÁNIMO" value={note?.mood ?? null} onSelect={(v) => onChange({ mood: v })} />
      </div>

      <textarea
        value={note?.general ?? ''}
        onChange={(e) => onChange({ general: e.target.value })}
        placeholder="¿Cómo te sentiste? Anota sensaciones, molestias o lo que quieras recordar…"
        style={{ marginTop: 4 }}
      />
      <input
        value={note?.soreness ?? ''}
        onChange={(e) => onChange({ soreness: e.target.value || null })}
        placeholder="Dolor o molestias (opcional)"
        aria-label="Dolor o molestias"
        style={{ width: '100%', border: 0, borderTop: '1px solid var(--border)', outline: 0, background: 'transparent', color: 'var(--foreground)', fontSize: 12, padding: '10px 0 0', marginTop: 8 }}
      />
    </section>
  )
}
