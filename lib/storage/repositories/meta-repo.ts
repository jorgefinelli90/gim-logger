import { getOne, putOne } from '../db'

interface MetaRecord {
  key: string
  value: unknown
}

export async function getMeta<T>(key: string): Promise<T | undefined> {
  const record = await getOne<MetaRecord>('meta', key)
  return record?.value as T | undefined
}

export async function setMeta(key: string, value: unknown): Promise<void> {
  await putOne<MetaRecord>('meta', { key, value })
}
