#!/usr/bin/env node
/**
 * Matches the real routine exercises (one routine JSON per profile, produced
 * by parse-routine.mjs) plus the seed calisthenics list against the
 * ExerciseGymGifsDB catalog (github.com/JahelCuadrado/ExerciseGymGifsDB) and
 * writes a curated mapping with resolved GIF URLs (served from jsDelivr,
 * never downloaded into this repo) to data/generated/exercise-catalog.json.
 *
 * Matching is tolerant (accents/case/hyphens/word order) but every automatic
 * pick was manually reviewed against the real catalog — see OVERRIDES below
 * for the handful of cases where the top fuzzy match was wrong and a better
 * slug was chosen by hand. Nothing here is invented: if no reasonable match
 * exists, gifUrl stays null and the app shows the empty state.
 *
 * Entries are keyed by the exercise's FULL id (not a truncated day/index
 * prefix): with two independent routines both generating ids shaped
 * "g1-0-..." for their own día 1 / ejercicio 0, a truncated key would collide
 * between profiles. The full id is already unique by construction (Sebas's
 * ids carry a "sebas-" prefix, Jorge's don't — see parse-routine.mjs).
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
const ROUTINE_FILES = [path.join(ROOT, 'data', 'generated', 'routine.json'), path.join(ROOT, 'data', 'generated', 'routine-sebas.json')]
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
 * memory for how this was validated). Key = exercise id completo, o la key
 * del seed de calistenia.
 */
const OVERRIDES = {
  // --- Jorge: gimnasio (verificado al construir la app) ---
  'g1-0-pecho-press-superior-con-barra-en-maquina': 'lever-incline-chest-press',
  'g1-1-pecho-press-plano-en-maquina': 'lever-chest-press',
  'g1-2-pecho-fondos-en-paralelas-maquina': 'chest-dip',
  'g1-3-tricpes-extension-de-triceps-sobre-la-cabeza-con-soga': 'cable-overhead-triceps-extension-rope-attachment',
  'g1-4-tricpes-extension-de-triceps-con-barra-recta': 'cable-pushdown',
  'g1-5-tricpes-extension-de-triceps-con-soga-agarre-neutro': 'cable-pushdown-with-rope-attachment',
  'g1-6-antebrazos-curl-de-muneca-en-supinacion-con-barra-recta': 'barbell-wrist-curl',
  'g1-7-antebrazos-flexion-de-muneca-con-polea-por-detras': 'cable-standing-back-wrist-curl',
  'g2-0-espalda-jalon-al-pecho-en-polea': 'cable-pulldown',
  'g2-1-espalda-remo-en-maquina-o-polea-baja': 'cable-low-seated-row',
  'g2-2-espalda-pullover-en-polea-alta': 'cable-straight-arm-pulldown',
  'g2-3-biceps-curl-con-barra-z-o-recta': 'ez-barbell-curl',
  'g2-4-biceps-curl-martillo-con-mancuernas': 'dumbbell-hammer-curl',
  'g2-5-biceps-curl-en-polea-baja': 'cable-curl',
  'g2-6-hombros-press-militar-con-mancuernas-o-maquina': 'lever-military-press',
  'g2-7-hombros-elevaciones-laterales-con-mancuernas-polea': 'dumbbell-lateral-raise',
  'g2-8-hombros-elevaciones-frontales-con-mancuernas-polea': 'dumbbell-front-raise',
  'g3-0-piernas-prensa-de-pierna-inclinada': 'sled-45-leg-press',
  'g3-1-piernas-extensiones-de-cuadriceps-en-maquina': 'lever-leg-extension',
  'g3-2-piernas-curl-femoral-acostado-o-sentado': 'lever-seated-leg-curl',
  'g3-3-piernas-peso-muerto-rumano-con-mancuernas-barra': 'dumbbell-romanian-deadlift',
  'g3-4-piernas-elevacion-de-talones-para-pantorrillas': 'lever-standing-calf-raise',
  'g3-5-abdominales-crunch-abdominal-en-maquina-o-suelo': 'crunch-floor',
  'g3-6-abdominales-elevacion-de-piernas-colgado': 'hanging-leg-raise',
  'calistenia-flexiones': 'push-up',
  'calistenia-dominadas': 'pull-up', // the "remo invertido" half is offered as a text alternative, not a second image

  // --- Sebastián: gimnasio ---
  // Día 1-3 comparten casi todos los ejercicios con los de Jorge (mismo
  // programa base), pero el texto de Sebastián no siempre coincide palabra
  // por palabra (p.ej. dice explícitamente "SMITH") — se verificó cada uno
  // por separado en vez de asumir el mismo slug que Jorge.
  'sebas-g1-0-pecho-press-superior-con-barra-en-maquina-smith': 'smith-incline-bench-press', // dice "SMITH" explícito -> máquina Smith, no lever
  'sebas-g1-1-pecho-press-plano-en-maquina-smith': 'smith-bench-press',
  'sebas-g1-2-pecho-fondos-en-paralelas': 'chest-dip',
  'sebas-g1-3-tricpes-extension-de-triceps-sobre-la-cabeza-con-soga': 'cable-overhead-triceps-extension-rope-attachment',
  'sebas-g1-4-tricpes-extension-de-triceps-con-barra-recta': 'cable-pushdown',
  'sebas-g1-5-tricpes-extension-de-triceps-con-soga-agarre-neutro': 'cable-pushdown-with-rope-attachment',
  'sebas-g1-6-antebrazos-curl-de-muneca-en-supinacion-con-barra-recta': 'barbell-wrist-curl',
  'sebas-g1-7-antebrazos-flexion-de-muneca-con-polea-por-detras': 'cable-standing-back-wrist-curl',
  'sebas-g2-0-espalda-dominadas-en-barra-agarre-prono': 'pull-up', // agarre prono = dominada estándar
  'sebas-g2-1-espalda-dominadas-en-barra-agarre-supino': 'chin-up', // agarre supino = "dominada supina" en este catálogo
  'sebas-g2-2-espalda-jalon-al-pecho-en-polea': 'cable-pulldown',
  'sebas-g2-3-espalda-remo-en-maquina': 'lever-seated-row', // sin "o polea baja" -> máquina de palanca, no cable
  'sebas-g2-4-espalda-pullover-en-polea-alta': 'cable-straight-arm-pulldown',
  'sebas-g2-5-biceps-curl-con-barra-z-o-recta': 'ez-barbell-curl',
  'sebas-g2-6-biceps-curl-martillo-con-mancuernas': 'dumbbell-hammer-curl',
  'sebas-g2-7-biceps-curl-en-polea-baja': 'cable-curl',
  'sebas-g2-8-hombros-press-militar-con-mancuernas': 'dumbbell-seated-shoulder-press', // solo "con mancuernas", sin opción de máquina
  'sebas-g2-9-hombros-elevaciones-laterales-con-mancuernas': 'dumbbell-lateral-raise',
  'sebas-g2-10-abdominales-colgados-en-barra-piernas-en-l': 'hanging-straight-leg-raise', // "piernas en L" = piernas rectas
  'sebas-g3-0-piernas-prensa-de-pierna-inclinada': 'sled-45-leg-press',
  'sebas-g3-1-piernas-extensiones-de-cuadriceps-en-maquina': 'lever-leg-extension',
  'sebas-g3-2-piernas-curl-femoral-acostado-o-sentado': 'lever-seated-leg-curl',
  'sebas-g3-3-piernas-peso-muerto-rumano-con-mancuernas-barra': 'dumbbell-romanian-deadlift',
  'sebas-g3-4-piernas-elevacion-de-talones-para-pantorrillas': 'lever-standing-calf-raise',
  'sebas-g3-5-abdominales-crunch-abdominal-en-maquina': 'lever-seated-crunch', // "en máquina" explícito, sin "o suelo"
  'sebas-g3-6-abdominales-con-disco-de-un-costado-al-otro': 'weighted-russian-twist',
  'sebas-g4-0-bicpes-curl-con-mancuernas-sentados-en-banco-de-45': 'dumbbell-incline-curl',
  'sebas-g4-1-bicpes-curl-martillo-con-mancuernas-cruzada-al-pecho': 'dumbbell-cross-body-hammer-curl',
  'sebas-g4-2-tricpes-extension-de-triceps-con-soga-de-una-mano-a-la-vez': 'cable-standing-one-arm-triceps-extension',
  'sebas-g4-3-tricpes-extension-de-triceps-con-soga': 'cable-pushdown-with-rope-attachment',
  'sebas-g4-4-hombros-press-militar-con-maquina': 'lever-military-press',
  'sebas-g4-5-hombros-elevaciones-laterales-con-polea': 'cable-lateral-raise',
  'sebas-g4-7-trapecio-press-al-menton-con-polea-y-soga': 'cable-upright-row', // "press al mentón" es, biomecánicamente, un remo al mentón
  'sebas-g4-8-trapecio-press-militar-con-mancuernas-o-maquina': 'lever-military-press',
}

/**
 * Exercises with no honest equivalent in the catalog (every candidate found
 * added a qualifier the prescribed exercise doesn't have). Forced to null
 * instead of a misleading match — the app shows its empty state + custom URL
 * field for these, as required.
 */
const FORCE_NO_MATCH = new Set([
  'calistenia-sentadillas', // every candidate is a jump/sissy squat variant, no plain bodyweight squat
  'calistenia-plancha', // every candidate adds an unlisted qualifier (side, weighted, on ball)
  // "con disco" (weight plate) implements: this catalog has no "plate" equipment
  // category at all (checked its full equipment list), so a plate press has no
  // honest equivalent — the closest hits (Arnold press, seated shoulder press)
  // use a materially different grip/implement and would misrepresent it.
  'sebas-g4-6-hombros-press-militar-frontal-con-disco',
])

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
  const routines = []
  for (const file of ROUTINE_FILES) {
    if (!existsSync(file)) {
      console.error(`Falta ${path.relative(ROOT, file)}. Corre primero scripts/parse-routine.mjs`)
      process.exit(1)
    }
    routines.push(JSON.parse(readFileSync(file, 'utf-8')))
  }
  const catalog = await loadCatalog()
  console.log(`Catálogo cargado: ${catalog.length} ejercicios (${localSource ? 'local' : 'jsDelivr'})`)

  const entries = []
  const seenKeys = new Set()
  for (const routine of routines) {
    for (const day of routine.days) {
      for (const exercise of day.exercises) {
        if (seenKeys.has(exercise.id)) {
          console.error(`Id de ejercicio duplicado entre rutinas: ${exercise.id}`)
          process.exit(1)
        }
        seenKeys.add(exercise.id)
        entries.push(toCatalogEntry(exercise.id, exercise.name, exercise.muscleGroupRaw, catalog))
      }
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
    console.log(`${e.key.padEnd(60)} ${e.name.padEnd(48)} -> ${(e.catalogSlug ?? '(ninguno)').padEnd(40)} [${e.matchMethod ?? '-'} ${e.matchScore}]${flag}`)
  }
  console.log(`\nTotal: ${entries.length} | sin match: ${unmatched.length} | baja confianza (fuzzy<0.6): ${lowConfidence.length}`)
  if (lowConfidence.length > 0) {
    console.error('\nHay matches de baja confianza sin revisar a mano. Agregalos a OVERRIDES o a FORCE_NO_MATCH antes de continuar.')
    process.exit(1)
  }

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
