'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { getSupabase, isSyncConfigured } from '@/lib/supabase/client'
import { countPending, getLastSyncAt, linkDevice, syncNow as runSync } from '@/lib/sync/engine'
import { findAccount } from '@/lib/auth/accounts'

/**
 * Estado del sincronizado, disponible en toda la app.
 *
 * Regla de oro: si Supabase no está configurado, o no hay sesión, o la red se
 * cayó, la app tiene que andar igual contra IndexedDB. Nada de lo que hay acá
 * puede bloquear el registro de una serie.
 */

export type SyncStatus =
  | 'off' // sin credenciales: modo local puro
  /** Todavía leyendo la sesión guardada en el dispositivo. Es un estado real
   *  y no un detalle interno: sin él, al recargar se vería un parpadeo de la
   *  pantalla de login aunque la persona ya estuviera adentro. */
  | 'restoring'
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
  /** Login con usuario + contraseña contra una de las cuentas fijas. */
  signIn: (username: string, password: string) => Promise<{ ok: boolean; message: string }>
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
  const [sessionResolved, setSessionResolved] = useState(!configured)
  const [status, setStatus] = useState<SyncStatus>(configured ? 'restoring' : 'off')
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
      if (cancelled) return
      setSession(data.session)
      setSessionResolved(true)
    })

    const { data: listener } = client.auth.onAuthStateChange((_event, next) => {
      setSession(next)
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
    if (!sessionResolved) {
      setStatus('restoring')
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
  }, [configured, sessionResolved, session])

  const signIn = useCallback(async (username: string, password: string) => {
    const account = findAccount(username)
    // Usuario inexistente y contraseña equivocada devuelven el MISMO mensaje:
    // no hace falta ir confirmando cuáles usuarios existen.
    const wrong = { ok: false, message: 'Usuario o contraseña incorrectos.' }
    if (!account) return wrong

    const client = getSupabase()
    if (!client) {
      return { ok: false, message: 'Este dispositivo no tiene configurada la sincronización (falta .env.local).' }
    }

    const { error: signInError } = await client.auth.signInWithPassword({ email: account.email, password })
    if (signInError) {
      // Un fallo de red no es una contraseña mal puesta — decirlo así manda a
      // la persona a revisar lo que no es.
      const offline = typeof navigator !== 'undefined' && !navigator.onLine
      if (offline) return { ok: false, message: 'Sin conexión: no se puede entrar hasta recuperar internet.' }
      return wrong
    }
    return { ok: true, message: `Hola ${account.label}.` }
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
