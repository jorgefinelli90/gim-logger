'use client'

import { useCallback, useEffect, useState } from 'react'
import { DEFAULT_PREFERENCES, type UserPreferences } from '@/types'
import { loadPreferences, updatePreferences } from '@/lib/storage/preferences'
import { markPreferencesDirty } from '@/lib/sync/engine'
import { useSyncVersion } from '@/lib/sync/notify'

export function usePreferences() {
  const syncVersion = useSyncVersion()
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setPreferences(loadPreferences())
    setLoaded(true)
  }, [syncVersion])

  const patch = useCallback((changes: Partial<UserPreferences>) => {
    setPreferences(updatePreferences(changes))
    // El tema y el perfil activo son locales a este dispositivo; el resto
    // (unidades, descanso por defecto, inicio de semana) viaja para no
    // reconfigurarlo en cada pantalla.
    const LOCAL_ONLY_KEYS = new Set(['theme', 'activeProfile'])
    if (Object.keys(changes).some((key) => !LOCAL_ONLY_KEYS.has(key))) void markPreferencesDirty()
  }, [])

  return { preferences, setPreferences: patch, loaded }
}
