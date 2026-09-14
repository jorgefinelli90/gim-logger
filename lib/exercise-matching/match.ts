import { normalizeText, tokenize } from './normalize'

export interface MatchCandidate {
  id: string
  name: string
  aliases?: string[]
}

export interface MatchResult<T extends MatchCandidate> {
  candidate: T
  score: number
}

/** Sorensen-Dice coefficient over normalized word tokens. */
function tokenScore(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0
  const setA = new Set(a)
  const setB = new Set(b)
  let shared = 0
  for (const token of setA) if (setB.has(token)) shared += 1
  return (2 * shared) / (setA.size + setB.size)
}

function bestNameScore(query: string, candidateNames: string[]): number {
  const queryTokens = tokenize(query)
  const normalizedQuery = normalizeText(query)
  let best = 0
  for (const name of candidateNames) {
    const nameTokens = tokenize(name)
    let score = tokenScore(queryTokens, nameTokens)
    const normalizedName = normalizeText(name)
    if (normalizedName === normalizedQuery) score = 1
    else if (normalizedName.includes(normalizedQuery) || normalizedQuery.includes(normalizedName)) {
      score = Math.max(score, 0.85)
    }
    if (score > best) best = score
  }
  return best
}

/**
 * Tolerant search: ranks candidates by how well their name/aliases match
 * `query`, regardless of accents, casing, hyphens or word order.
 */
export function searchExercises<T extends MatchCandidate>(
  query: string,
  candidates: T[],
  options: { limit?: number; minScore?: number } = {},
): MatchResult<T>[] {
  const { limit = 10, minScore = 0.2 } = options
  const results: MatchResult<T>[] = []
  for (const candidate of candidates) {
    const names = [candidate.name, ...(candidate.aliases ?? [])]
    const score = bestNameScore(query, names)
    if (score >= minScore) results.push({ candidate, score })
  }
  results.sort((a, b) => b.score - a.score)
  return results.slice(0, limit)
}

/** Returns the single best match, or null if nothing clears minScore. */
export function findBestMatch<T extends MatchCandidate>(
  query: string,
  candidates: T[],
  minScore = 0.4,
): T | null {
  const [top] = searchExercises(query, candidates, { limit: 1, minScore })
  return top ? top.candidate : null
}
