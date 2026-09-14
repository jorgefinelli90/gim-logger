'use client'

/**
 * Minimal, hand-rolled IndexedDB wrapper. No external dependency (idb, etc.)
 * — the app only needs a handful of object stores with simple key/index
 * lookups, so a thin promisified layer over the native API is enough and
 * keeps the bundle smaller.
 */

export const DB_NAME = 'iron-log'
export const DB_VERSION = 1

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

interface StoreConfig {
  name: StoreName
  keyPath: string
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
  { name: 'notes', keyPath: 'id', indexes: [{ name: 'byDate', keyPath: 'date', unique: true }] },
  { name: 'bodyMetrics', keyPath: 'id', indexes: [{ name: 'byDate', keyPath: 'date' }] },
  { name: 'records', keyPath: 'id', indexes: [{ name: 'byExerciseId', keyPath: 'exerciseId' }] },
  { name: 'catalogCache', keyPath: 'muscle' },
  { name: 'meta', keyPath: 'key' },
]

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

    request.onupgradeneeded = () => {
      const db = request.result
      for (const config of STORE_CONFIGS) {
        const store = db.objectStoreNames.contains(config.name)
          ? request.transaction!.objectStore(config.name)
          : db.createObjectStore(config.name, { keyPath: config.keyPath })
        for (const index of config.indexes ?? []) {
          if (!store.indexNames.contains(index.name)) {
            store.createIndex(index.name, index.keyPath, { unique: index.unique ?? false })
          }
        }
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

export async function putOne<T>(store: StoreName, value: T): Promise<void> {
  const db = await openDatabase()
  const tx = db.transaction(store, 'readwrite')
  await wrapRequest(tx.objectStore(store).put(value), `No se pudo guardar el registro en "${store}".`)
}

export async function putMany<T>(store: StoreName, values: T[]): Promise<void> {
  if (values.length === 0) return
  const db = await openDatabase()
  const tx = db.transaction(store, 'readwrite')
  const objectStore = tx.objectStore(store)
  await Promise.all(values.map((value) => wrapRequest(objectStore.put(value), `No se pudo guardar un registro en "${store}".`)))
}

export async function deleteOne(store: StoreName, key: IDBValidKey): Promise<void> {
  const db = await openDatabase()
  const tx = db.transaction(store, 'readwrite')
  await wrapRequest(tx.objectStore(store).delete(key), `No se pudo eliminar el registro de "${store}".`)
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
