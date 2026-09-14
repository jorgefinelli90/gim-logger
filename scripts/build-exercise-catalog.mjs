#!/usr/bin/env node
/**
 * Matches the real routine exercises (data/generated/routine.json) plus the
 * seed calisthenics list against the ExerciseGymGifsDB catalog
 * (github.com/JahelCuadrado/ExerciseGymGifsDB) and writes a curated mapping
 * with resolved GIF URLs (served from jsDelivr, never downloaded into this
 * repo) to data/generated/exercise-catalog.json.
 *
 * Matching is tolerant (accents/case/hyphens/word order) but every automatic
 * pick was manually reviewed against the real catalog — see OVERRIDES below
 * for the handful of cases where the top fuzzy match was wrong and a better
 * slug was chosen by hand. Nothing here is invented: if no reasonable match
 * exists, gifUrl stays null and the app shows the empty state.
 *
 * Usage:
 *   node scripts/build-exercise-catalog.mjs --source <path-to-local-clone>
 *   node scripts/build-exercise-catalog.mjs   # fetches from jsDelivr
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const ROUTINE_FILE = path.join(ROOT, 'data', 'generated', 'routine.json')
const OUT_FILE = path.join(ROOT, 'data', 'generated', 'exercise-catalog.json')
const CDN_BASE = 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0'

const sourceArgIndex = process.argv.indexOf('--source')
const localSource = sourceArgIndex >= 0 ? process.argv[sourceArgIndex + 1] : null

function normalize(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[/\-_]+/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const STOP = new Set(['con', 'en', 'de', 'del', 'la', 'el', 'los', 'las', 'y', 'o', 'a', 'un', 'una', 'para', 'por', 'al', 'sobre'])

function tokenize(value) {
  return normalize(value).split(' ').filter((t) => t && !STOP.has(t))
}

function diceScore(a, b) {
  const setA = new Set(tokenize(a))
  const setB = new Set(tokenize(b))
  if (setA.size === 0 || setB.size === 0) return 0
  let shared = 0
  for (const token of setA) if (setB.has(token)) shared += 1
  return (2 * shared) / (setA.size + setB.size)
}

/**
 * Manual corrections applied on top of the automatic fuzzy match, verified
 * by hand against the real ExerciseGymGifsDB catalog (see project plan /
 * memory for how this was validated). Key = our exercise id or seed key.
 */
const OVERRIDES = {
  'g1-0': 'lever-incline-chest-press', // "Press superior con barra en máquina" -> incline chest press machine
  'g1-1': 'lever-chest-press', // "Press plano en máquina" -> flat chest press machine
  'g1-2': 'chest-dip', // "Fondos en paralelas / máquina"
  'g1-3': 'cable-overhead-triceps-extension-rope-attachment', // "...sobre la cabeza con soga"
  'g1-4': 'cable-pushdown', // "...con barra recta" (standard bar pushdown)
  'g1-5': 'cable-pushdown-with-rope-attachment', // "...con soga (agarre neutro)"
  'g1-6': 'barbell-wrist-curl',
  'g1-7': 'cable-standing-back-wrist-curl', // "...con polea por detrás"
  'g2-0': 'cable-pulldown', // "Jalón al pecho en polea"
  'g2-1': 'cable-low-seated-row', // "Remo en máquina o polea baja"
  'g2-2': 'cable-straight-arm-pulldown', // "Pullover en polea alta" (equivalent high-pulley straight-arm movement)
  'g2-3': 'ez-barbell-curl', // "Curl con barra Z o recta"
  'g2-4': 'dumbbell-hammer-curl',
  'g2-5': 'cable-curl',
  'g2-6': 'lever-military-press', // "Press militar con mancuernas o máquina" -> machine variant
  'g2-7': 'dumbbell-lateral-raise',
  'g2-8': 'dumbbell-front-raise',
  'g3-0': 'sled-45-leg-press', // "Prensa de pierna inclinada" -> 45° sled leg press
  'g3-1': 'lever-leg-extension',
  'g3-2': 'lever-seated-leg-curl', // "Curl femoral acostado o sentado" -> seated variant
  'g3-3': 'dumbbell-romanian-deadlift',
  'g3-4': 'lever-standing-calf-raise',
  'g3-5': 'crunch-floor', // "Crunch abdominal en máquina o suelo" -> floor variant
  'g3-6': 'hanging-leg-raise',
  'calistenia-flexiones': 'push-up',
  'calistenia-dominadas': 'pull-up', // the "remo invertido" half is offered as a text alternative, not a second image
}

/**
 * Exercises with no honest equivalent in the catalog (every candidate found
 * added a qualifier the prescribed exercise doesn't have, e.g. only
 * "jump squat"/"sissy squat" variants exist, no plain bodyweight squat).
 * Forced to null instead of a misleading match — the app shows its empty
 * state + custom URL field for these, as required.
 */
const FORCE_NO_MATCH = new Set(['calistenia-sentadillas', 'calistenia-plancha'])

const CALISTHENICS_SEED = [
  { key: 'calistenia-flexiones', name: 'Flexiones', muscleGroup: 'pecho' },
  { key: 'calistenia-dominadas', name: 'Dominadas o remo invertido', muscleGroup: 'espalda' },
  { key: 'calistenia-sentadillas', name: 'Sentadillas con peso corporal', muscleGroup: 'piernas' },
  { key: 'calistenia-plancha', name: 'Plancha frontal', muscleGroup: 'abdominales' },
]

async function loadCatalog() {
  let data
  if (localSource) {
    const file = path.join(localSource, 'api', 'es', 'exercises.json')
    if (!existsSync(file)) throw new Error(`No existe ${file}`)
    data = JSON.parse(readFileSync(file, 'utf-8'))
  } else {
    const res = await fetch(`${CDN_BASE}/api/es/exercises.json`)
    if (!res.ok) throw new Error(`No se pudo descargar el catálogo: HTTP ${res.status}`)
    data = await res.json()
  }
  return Array.isArray(data) ? data : data.exercises
}

function findBySlug(catalog, slug) {
  return catalog.find((item) => item.slug === slug) ?? null
}

function bestFuzzyMatch(catalog, name) {
  let best = null
  let bestScore = 0
  for (const item of catalog) {
    const score = diceScore(name, item.name)
    if (score > bestScore) {
      bestScore = score
      best = item
    }
  }
  return { item: best, score: bestScore }
}

function toCatalogEntry(exerciseKey, name, muscleGroupRaw, catalog) {
  if (FORCE_NO_MATCH.has(exerciseKey)) {
    return {
      key: exerciseKey,
      name,
      muscleGroupRaw,
      matched: false,
      matchMethod: 'none-honest',
      matchScore: 0,
      catalogSlug: null,
      catalogName: null,
      muscle: null,
      equipment: null,
      bodyPart: null,
      instructions: [],
      gifUrl: null,
      thumbUrl: null,
    }
  }

  const overrideSlug = OVERRIDES[exerciseKey]
  let match = overrideSlug ? findBySlug(catalog, overrideSlug) : null
  let score = match ? 1 : 0
  let method = 'override'

  if (!match) {
    const fuzzy = bestFuzzyMatch(catalog, name)
    match = fuzzy.item
    score = fuzzy.score
    method = 'fuzzy'
  }

  if (!match || score < 0.3) {
    return {
      key: exerciseKey,
      name,
      muscleGroupRaw,
      matched: false,
      matchMethod: null,
      matchScore: 0,
      catalogSlug: null,
      catalogName: null,
      muscle: null,
      equipment: null,
      bodyPart: null,
      instructions: [],
      gifUrl: null,
      thumbUrl: null,
    }
  }

  return {
    key: exerciseKey,
    name,
    muscleGroupRaw,
    matched: true,
    matchMethod: method,
    matchScore: Number(score.toFixed(3)),
    catalogSlug: match.slug,
    catalogName: match.name,
    muscle: match.muscle,
    equipment: match.equipment,
    bodyPart: match.bodyPart,
    instructions: match.instructions ?? [],
    // Built from our own pinned CDN_BASE + the file's repo-relative path,
    // rather than trusting the embedded gifUrl (which reflects whatever ref
    // the source repo last built its /api JSON against, e.g. "@main").
    gifUrl: match.file ? `${CDN_BASE}/${match.file}` : match.gifUrl,
    thumbUrl: match.file ? `${CDN_BASE}/${match.file.replace(/\.gif$/, '.thumb.webp')}` : null,
  }
}

async function main() {
  if (!existsSync(ROUTINE_FILE)) {
    console.error('Falta data/generated/routine.json. Corre primero scripts/parse-routine.mjs')
    process.exit(1)
  }
  const routine = JSON.parse(readFileSync(ROUTINE_FILE, 'utf-8'))
  const catalog = await loadCatalog()
  console.log(`Catálogo cargado: ${catalog.length} ejercicios (${localSource ? 'local' : 'jsDelivr'})`)

  const entries = []
  for (const day of routine.days) {
    for (const exercise of day.exercises) {
      const key = exercise.id.split('-').slice(0, 2).join('-') // e.g. "g1-2"
      entries.push(toCatalogEntry(key, exercise.name, exercise.muscleGroupRaw, catalog))
    }
  }
  for (const seed of CALISTHENICS_SEED) {
    entries.push(toCatalogEntry(seed.key, seed.name, seed.muscleGroup, catalog))
  }

  const unmatched = entries.filter((e) => !e.matched)
  const lowConfidence = entries.filter((e) => e.matched && e.matchMethod === 'fuzzy' && e.matchScore < 0.6)

  console.log('\n=== Resultado del matching ===')
  for (const e of entries) {
    const flag = !e.matched ? ' NO MATCH' : e.matchMethod === 'fuzzy' && e.matchScore < 0.6 ? ' REVISAR' : ''
    console.log(`${e.key.padEnd(24)} ${e.name.padEnd(48)} -> ${(e.catalogSlug ?? '(ninguno)').padEnd(40)} [${e.matchMethod ?? '-'} ${e.matchScore}]${flag}`)
  }
  console.log(`\nTotal: ${entries.length} | sin match: ${unmatched.length} | baja confianza (fuzzy<0.6): ${lowConfidence.length}`)

  const output = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    cdnBase: CDN_BASE,
    entries,
  }
  writeFileSync(OUT_FILE, JSON.stringify(output, null, 2) + '\n', 'utf-8')
  console.log(`\nEscrito -> ${path.relative(ROOT, OUT_FILE)}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
