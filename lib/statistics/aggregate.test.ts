import { describe, expect, it } from 'vitest'
import { computeMuscleDistribution, computeStreaks, computeTotals } from './aggregate'
import type { Exercise, ExerciseSet, WorkoutSession } from '@/types'

function session(id: string, date: string, type: WorkoutSession['type']): WorkoutSession {
  return { id, profile: 'jorge', date, type, status: 'completo', isPrimaryForDate: true, startedAt: null, completedAt: null, createdAt: date, updatedAt: date }
}

function completedSet(id: string, sessionId: string, exerciseId: string, weight: number | null, reps: number | null): ExerciseSet {
  return {
    id,
    profile: 'jorge',
    sessionId,
    exerciseId,
    setIndex: 0,
    targetReps: null,
    actualReps: reps,
    weight,
    unit: 'kg',
    rpe: null,
    durationSeconds: null,
    distanceMeters: null,
    note: null,
    completed: true,
    completedAt: '2026-01-01T00:00:00.000Z',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  }
}

describe('computeStreaks', () => {
  it('counts a perfect week (rest days do not break the streak)', () => {
    // 2026-09-14 is a Monday in this fixture's calendar.
    const sessions: WorkoutSession[] = [
      session('s1', '2026-09-14', 'calistenia'),
      session('s2', '2026-09-15', 'gimnasio-dia-1'),
      session('s3', '2026-09-16', 'calistenia'),
    ]
    const sets = [
      completedSet('a', 's1', 'ex1', null, 10),
      completedSet('b', 's2', 'ex1', 20, 10),
      completedSet('c', 's3', 'ex1', null, 10),
    ]
    const result = computeStreaks('jorge', sessions, sets, '2026-09-16')
    expect(result.current).toBe(3)
  })

  it('stops the current streak at a missed training day', () => {
    const sessions: WorkoutSession[] = [session('s1', '2026-09-14', 'calistenia')]
    const sets = [completedSet('a', 's1', 'ex1', null, 10)]
    // 2026-09-16 (Wednesday) was a training day with no completed session.
    const result = computeStreaks('jorge', sessions, sets, '2026-09-16')
    expect(result.current).toBe(0)
  })

  it('ignores sessions with no completed sets', () => {
    const sessions: WorkoutSession[] = [session('s1', '2026-09-14', 'calistenia')]
    const result = computeStreaks('jorge', sessions, [], '2026-09-14')
    expect(result.current).toBe(0)
  })
})

describe('computeTotals', () => {
  it('only counts completed sets toward volume/reps', () => {
    const sessions: WorkoutSession[] = [session('s1', '2026-09-14', 'gimnasio-dia-1')]
    const sets: ExerciseSet[] = [
      completedSet('a', 's1', 'ex1', 50, 10),
      { ...completedSet('b', 's1', 'ex1', 999, 999), completed: false },
    ]
    const totals = computeTotals(sessions, sets)
    expect(totals.totalVolume).toBe(500)
    expect(totals.totalSets).toBe(1)
    expect(totals.totalReps).toBe(10)
    expect(totals.workoutsCompleted).toBe(1)
  })
})

describe('computeMuscleDistribution', () => {
  it('groups completed sets by the exercise muscle group', () => {
    const exercises: Record<string, Exercise> = {
      ex1: { muscleGroup: 'pecho' } as Exercise,
      ex2: { muscleGroup: 'espalda' } as Exercise,
    }
    const sets = [completedSet('a', 's1', 'ex1', 50, 10), completedSet('b', 's1', 'ex1', 50, 10), completedSet('c', 's1', 'ex2', 50, 10)]
    const distribution = computeMuscleDistribution(sets, exercises)
    expect(distribution).toEqual([
      { muscleGroup: 'pecho', sets: 2 },
      { muscleGroup: 'espalda', sets: 1 },
    ])
  })
})
