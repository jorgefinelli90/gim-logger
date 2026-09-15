'use client'

import type { SupabaseClient } from '@supabase/supabase-js'
import {
  SYNCABLE_STORES,
  clearSyncEntries,
  deleteOne,
  enqueueEverything,
  getAll,
  getOne,
  listSyncQueue,
  putMany,
  type SyncableStore,
  type SyncQueueEntry,
} from '@/lib/storage/db'
import { getMeta, setMeta } from '@/lib/storage/repositories/meta-repo'
import { loadPreferences, savePreferences } from '@/lib/storage/preferences'
import { notifyDataPulled } from './notify'
import { TABLE_SPECS } from './tables'

/**
 * Sincronización offline-first con Supabase.
 *
 * El dispositivo sigue escribiendo SIEMPRE contra IndexedDB primero — en el
 * gimnasio la señal es mala y anotar una serie no puede depender de la red.
 * Supabase es la copia compartida: se baja lo que cambió y se sube lo propio.
 *
 * Resolución de conflictos: gana la escritura más reciente (`updatedAt`). Para
 * un usuario único en dos dispositivos es la regla correcta y predecible; no
 * hace falta CRDT para esto.
 */

const PAGE_SIZE = 500
/** El cursor se retrasa un segundo a propósito: dos filas escritas en el mismo
 *  instante podrían quedar del lado equivocado de un `>` estricto. Reaplicar
 *  una fila es inocuo (es un upsert), perdérsela no. */
const CURSOR_OVERLAP_MS = 1000

const cursorKey = (store: SyncableStore | 'preferences') => `sync:cursor:${store}`

/**
 * Compara fechas por instante, nunca como texto.
 *
 * Postgres devuelve `2026-09-02T11:29:00+00:00` y la app guarda
 * `2026-09-02T11:29:00.000Z`. Con esos dos formatos exactos el orden como
 * texto coincide con el real, pero por casualidad lexicográfica: basta que el
 * servidor responda con un offset distinto de `+00:00` (depende del TimeZone
 * de la conexión) para que se dé vuelta y un cambio remoto más nuevo se
 * descarte en silencio. Ver `engine.test.ts`.
 */
export function millis(value: unknown): number {
  if (typeof value !== 'string' || value === '') return 0
  const parsed = new Date(value).getTime()
  return Number.isNaN(parsed) ? 0 : parsed
}

export interface SyncResult {
  pulled: number
  pushed: number
  at: string
}

export class SyncError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message)
    this.name = 'SyncError'
  }
}

// --------------------------------------------------------------------- pull

async function pullStore(client: SupabaseClient, store: SyncableStore, dirty: Set<string>): Promise<number> {
  const spec = TABLE_SPECS[store]
  const since = (await getMeta<string>(cursorKey(store))) ?? '1970-01-01T00:00:00.000Z'
  let cursor = since
  let applied = 0

  for (;;) {
    const { data, error } = await client
      .from(spec.table)
      .select('*')
      .gt('server_updated_at', cursor)
      .order('server_updated_at', { ascending: true })
      .limit(PAGE_SIZE)

    if (error) throw new SyncError(`No se pudo bajar "${spec.table}": ${error.message}`, error)
    if (!data || data.length === 0) break

    const incoming: unknown[] = []
    for (const row of data as Record<string, unknown>[]) {
      const id = String(row.id ?? '')
      if (!id) continue

      // Este registro tiene cambios locales sin subir: no lo pisamos con la
      // versión del servidor salvo que la del servidor sea más nueva.
      if (dirty.has(id)) {
        const local = await getOne<Record<string, unknown>>(store, id)
        if (local && millis(spec.stamp(local)) >= millis(row.updated_at)) continue
      }

      if (row.deleted_at) {
        await deleteOne(store, id, false)
      } else {
        incoming.push(spec.fromRow(row))
      }
      applied += 1
    }

    if (incoming.length > 0) await putMany(store, incoming, false)

    const last = data[data.length - 1] as Record<string, unknown>
    cursor = String(last.server_updated_at)
    if (data.length < PAGE_SIZE) break
  }

  if (cursor !== since) {
    await setMeta(cursorKey(store), new Date(new Date(cursor).getTime() - CURSOR_OVERLAP_MS).toISOString())
  }
  return applied
}

async function pullPreferences(client: SupabaseClient): Promise<number> {
  const { data, error } = await client.from('preferences').select('data, updated_at').maybeSingle()
  if (error) throw new SyncError(`No se pudieron bajar las preferencias: ${error.message}`, error)
  if (!data?.data) return 0

  const local = loadPreferences()
  const remoteAt = String(data.updated_at ?? '')
  const localAt = (await getMeta<string>('preferences:updatedAt')) ?? ''
  // Mismo cuidado que arriba: los dos formatos de fecha conviven acá.
  if (localAt && millis(localAt) >= millis(remoteAt)) return 0

  // El tema y el perfil activo son del dispositivo, no de la cuenta: el
  // celular puede estar en oscuro mostrando a Sebas mientras la notebook está
  // en claro mostrando a Jorge, sin que sincronizar le pise el gusto al otro.
  savePreferences({ ...local, ...(data.data as object), theme: local.theme, activeProfile: local.activeProfile })
  await setMeta('preferences:updatedAt', remoteAt)
  return 1
}

// --------------------------------------------------------------------- push

async function pushQueue(client: SupabaseClient, userId: string, queue: SyncQueueEntry[]): Promise<number> {
  let pushed = 0

  for (const store of SYNCABLE_STORES) {
    const entries = queue.filter((entry) => entry.store === store)
    if (entries.length === 0) continue

    const spec = TABLE_SPECS[store]
    const rows: Record<string, unknown>[] = []
    const done: { store: SyncableStore; key: string }[] = []

    for (const entry of entries) {
      if (entry.op === 'delete') {
        // Lápida en vez de DELETE: el otro dispositivo necesita enterarse.
        rows.push({ user_id: userId, id: entry.key, deleted_at: new Date().toISOString(), ...tombstoneDefaults(store, entry.key) })
        done.push({ store, key: entry.key })
        continue
      }
      const local = await getOne<Record<string, unknown>>(store, entry.key)
      if (!local) {
        // Se creó y se borró antes de subir: no hay nada que mandar.
        done.push({ store, key: entry.key })
        continue
      }
      rows.push({ user_id: userId, deleted_at: null, ...(spec.toRow as (r: unknown) => Record<string, unknown>)(local) })
      done.push({ store, key: entry.key })
    }

    for (let i = 0; i < rows.length; i += PAGE_SIZE) {
      const chunk = rows.slice(i, i + PAGE_SIZE)
      const { error } = await client.from(spec.table).upsert(chunk, { onConflict: 'id' })
      if (error) throw new SyncError(`No se pudo subir "${spec.table}": ${error.message}`, error)
      pushed += chunk.length
    }

    await clearSyncEntries(done)
  }

  return pushed
}

/** Columnas NOT NULL que una lápida igual tiene que traer para poder insertarse
 *  si el registro nunca llegó al servidor. */
function tombstoneDefaults(store: SyncableStore, id: string): Record<string, unknown> {
  const now = new Date().toISOString()
  const today = now.slice(0, 10)
  // El id de Sebastián lleva su prefijo (ver plan-id.ts / parse-routine.mjs);
  // cualquier otro id borrado es de Jorge por ser el perfil sin prefijo.
  const profile = id.startsWith('sebas-') || id.startsWith('sebas') ? 'sebas' : 'jorge'
  const base = { created_at: now, updated_at: now, profile }
  switch (store) {
    case 'exercises':
      return { ...base, name: id, muscle_group: 'otro', category: 'gimnasio', tracking_mode: 'reps', source: 'custom' }
    case 'plans':
      return { ...base, day_id: id, title: id, type: 'calistenia', updated_at: now }
    case 'sessions':
      return { ...base, date: today, type: 'descanso', status: 'pendiente', is_primary_for_date: false }
    case 'sets':
      return { ...base, session_id: '', exercise_id: '', set_index: 0 }
    case 'notes':
      return { ...base, date: today }
    case 'bodyMetrics':
      return { ...base, date: today }
    case 'records':
      return { ...base, exercise_id: '', type: 'max-weight', value: 0, date: today, session_id: '', set_id: '' }
  }
}

async function pushPreferences(client: SupabaseClient, userId: string): Promise<number> {
  const pending = await getMeta<boolean>('preferences:dirty')
  if (!pending) return 0
  const updatedAt = new Date().toISOString()
  const { error } = await client
    .from('preferences')
    .upsert({ user_id: userId, data: loadPreferences(), updated_at: updatedAt }, { onConflict: 'user_id' })
  if (error) throw new SyncError(`No se pudieron subir las preferencias: ${error.message}`, error)
  await setMeta('preferences:dirty', false)
  await setMeta('preferences:updatedAt', updatedAt)
  return 1
}

/** La llaman los ajustes al guardar, para que el próximo sync las suba. */
export async function markPreferencesDirty(): Promise<void> {
  await setMeta('preferences:dirty', true)
}

// ------------------------------------------------------------ primer enlace

/**
 * Se ejecuta una sola vez por dispositivo, la primera vez que hay sesión.
 *
 * El caso que resuelve: esta notebook tiene meses de historial y el servidor
 * está vacío. Los registros creados antes de configurar el sync nunca pasaron
 * por la cola, así que hay que marcarlos para que suban. Pero si el servidor YA
 * tiene datos, este dispositivo es el que llega nuevo: no marca nada y
 * simplemente recibe. Así el orden en que se vinculan los dispositivos no
 * cambia el resultado.
 */
export async function linkDevice(client: SupabaseClient): Promise<{ adopted: boolean; queued: number }> {
  if (await getMeta<boolean>('sync:linked')) return { adopted: false, queued: 0 }

  const { count, error } = await client.from('exercises').select('id', { count: 'exact', head: true })
  if (error) throw new SyncError(`No se pudo consultar el estado del servidor: ${error.message}`, error)

  const serverEmpty = (count ?? 0) === 0
  const queued = serverEmpty ? await enqueueEverything() : 0
  if (serverEmpty) await markPreferencesDirty()

  await setMeta('sync:linked', true)
  return { adopted: !serverEmpty, queued }
}

// ---------------------------------------------------------------- orquestado

let running: Promise<SyncResult> | null = null

/** Un sync completo: bajar, subir, y volver a dejar el cursor listo.
 *  Si ya hay uno en curso devuelve el mismo, para que varias pestañas o un
 *  reintento por reconexión no se pisen entre sí. */
export function syncNow(client: SupabaseClient, userId: string): Promise<SyncResult> {
  if (running) return running
  running = run(client, userId).finally(() => {
    running = null
  })
  return running
}

async function run(client: SupabaseClient, userId: string): Promise<SyncResult> {
  const queue = await listSyncQueue()
  const dirtyByStore = new Map<SyncableStore, Set<string>>()
  for (const entry of queue) {
    const set = dirtyByStore.get(entry.store) ?? new Set<string>()
    set.add(entry.key)
    dirtyByStore.set(entry.store, set)
  }

  // Bajar primero: así lo que se sube después ya sale ganando contra lo que
  // acabamos de leer, y el resultado no depende del orden de los dispositivos.
  let pulled = 0
  for (const store of SYNCABLE_STORES) {
    pulled += await pullStore(client, store, dirtyByStore.get(store) ?? new Set())
  }
  pulled += await pullPreferences(client)

  let pushed = await pushQueue(client, userId, queue)
  pushed += await pushPreferences(client, userId)

  // Solo si algo cambió: un aviso en cada tick vacío recargaría las pantallas
  // cada 20 segundos sin motivo.
  if (pulled > 0) notifyDataPulled()

  const at = new Date().toISOString()
  await setMeta('sync:lastRunAt', at)
  return { pulled, pushed, at }
}

export async function getLastSyncAt(): Promise<string | null> {
  return (await getMeta<string>('sync:lastRunAt')) ?? null
}

export async function countPending(): Promise<number> {
  return (await listSyncQueue()).length
}

/** Cuántos registros hay guardados localmente, para avisar antes de vincular. */
export async function countLocalRecords(): Promise<number> {
  let total = 0
  for (const store of SYNCABLE_STORES) {
    total += (await getAll(store)).length
  }
  return total
}
