'use client'

import { useCallback, useEffect, useState } from 'react'
import { DEFAULT_PREFERENCES, type UserPreferences } from '@/types'
import { loadPreferences, updatePreferences } from '@/lib/storage/preferences'

export function usePreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setPreferences(loadPreferences())
    setLoaded(true)
  }, [])

  const patch = useCallback((changes: Partial<UserPreferences>) => {
    setPreferences(updatePreferences(changes))
  }, [])

  return { preferences, setPreferences: patch, loaded }
}
