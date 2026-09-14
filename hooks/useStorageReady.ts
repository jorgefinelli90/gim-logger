'use client'

import { useEffect, useState } from 'react'
import { ensureSeeded } from '@/lib/storage/seed'
import { StorageError } from '@/lib/storage/db'

interface StorageReadyState {
  ready: boolean
  error: string | null
}

let seedPromise: Promise<void> | null = null

/** Runs the one-time IndexedDB seed exactly once per page load, shared across every mounted consumer. */
export function useStorageReady(): StorageReadyState {
  const [state, setState] = useState<StorageReadyState>({ ready: false, error: null })

  useEffect(() => {
    let cancelled = false
    if (!seedPromise) seedPromise = ensureSeeded()

    seedPromise
      .then(() => {
        if (!cancelled) setState({ ready: true, error: null })
      })
      .catch((err: unknown) => {
        seedPromise = null
        if (!cancelled) {
          const message = err instanceof StorageError ? err.message : 'No se pudo inicializar el almacenamiento local.'
          setState({ ready: false, error: message })
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  return state
}
