'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { DailyNote, DailyNoteInput, Profile } from '@/types'
import { getNoteByDate, upsertNoteForDate } from '@/lib/storage/repositories/note-repo'
import { useSyncVersion } from '@/lib/sync/notify'

export function useDailyNote(profile: Profile, date: string, storageReady: boolean) {
  const syncVersion = useSyncVersion()
  const [note, setNote] = useState<DailyNote | null>(null)
  const [loading, setLoading] = useState(true)
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!storageReady) return
    let cancelled = false
    setLoading(true)
    getNoteByDate(profile, date).then((result) => {
      if (!cancelled) {
        setNote(result ?? null)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [profile, date, storageReady, syncVersion])

  /** Debounced autosave: updates local state immediately, persists after a short pause. */
  const save = useCallback(
    (patch: Partial<DailyNoteInput>) => {
      setNote((prev) => (prev ? { ...prev, ...patch } : ({ ...patch, profile, date } as DailyNote)))
      if (saveTimeout.current) clearTimeout(saveTimeout.current)
      saveTimeout.current = setTimeout(async () => {
        const saved = await upsertNoteForDate(profile, date, patch)
        setNote(saved)
      }, 500)
    },
    [profile, date],
  )

  return { note, loading, save }
}
