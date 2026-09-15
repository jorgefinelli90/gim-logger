import routineData from '@/data/generated/routine.json'
import routineSebasData from '@/data/generated/routine-sebas.json'
import catalogData from '@/data/generated/exercise-catalog.json'
import { CALISTHENICS_SEED } from '@/data/calisthenics-seed'
import type { CatalogFile, RawRoutineFile } from '@/lib/routine-parser/types'
import { buildCalisthenicsExercises, buildCalisthenicsPlan, buildGymExercises, buildGymPlans } from '@/lib/routine-parser/transform'
import { seedExercisesIfMissing } from './repositories/exercise-repo'
import { seedPlansIfMissing } from './repositories/plan-repo'
import { getMeta, setMeta } from './repositories/meta-repo'

const SEED_META_KEY = 'seedVersion'
// v3: Sebastián también tiene calistenia disponible como opción para sus
// días libres (mismos movimientos que Jorge, sus propios ids con prefijo).
const CURRENT_SEED_VERSION = 3

export async function ensureSeeded(): Promise<void> {
  const seededVersion = await getMeta<number>(SEED_META_KEY)
  if (seededVersion === CURRENT_SEED_VERSION) return

  const routine = routineData as RawRoutineFile
  const routineSebas = routineSebasData as RawRoutineFile
  const catalog = catalogData as CatalogFile
  const nowIso = new Date().toISOString()

  const jorgeGymExercises = buildGymExercises(routine, catalog, nowIso, 'jorge')
  const jorgeCalisthenicsExercises = buildCalisthenicsExercises(CALISTHENICS_SEED, catalog, nowIso, 'jorge')
  const jorgeGymPlans = buildGymPlans(routine, nowIso, 'jorge')
  const jorgeCalisthenicsPlan = buildCalisthenicsPlan(CALISTHENICS_SEED, nowIso, 'jorge')

  const sebasGymExercises = buildGymExercises(routineSebas, catalog, nowIso, 'sebas')
  const sebasGymPlans = buildGymPlans(routineSebas, nowIso, 'sebas')
  // Mismos movimientos que Jorge, disponibles para elegir en un día libre —
  // no es una rutina fija de Sebastián, así que se ofrece igual (ver
  // lib/date/profile-schedule.ts: 'calistenia' entra a su lista de días
  // elegibles pero no a su horario semanal por defecto).
  const sebasCalisthenicsExercises = buildCalisthenicsExercises(CALISTHENICS_SEED, catalog, nowIso, 'sebas')
  const sebasCalisthenicsPlan = buildCalisthenicsPlan(CALISTHENICS_SEED, nowIso, 'sebas')

  await seedExercisesIfMissing([...jorgeGymExercises, ...jorgeCalisthenicsExercises, ...sebasGymExercises, ...sebasCalisthenicsExercises])
  await seedPlansIfMissing([...jorgeGymPlans, jorgeCalisthenicsPlan, ...sebasGymPlans, sebasCalisthenicsPlan])
  await setMeta(SEED_META_KEY, CURRENT_SEED_VERSION)
}
