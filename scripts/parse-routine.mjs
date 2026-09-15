#!/usr/bin/env node
/**
 * Parses the real gym routines (one Excel per persona) using SheetJS (xlsx,
 * already a project dependency) and writes structured, versioned JSON files
 * consumed by the app at build time — one per profile.
 *
 * Nothing here is invented: any cell left blank in the spreadsheet (the
 * "Peso Semana N" columns) is written as `null` so the UI can show it as
 * configurable instead of guessing a value.
 *
 * Run: node scripts/parse-routine.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import XLSX from 'xlsx'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

/**
 * Un origen por perfil. `idPrefix` distingue exercise ids entre perfiles sin
 * tocar los de Jorge: los suyos ya estaban guardados en dispositivos reales
 * antes de que existiera el concepto de perfil (sin prefijo), y renombrarlos
 * huérfano el historial de sets/records que los referencia por id. Cualquier
 * perfil nuevo lleva su nombre como prefijo, así nunca puede chocar con los
 * de Jorge ni con los de otro perfil nuevo.
 */
const SOURCES = [
  {
    profile: 'jorge',
    idPrefix: '',
    sourceFile: path.join(ROOT, 'data', 'rutina-para-Jorge-sept-2026-144bd5.xlsx'),
    outFile: path.join(ROOT, 'data', 'generated', 'routine.json'),
  },
  {
    profile: 'sebas',
    idPrefix: 'sebas-',
    sourceFile: path.join(ROOT, 'data', 'rutina-para-Sebas-sept-2026.xlsx'),
    outFile: path.join(ROOT, 'data', 'generated', 'routine-sebas.json'),
  },
]

const DAY_HEADING_RE = /^D[ií]a\s*(\d)\s*:\s*(.+)$/i

function parseRestSeconds(raw) {
  if (!raw) return null
  const text = String(raw).toLowerCase()
  if (/calentar/.test(text)) return null // "calentar" (warm-up set) isn't a rest duration
  const minutesMatch = text.match(/(\d+(?:[.,]\d+)?)\s*minuto/)
  if (minutesMatch) return Math.round(parseFloat(minutesMatch[1].replace(',', '.')) * 60)
  const rangeMatch = text.match(/(\d+)\s*-\s*(\d+)\s*segundo/)
  if (rangeMatch) return Math.round((parseInt(rangeMatch[1], 10) + parseInt(rangeMatch[2], 10)) / 2)
  const secondsMatch = text.match(/(\d+)\s*segundo/)
  if (secondsMatch) return parseInt(secondsMatch[1], 10)
  return null
}

function parseSetsAndReps(raw) {
  const text = String(raw ?? '').trim()
  const setsMatch = text.match(/(\d+)\s*series?/i)
  const targetSets = setsMatch ? parseInt(setsMatch[1], 10) : null
  const repsMatch = text.match(/\(([^)]+)\)/)
  // Sebastián's sheet also writes reps without parens for warm-up sets, e.g.
  // "1  serie de 10" — fall back to that shape so it isn't silently dropped.
  const plainRepsMatch = !repsMatch ? text.match(/serie\w*\s+de\s+(\d+.*)$/i) : null
  const targetReps = repsMatch ? repsMatch[1].trim() : plainRepsMatch ? plainRepsMatch[1].trim() : null
  return { targetSets, targetReps, raw: text || null }
}

function parseWeight(raw) {
  if (raw === undefined || raw === null || String(raw).trim() === '') return null
  const num = parseFloat(String(raw).replace(',', '.'))
  return Number.isFinite(num) ? num : null
}

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

function tokenize(value) {
  const stop = new Set(['con', 'en', 'de', 'del', 'la', 'el', 'los', 'las', 'y', 'o', 'a', 'un', 'una', 'para', 'por', 'al', 'sobre'])
  return normalize(value).split(' ').filter((t) => t && !stop.has(t))
}

function tokenOverlapScore(a, b) {
  const setA = new Set(tokenize(a))
  const setB = new Set(tokenize(b))
  if (setA.size === 0 || setB.size === 0) return 0
  let shared = 0
  for (const token of setA) if (setB.has(token)) shared += 1
  return (2 * shared) / (setA.size + setB.size)
}

/** Parses Hoja2 (Ejercicio | Beneficio principal | Consejo) into a lookup list. */
function parseTipsSheet(workbook) {
  const sheetName = workbook.SheetNames[1]
  if (!sheetName) return []
  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, defval: '', raw: false })
  const tips = []
  for (const row of rows.slice(1)) {
    const [name, benefit, tip] = row.map((cell) => (typeof cell === 'string' ? cell.trim() : cell))
    if (!name) continue
    tips.push({ name: String(name), benefit: benefit ? String(benefit) : null, tip: tip ? String(tip) : null })
  }
  return tips
}

/** Attaches the best-matching tip/benefit to each exercise by tolerant name match. */
function attachTips(days, tips) {
  const MIN_SCORE = 0.4
  for (const day of days) {
    for (const exercise of day.exercises) {
      let best = null
      let bestScore = 0
      for (const tip of tips) {
        const score = tokenOverlapScore(exercise.name, tip.name)
        if (score > bestScore) {
          bestScore = score
          best = tip
        }
      }
      exercise.benefit = bestScore >= MIN_SCORE ? best.benefit : null
      exercise.tip = bestScore >= MIN_SCORE ? best.tip : null
    }
  }
}

function slugifyExercise(idPrefix, dayNumber, muscleGroup, name, index) {
  const base = `${muscleGroup} ${name}`
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
  return `${idPrefix}g${dayNumber}-${index}-${base}`.slice(0, 90)
}

function parseSource({ sourceFile, outFile, idPrefix }) {
  if (!existsSync(sourceFile)) {
    console.error(`No se encontró el Excel de la rutina en: ${sourceFile}`)
    process.exit(1)
  }

  // XLSX's ESM build can't reliably auto-detect Node's `fs` for readFile(),
  // so read the bytes ourselves and hand them to XLSX.read() instead.
  const buffer = readFileSync(sourceFile)
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true })
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false })

  const days = []
  let currentDay = null
  let exerciseIndexInDay = 0

  for (const row of rows) {
    const [colA, colB, colC, weekA, weekB, weekC, weekD, colH] = row.map((cell) =>
      typeof cell === 'string' ? cell.trim() : cell,
    )

    const headingCandidate = String(colA ?? '')
    const headingMatch = headingCandidate.match(DAY_HEADING_RE)
    if (headingMatch) {
      currentDay = {
        dayNumber: parseInt(headingMatch[1], 10),
        title: `Gimnasio · Día ${headingMatch[1]}`,
        subtitle: headingMatch[2].trim(),
        exercises: [],
      }
      days.push(currentDay)
      exerciseIndexInDay = 0
      continue
    }

    const looksLikeExerciseRow = currentDay && colA && colB && colA !== 'Ejercicio'
    if (!looksLikeExerciseRow) continue

    const muscleGroupRaw = String(colA).trim()
    const name = String(colB).trim()
    const { targetSets, targetReps, raw: setsRepsRaw } = parseSetsAndReps(colC)
    const restSeconds = parseRestSeconds(colH)
    const restRaw = colH ? String(colH).trim() : null

    currentDay.exercises.push({
      id: slugifyExercise(idPrefix, currentDay.dayNumber, muscleGroupRaw, name, exerciseIndexInDay),
      order: exerciseIndexInDay,
      muscleGroupRaw,
      name,
      targetSets,
      targetReps,
      setsRepsRaw,
      targetWeightByWeek: [parseWeight(weekA), parseWeight(weekB), parseWeight(weekC), parseWeight(weekD)],
      restSeconds,
      restRaw,
    })
    exerciseIndexInDay += 1
  }

  if (days.length === 0) {
    console.error(`No se detectaron días de rutina en ${sourceFile}. Revisa el formato de la hoja.`)
    process.exit(1)
  }

  const tips = parseTipsSheet(workbook)
  attachTips(days, tips)

  const output = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    sourceFile: path.basename(sourceFile),
    sourceSheet: sheetName,
    days,
  }

  writeFileSync(outFile, JSON.stringify(output, null, 2) + '\n', 'utf-8')

  const totalExercises = days.reduce((sum, d) => sum + d.exercises.length, 0)
  console.log(`OK (${idPrefix || 'jorge'}): ${days.length} días, ${totalExercises} ejercicios -> ${path.relative(ROOT, outFile)}`)
}

for (const source of SOURCES) parseSource(source)
