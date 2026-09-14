import { describe, expect, it } from 'vitest'
import { findBestMatch, searchExercises } from './match'

const CANDIDATES = [
  { id: '1', name: 'Press de banca con barra' },
  { id: '2', name: 'Press militar con mancuerna' },
  { id: '3', name: 'Curl con barra Z o recta' },
  { id: '4', name: 'Sentadilla con barra', aliases: ['Back squat'] },
]

describe('searchExercises', () => {
  it('is tolerant to accents, case and hyphenation', () => {
    const results = searchExercises('PRESS-DE-BANCA', CANDIDATES)
    expect(results[0]?.candidate.id).toBe('1')
  })

  it('matches through aliases', () => {
    const results = searchExercises('back squat', CANDIDATES)
    expect(results[0]?.candidate.id).toBe('4')
  })

  it('ranks an exact match above a partial one', () => {
    const results = searchExercises('curl con barra z o recta', CANDIDATES)
    expect(results[0]?.candidate.id).toBe('3')
    expect(results[0]?.score).toBe(1)
  })
})

describe('findBestMatch', () => {
  it('returns null when nothing clears the threshold', () => {
    expect(findBestMatch('elevacion de talones para pantorrillas', CANDIDATES)).toBeNull()
  })

  it('returns the best candidate when confident enough', () => {
    expect(findBestMatch('press militar', CANDIDATES)?.id).toBe('2')
  })
})
