/**
 * Tolerant text normalization for matching exercise names across sources
 * (user routine, ExerciseGymGifsDB catalog, custom user input) that differ
 * in accents, casing, hyphenation and spacing.
 */
export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip accents
    .toLowerCase()
    .replace(/[/\-_]+/g, ' ')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const STOPWORDS = new Set([
  'con', 'en', 'de', 'del', 'la', 'el', 'los', 'las', 'y', 'o', 'a', 'un', 'una',
  'para', 'por', 'al', 'sobre',
])

export function tokenize(value: string): string[] {
  return normalizeText(value)
    .split(' ')
    .filter((token) => token.length > 0 && !STOPWORDS.has(token))
}
