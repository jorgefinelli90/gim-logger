'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { DailyNote, DailyNoteInput } from '@/types'
import { getNoteByDate, upsertNoteForDate } from '@/lib/storage/repositories/note-repo'

export function useDailyNote(date: string, storageReady: boolean) {
  const [note, setNote] = useState<DailyNote | null>(null)
  const [loading, setLoading] = useState(true)
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!storageReady) return
    let cancelled = false
    setLoading(true)
    getNoteByDate(date).then((result) => {
      if (!cancelled) {
        setNote(result ?? null)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [date, storageReady])

  /** Debounced autosave: updates local state immediately, persists after a short pause. */
  const save = useCallback(
    (patch: Partial<DailyNoteInput>) => {
      setNote((prev) => (prev ? { ...prev, ...patch } : ({ ...patch, date } as DailyNote)))
      if (saveTimeout.current) clearTimeout(saveTimeout.current)
      saveTimeout.current = setTimeout(async () => {
        const saved = await upsertNoteForDate(date, patch)
        setNote(saved)
      }, 500)
    },
    [date],
  )

  return { note, loading, save }
}
