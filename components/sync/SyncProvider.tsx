'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { getSupabase, isSyncConfigured } from '@/lib/supabase/client'
import { countPending, getLastSyncAt, linkDevice, syncNow as runSync } from '@/lib/sync/engine'

/**
 * Estado del sincronizado, disponible en toda la app.
 *
 * Regla de oro: si Supabase no está configurado, o no hay sesión, o la red se
 * cayó, la app tiene que andar igual contra IndexedDB. Nada de lo que hay acá
 * puede bloquear el registro de una serie.
 */

export type SyncStatus =
  | 'off' // sin credenciales: modo local puro
  | 'signed-out'
  | 'syncing'
  | 'idle'
  | 'error'

interface SyncContextValue {
  status: SyncStatus
  email: string | null
  lastSyncAt: string | null
  pending: number
  error: string | null
  /** Manda el magic link al correo indicado. */
  signIn: (email: string) => Promise<{ ok: boolean; message: string }>
  signOut: () => Promise<void>
  sync: () => void
}

const SyncContext = createContext<SyncContextValue | null>(null)

/** Cada cuánto se revisa si quedó algo por subir. Barato: es una lectura de
 *  IndexedDB, solo sale a la red si efectivamente hay cambios. */
const QUEUE_CHECK_MS = 20_000
/** Piso entre bajadas completas cuando no hay nada propio que subir. */
const PULL_EVERY_MS = 120_000

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const configured = isSyncConfigured()
  const [session, setSession] = useState<Session | null>(null)
  const [status, setStatus] = useState<SyncStatus>(configured ? 'signed-out' : 'off')
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null)
  const [pending, setPending] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const lastPullRef = useRef(0)
  const syncRef = useRef<(force: boolean) => void>(() => {})

  // --- sesión -------------------------------------------------------------
  useEffect(() => {
    const client = getSupabase()
    if (!client) return

    let cancelled = false
    void client.auth.getSession().then(({ data }) => {
      if (!cancelled) setSession(data.session)
    })

    const { data: listener } = client.auth.onAuthStateChange((_event, next) => {
      setSession(next)
      // El magic link vuelve con los tokens en el fragmento de la URL;
      // sacarlos de la barra evita dejar un token en el historial del navegador.
      if (next && typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search)
      }
    })

    return () => {
      cancelled = true
      listener.subscription.unsubscribe()
    }
  }, [])

  // --- motor --------------------------------------------------------------
  useEffect(() => {
    const client = getSupabase()
    const userId = session?.user.id

    if (!configured) {
      setStatus('off')
      return
    }
    if (!client || !userId) {
      setStatus('signed-out')
      return
    }

    let cancelled = false
    let inFlight = false

    const refreshPending = async () => {
      const count = await countPending()
      if (!cancelled) setPending(count)
    }

    const doSync = (force: boolean) => {
      if (inFlight || cancelled) return
      void (async () => {
        const queued = await countPending()
        const stale = Date.now() - lastPullRef.current > PULL_EVERY_MS
        if (!force && queued === 0 && !stale) return

        inFlight = true
        if (!cancelled) setStatus('syncing')
        try {
          await linkDevice(client)
          const result = await runSync(client, userId)
          lastPullRef.current = Date.now()
          if (!cancelled) {
            setLastSyncAt(result.at)
            setError(null)
            setStatus('idle')
          }
        } catch (err) {
          // Sin red no es un fallo del que haya que avisar a gritos: se
          // reintenta solo y los datos ya están a salvo en IndexedDB.
          const offline = typeof navigator !== 'undefined' && !navigator.onLine
          if (!cancelled) {
            setError(offline ? null : err instanceof Error ? err.message : 'No se pudo sincronizar.')
            setStatus(offline ? 'idle' : 'error')
          }
        } finally {
          inFlight = false
          void refreshPending()
        }
      })()
    }

    syncRef.current = doSync

    void getLastSyncAt().then((at) => {
      if (!cancelled) setLastSyncAt(at)
    })
    doSync(true)

    const interval = window.setInterval(() => doSync(false), QUEUE_CHECK_MS)
    const onFocus = () => doSync(false)
    const onOnline = () => doSync(true)
    window.addEventListener('focus', onFocus)
    window.addEventListener('online', onOnline)
    document.addEventListener('visibilitychange', onFocus)

    return () => {
      cancelled = true
      syncRef.current = () => {}
      window.clearInterval(interval)
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('online', onOnline)
      document.removeEventListener('visibilitychange', onFocus)
    }
  }, [configured, session])

  const signIn = useCallback(async (email: string) => {
    const client = getSupabase()
    if (!client) return { ok: false, message: 'El sincronizado no está configurado en este dispositivo.' }
    const { error: signInError } = await client.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    })
    if (signInError) return { ok: false, message: signInError.message }
    return { ok: true, message: `Te mandamos un link a ${email.trim()}. Abrilo en este dispositivo.` }
  }, [])

  const signOut = useCallback(async () => {
    const client = getSupabase()
    if (!client) return
    await client.auth.signOut()
    setSession(null)
  }, [])

  const sync = useCallback(() => syncRef.current(true), [])

  const value = useMemo<SyncContextValue>(
    () => ({
      status,
      email: session?.user.email ?? null,
      lastSyncAt,
      pending,
      error,
      signIn,
      signOut,
      sync,
    }),
    [status, session, lastSyncAt, pending, error, signIn, signOut, sync],
  )

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>
}

export function useSync(): SyncContextValue {
  const context = useContext(SyncContext)
  if (!context) throw new Error('useSync debe usarse dentro de <SyncProvider>.')
  return context
}
