'use client'

/**
 * Minimal, hand-rolled IndexedDB wrapper. No external dependency (idb, etc.)
 * — the app only needs a handful of object stores with simple key/index
 * lookups, so a thin promisified layer over the native API is enough and
 * keeps the bundle smaller.
 */

export const DB_NAME = 'iron-log'
/**
 * v2 agregó `syncQueue` para el sincronizado con Supabase.
 * v3 agrega el concepto de perfil (Jorge / Sebastián): cada registro
 * sincronizable gana un campo `profile`, y el índice `notes.byDate` deja de
 * ser único porque ahora dos perfiles pueden tener cada uno su nota el mismo
 * día. Ver `migrateToV3` más abajo.
 */
export const DB_VERSION = 3

export type StoreName =
  | 'exercises'
  | 'plans'
  | 'sessions'
  | 'sets'
  | 'notes'
  | 'bodyMetrics'
  | 'records'
  | 'catalogCache'
  | 'meta'
  | 'syncQueue'

/**
 * Los stores que viajan a Supabase. Quedan afuera a propósito:
 *  - `catalogCache`: son GIFs del CDN, se vuelven a bajar solos y ocuparían
 *    espacio remoto sin aportar nada (además el pedido fue no guardar imágenes).
 *  - `meta` y `syncQueue`: contabilidad de ESTE dispositivo.
 */
export const SYNCABLE_STORES = [
  'exercises',
  'plans',
  'sessions',
  'sets',
  'notes',
  'bodyMetrics',
  'records',
] as const

export type SyncableStore = (typeof SYNCABLE_STORES)[number]

function isSyncable(store: StoreName): store is SyncableStore {
  return (SYNCABLE_STORES as readonly string[]).includes(store)
}

/** Una entrada por registro tocado desde el último push exitoso. */
export interface SyncQueueEntry {
  store: SyncableStore
  key: string
  op: 'put' | 'delete'
  queuedAt: string
}

interface StoreConfig {
  name: StoreName
  /** Un array es una clave compuesta (la usa `syncQueue`: store + id). */
  keyPath: string | string[]
  indexes?: { name: string; keyPath: string; unique?: boolean }[]
}

const STORE_CONFIGS: StoreConfig[] = [
  { name: 'exercises', keyPath: 'id' },
  { name: 'plans', keyPath: 'id' },
  { name: 'sessions', keyPath: 'id', indexes: [{ name: 'byDate', keyPath: 'date' }] },
  {
    name: 'sets',
    keyPath: 'id',
    indexes: [
      { name: 'bySessionId', keyPath: 'sessionId' },
      { name: 'byExerciseId', keyPath: 'exerciseId' },
    ],
  },
  // No unique desde v3: dos perfiles pueden tener cada uno su nota la misma fecha.
  { name: 'notes', keyPath: 'id', indexes: [{ name: 'byDate', keyPath: 'date', unique: false }] },
  { name: 'bodyMetrics', keyPath: 'id', indexes: [{ name: 'byDate', keyPath: 'date' }] },
  { name: 'records', keyPath: 'id', indexes: [{ name: 'byExerciseId', keyPath: 'exerciseId' }] },
  { name: 'catalogCache', keyPath: 'muscle' },
  { name: 'meta', keyPath: 'key' },
  // Clave compuesta: tocar dos veces el mismo registro antes de subir deja una
  // sola entrada, que es justo lo que se quiere (se sube el estado final).
  { name: 'syncQueue', keyPath: ['store', 'key'] },
]

/**
 * Migración a v3: todo lo que ya existía en el dispositivo es de Jorge (era
 * el único usuario), así que se etiqueta `profile: 'jorge'` sin preguntar.
 * También recrea `notes.byDate` sin la restricción `unique`, que dejó de ser
 * válida en cuanto dos perfiles pueden anotar el mismo día.
 *
 * Corre dentro de la misma transacción `versionchange` que crea los stores e
 * índices nuevos — si algo de esto fallara, toda la migración se revierte
 * junto con el resto, no queda el dispositivo a mitad de camino.
 */
function migrateToV3(tx: IDBTransaction): void {
  const notesStore = tx.objectStore('notes')
  if (notesStore.indexNames.contains('byDate')) notesStore.deleteIndex('byDate')
  notesStore.createIndex('byDate', 'date', { unique: false })

  const backfillProfile: StoreName[] = ['exercises', 'plans', 'sessions', 'sets', 'notes', 'bodyMetrics', 'records']
  for (const name of backfillProfile) {
    const store = tx.objectStore(name)
    store.openCursor().onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result
      if (!cursor) return
      const record = cursor.value as Record<string, unknown>
      let changed = false
      if (record.profile == null) {
        record.profile = 'jorge'
        changed = true
      }
      // Los planes de Jorge ya guardados no tenían `dayId` (antes el propio
      // `id` cumplía ese rol) ni una sesión "primaria" explícita.
      if (name === 'plans' && record.dayId == null) {
        record.dayId = record.id
        changed = true
      }
      if (name === 'sessions' && record.isPrimaryForDate == null) {
        record.isPrimaryForDate = true
        changed = true
      }
      if (changed) cursor.update(record)
      cursor.continue()
    }
  }
}

export class StorageError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message)
    this.name = 'StorageError'
  }
}

let dbPromise: Promise<IDBDatabase> | null = null

function isIndexedDbAvailable(): boolean {
  return typeof window !== 'undefined' && 'indexedDB' in window
}

export function openDatabase(): Promise<IDBDatabase> {
  if (!isIndexedDbAvailable()) {
    return Promise.reject(new StorageError('IndexedDB no está disponible en este navegador.'))
  }
  if (dbPromise) return dbPromise

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = request.result
      const tx = request.transaction!
      for (const config of STORE_CONFIGS) {
        const store = db.objectStoreNames.contains(config.name)
          ? tx.objectStore(config.name)
          : db.createObjectStore(config.name, { keyPath: config.keyPath })
        for (const index of config.indexes ?? []) {
          if (!store.indexNames.contains(index.name)) {
            store.createIndex(index.name, index.keyPath, { unique: index.unique ?? false })
          }
        }
      }

      if (event.oldVersion > 0 && event.oldVersion < 3) {
        migrateToV3(tx)
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => {
      dbPromise = null
      reject(new StorageError('No se pudo abrir la base de datos local.', request.error))
    }
    request.onblocked = () => {
      reject(new StorageError('La base de datos está bloqueada por otra pestaña abierta.'))
    }
  })

  return dbPromise
}

function wrapRequest<T>(request: IDBRequest<T>, errorMessage: string): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(new StorageError(errorMessage, request.error))
  })
}

export async function getAll<T>(store: StoreName): Promise<T[]> {
  const db = await openDatabase()
  const tx = db.transaction(store, 'readonly')
  return wrapRequest(tx.objectStore(store).getAll() as IDBRequest<T[]>, `No se pudieron leer los datos de "${store}".`)
}

export async function getByIndex<T>(store: StoreName, indexName: string, value: IDBValidKey): Promise<T[]> {
  const db = await openDatabase()
  const tx = db.transaction(store, 'readonly')
  const index = tx.objectStore(store).index(indexName)
  return wrapRequest(index.getAll(value) as IDBRequest<T[]>, `No se pudieron leer los datos de "${store}" por índice.`)
}

export async function getOne<T>(store: StoreName, key: IDBValidKey): Promise<T | undefined> {
  const db = await openDatabase()
  const tx = db.transaction(store, 'readonly')
  return wrapRequest(tx.objectStore(store).get(key) as IDBRequest<T | undefined>, `No se pudo leer el registro de "${store}".`)
}

/**
 * Escritura local + anotación del cambio en la misma transacción.
 *
 * Que sea UNA transacción es el punto: si se separaran, un cierre de pestaña
 * en el medio podría dejar una serie guardada que nunca se entera de que tiene
 * que subir, y ese dato se perdería en silencio al cambiar de dispositivo.
 *
 * `track: false` es la puerta de entrada del sync al bajar datos del servidor;
 * sin eso, aplicar lo que acabamos de recibir lo volvería a encolar para subir.
 */
async function write(
  store: StoreName,
  run: (objectStore: IDBObjectStore) => Promise<void>,
  queued: { key: string; op: 'put' | 'delete' }[],
  track: boolean,
): Promise<void> {
  const db = await openDatabase()
  const shouldQueue = track && isSyncable(store) && queued.length > 0
  const tx = db.transaction(shouldQueue ? [store, 'syncQueue'] : store, 'readwrite')

  // Todas las peticiones se lanzan en este mismo tick y recién después se
  // espera por ellas. Una transacción de IndexedDB se cierra sola en cuanto
  // no le quedan peticiones pendientes, así que encolar DESPUÉS de un `await`
  // puede encontrarla ya cerrada (TransactionInactiveError) según el navegador.
  const pending: Promise<unknown>[] = [run(tx.objectStore(store))]

  if (shouldQueue) {
    const queue = tx.objectStore('syncQueue')
    const queuedAt = new Date().toISOString()
    for (const entry of queued) {
      pending.push(
        wrapRequest(
          queue.put({ store, key: entry.key, op: entry.op, queuedAt } satisfies SyncQueueEntry),
          'No se pudo registrar el cambio para sincronizar.',
        ),
      )
    }
  }

  await Promise.all(pending)
}

function keyOf(value: unknown): string {
  return String((value as { id?: unknown })?.id ?? '')
}

export async function putOne<T>(store: StoreName, value: T, track = true): Promise<void> {
  await write(
    store,
    async (objectStore) => {
      await wrapRequest(objectStore.put(value), `No se pudo guardar el registro en "${store}".`)
    },
    [{ key: keyOf(value), op: 'put' }],
    track,
  )
}

export async function putMany<T>(store: StoreName, values: T[], track = true): Promise<void> {
  if (values.length === 0) return
  await write(
    store,
    async (objectStore) => {
      await Promise.all(
        values.map((value) => wrapRequest(objectStore.put(value), `No se pudo guardar un registro en "${store}".`)),
      )
    },
    values.map((value) => ({ key: keyOf(value), op: 'put' as const })),
    track,
  )
}

export async function deleteOne(store: StoreName, key: IDBValidKey, track = true): Promise<void> {
  await write(
    store,
    async (objectStore) => {
      await wrapRequest(objectStore.delete(key), `No se pudo eliminar el registro de "${store}".`)
    },
    [{ key: String(key), op: 'delete' }],
    track,
  )
}

// ------------------------------------------------------------------ syncQueue

export async function listSyncQueue(): Promise<SyncQueueEntry[]> {
  return getAll<SyncQueueEntry>('syncQueue')
}

export async function clearSyncEntries(entries: { store: SyncableStore; key: string }[]): Promise<void> {
  if (entries.length === 0) return
  const db = await openDatabase()
  const tx = db.transaction('syncQueue', 'readwrite')
  const objectStore = tx.objectStore('syncQueue')
  await Promise.all(
    entries.map((entry) =>
      wrapRequest(objectStore.delete([entry.store, entry.key]), 'No se pudo limpiar la cola de sincronización.'),
    ),
  )
}

/** Marca todo lo que ya existe localmente como pendiente de subir. Se usa la
 *  primera vez que se activa el sync, para que el historial previo al login no
 *  se quede varado en este dispositivo. */
export async function enqueueEverything(): Promise<number> {
  let total = 0
  for (const store of SYNCABLE_STORES) {
    const rows = await getAll<{ id?: string }>(store)
    const entries = rows.filter((row) => row.id).map((row) => ({ key: String(row.id), op: 'put' as const }))
    if (entries.length === 0) continue
    await write(store, async () => {}, entries, true)
    total += entries.length
  }
  return total
}

export async function clearStore(store: StoreName): Promise<void> {
  const db = await openDatabase()
  const tx = db.transaction(store, 'readwrite')
  await wrapRequest(tx.objectStore(store).clear(), `No se pudo vaciar "${store}".`)
}

export async function clearAllStores(): Promise<void> {
  for (const config of STORE_CONFIGS) {
    await clearStore(config.name)
  }
}

export const ALL_STORE_NAMES: StoreName[] = STORE_CONFIGS.map((c) => c.name)
