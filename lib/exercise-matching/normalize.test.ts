import { describe, expect, it } from 'vitest'
import { normalizeText, tokenize } from './normalize'

describe('normalizeText', () => {
  it('strips accents and lowercases', () => {
    expect(normalizeText('Extensión de Tríceps')).toBe('extension de triceps')
  })

  it('treats hyphens and slashes as spaces', () => {
    expect(normalizeText('Fondos en paralelas / máquina')).toBe('fondos en paralelas maquina')
    expect(normalizeText('press-plano')).toBe('press plano')
  })

  it('collapses repeated whitespace', () => {
    expect(normalizeText('curl   martillo')).toBe('curl martillo')
  })
})

describe('tokenize', () => {
  it('drops common Spanish stopwords', () => {
    expect(tokenize('Curl con barra Z o recta')).toEqual(['curl', 'barra', 'z', 'recta'])
  })

  it('returns an empty array for an empty string', () => {
    expect(tokenize('')).toEqual([])
  })
})
