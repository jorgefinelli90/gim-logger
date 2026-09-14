import routineData from '@/data/generated/routine.json'
import catalogData from '@/data/generated/exercise-catalog.json'
import { CALISTHENICS_SEED } from '@/data/calisthenics-seed'
import type { CatalogFile, RawRoutineFile } from '@/lib/routine-parser/types'
import { buildCalisthenicsExercises, buildCalisthenicsPlan, buildGymExercises, buildGymPlans } from '@/lib/routine-parser/transform'
import { seedExercisesIfMissing } from './repositories/exercise-repo'
import { seedPlansIfMissing } from './repositories/plan-repo'
import { getMeta, setMeta } from './repositories/meta-repo'

const SEED_META_KEY = 'seedVersion'
const CURRENT_SEED_VERSION = 1

export async function ensureSeeded(): Promise<void> {
  const seededVersion = await getMeta<number>(SEED_META_KEY)
  if (seededVersion === CURRENT_SEED_VERSION) return

  const routine = routineData as RawRoutineFile
  const catalog = catalogData as CatalogFile
  const nowIso = new Date().toISOString()

  const gymExercises = buildGymExercises(routine, catalog, nowIso)
  const calisthenicsExercises = buildCalisthenicsExercises(CALISTHENICS_SEED, catalog, nowIso)
  const gymPlans = buildGymPlans(routine, nowIso)
  const calisthenicsPlan = buildCalisthenicsPlan(CALISTHENICS_SEED, nowIso)

  await seedExercisesIfMissing([...gymExercises, ...calisthenicsExercises])
  await seedPlansIfMissing([...gymPlans, calisthenicsPlan])
  await setMeta(SEED_META_KEY, CURRENT_SEED_VERSION)
}
