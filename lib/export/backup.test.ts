import { describe, expect, it } from 'vitest'
import { validateBackupPayload, BACKUP_SCHEMA_VERSION } from './backup'
import { DEFAULT_PREFERENCES } from '@/types'

function validPayload() {
  return {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: '2026-01-01T00:00:00.000Z',
    preferences: DEFAULT_PREFERENCES,
    exercises: [{ id: 'e1' }],
    plans: [{ id: 'gimnasio-dia-1' }],
    sessions: [],
    sets: [],
    notes: [],
    bodyMetrics: [],
    records: [],
  }
}

describe('validateBackupPayload', () => {
  it('accepts a well-formed backup', () => {
    const result = validateBackupPayload(validPayload())
    expect(result.valid).toBe(true)
  })

  it('rejects a non-object payload', () => {
    expect(validateBackupPayload(null).valid).toBe(false)
    expect(validateBackupPayload('hello').valid).toBe(false)
  })

  it('rejects a payload missing schemaVersion', () => {
    const payload = validPayload() as Record<string, unknown>
    delete payload.schemaVersion
    const result = validateBackupPayload(payload)
    expect(result.valid).toBe(false)
  })

  it('rejects a collection that is not an array of records with id', () => {
    const payload = { ...validPayload(), exercises: [{ noId: true }] }
    const result = validateBackupPayload(payload)
    expect(result.valid).toBe(false)
    if (!result.valid) expect(result.error).toMatch(/exercises/)
  })

  it('rejects a collection that is a plain object instead of an array', () => {
    const payload = { ...validPayload(), sessions: { id: 'oops' } }
    expect(validateBackupPayload(payload).valid).toBe(false)
  })
})
