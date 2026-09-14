'use client'

import { getOne, putOne } from '@/lib/storage/db'
import { searchExercises, type MatchCandidate } from './match'

const CDN_BASE = 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0'
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 days — the catalog is versioned by tag, so it barely changes

export const CATALOG_MUSCLES = [
  { slug: 'pectorals', label: 'Pecho' },
  { slug: 'lats', label: 'Espalda (dorsales)' },
  { slug: 'upper-back', label: 'Espalda (media)' },
  { slug: 'traps', label: 'Trapecios' },
  { slug: 'delts', label: 'Hombros' },
  { slug: 'biceps', label: 'Bíceps' },
  { slug: 'triceps', label: 'Tríceps' },
  { slug: 'forearms', label: 'Antebrazos' },
  { slug: 'quads', label: 'Cuádriceps' },
  { slug: 'hamstrings', label: 'Isquiotibiales' },
  { slug: 'glutes', label: 'Glúteos' },
  { slug: 'calves', label: 'Pantorrillas' },
  { slug: 'abs', label: 'Abdominales' },
  { slug: 'adductors', label: 'Aductores' },
  { slug: 'abductors', label: 'Abductores' },
  { slug: 'spine', label: 'Espalda baja' },
  { slug: 'cardio', label: 'Cardio' },
] as const

export type CatalogMuscleSlug = (typeof CATALOG_MUSCLES)[number]['slug']

export interface CatalogItem extends MatchCandidate {
  slug: string
  muscle: string
  equipment: string
  bodyPart: string
  instructions: string[]
  gifUrl: string
  thumbUrl: string
}

interface CacheRecord {
  muscle: string
  fetchedAt: number
  items: CatalogItem[]
}

function toCatalogItem(raw: { slug: string; name: string; muscle: string; equipment: string; bodyPart: string; instructions: string[]; file: string }): CatalogItem {
  return {
    id: raw.slug,
    slug: raw.slug,
    name: raw.name,
    muscle: raw.muscle,
    equipment: raw.equipment,
    bodyPart: raw.bodyPart,
    instructions: raw.instructions,
    gifUrl: `${CDN_BASE}/${raw.file}`,
    thumbUrl: `${CDN_BASE}/${raw.file.replace(/\.gif$/, '.thumb.webp')}`,
  }
}

/**
 * Fetches (and caches in IndexedDB, ~150KB per group) the exercise list for
 * one muscle group from ExerciseGymGifsDB — used only when the user searches
 * for an image for a new/edited exercise. Never fetches the full 1.3MB
 * catalog. Returns an empty list on network failure so callers can fall back
 * to the empty state + custom URL field.
 */
export async function loadCatalogMuscle(muscle: CatalogMuscleSlug): Promise<CatalogItem[]> {
  try {
    const cached = await getOne<CacheRecord>('catalogCache', muscle)
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) return cached.items

    const res = await fetch(`${CDN_BASE}/api/es/muscles/${muscle}.json`)
    if (!res.ok) return cached?.items ?? []
    const data = await res.json()
    const items: CatalogItem[] = (data.exercises ?? []).map(toCatalogItem)

    await putOne<CacheRecord>('catalogCache', { muscle, fetchedAt: Date.now(), items })
    return items
  } catch {
    return []
  }
}

export async function searchCatalogMuscle(muscle: CatalogMuscleSlug, query: string): Promise<CatalogItem[]> {
  const items = await loadCatalogMuscle(muscle)
  if (!query.trim()) return items.slice(0, 20)
  return searchExercises(query, items, { limit: 20 }).map((r) => r.candidate)
}
