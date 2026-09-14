import { DEFAULT_PREFERENCES, type UserPreferences } from '@/types'

const STORAGE_KEY = 'iron-log:preferences'

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

/** Merges stored data with defaults so new fields introduced later never crash old data. */
function sanitize(raw: unknown): UserPreferences {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_PREFERENCES }
  return { ...DEFAULT_PREFERENCES, ...(raw as Partial<UserPreferences>) }
}

export function loadPreferences(): UserPreferences {
  if (!isBrowser()) return { ...DEFAULT_PREFERENCES }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_PREFERENCES }
    return sanitize(JSON.parse(raw))
  } catch {
    // Corrupted JSON: fall back to defaults rather than crashing the app.
    return { ...DEFAULT_PREFERENCES }
  }
}

export function savePreferences(preferences: UserPreferences): boolean {
  if (!isBrowser()) return false
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
    return true
  } catch {
    return false
  }
}

export function updatePreferences(patch: Partial<UserPreferences>): UserPreferences {
  const next = { ...loadPreferences(), ...patch }
  savePreferences(next)
  return next
}
