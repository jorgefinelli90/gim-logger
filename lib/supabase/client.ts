'use client'

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Cliente único de Supabase.
 *
 * Devuelve `null` cuando no hay credenciales configuradas, y eso NO es un
 * error: Iron Log tiene que seguir funcionando entero contra IndexedDB si
 * nunca se configuró el sync, o si el archivo .env.local no está en esta
 * máquina. Todo el resto del código trata `null` como "modo local".
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

let client: SupabaseClient | null = null

export function isSyncConfigured(): boolean {
  return Boolean(url && key)
}

export function getSupabase(): SupabaseClient | null {
  if (!url || !key) return null
  if (typeof window === 'undefined') return null
  if (!client) {
    client = createClient(url, key, {
      auth: {
        // La sesión vive en localStorage y se renueva sola: el magic link se
        // toca una vez por dispositivo y no vuelve a pedirse.
        persistSession: true,
        autoRefreshToken: true,
        // El link de acceso vuelve con los tokens en el fragmento de la URL.
        detectSessionInUrl: true,
        storageKey: 'iron-log:auth',
      },
    })
  }
  return client
}
