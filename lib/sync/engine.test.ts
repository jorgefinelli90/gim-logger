import { describe, expect, it } from 'vitest'
import { millis } from './engine'

/** El formato que devuelve PostgREST por defecto para un `timestamptz`. */
const FROM_POSTGRES: string = '2026-09-02T11:29:00+00:00'
/** El formato que produce `new Date().toISOString()` en el dispositivo. */
const FROM_DEVICE: string = '2026-09-02T11:29:00.000Z'

describe('comparación de fechas entre dispositivo y servidor', () => {
  it('reconoce como el mismo instante los dos formatos habituales', () => {
    expect(millis(FROM_POSTGRES)).toBe(millis(FROM_DEVICE))
    // Ojo: como texto NO son iguales, aunque el orden relativo coincida.
    expect(FROM_POSTGRES === FROM_DEVICE).toBe(false)
  })

  it('no depende de que el servidor responda en UTC', () => {
    // Este es el motivo real de la función. PostgREST devuelve UTC por
    // defecto, pero el offset depende del TimeZone de la conexión. Con un
    // offset distinto, comparar como texto da vuelta el resultado: acá el
    // servidor tiene algo 31 minutos MÁS NUEVO y el texto diría que gana el
    // local, descartando el cambio en silencio.
    const remoteNewer = '2026-09-02T09:00:00-03:00' // = 12:00:00Z
    expect(millis(remoteNewer)).toBeGreaterThan(millis(FROM_DEVICE))
    expect(FROM_DEVICE >= remoteNewer).toBe(true) // lo que haría comparar texto
    expect(millis(FROM_DEVICE) >= millis(remoteNewer)).toBe(false) // lo correcto
  })

  it('reconoce el mismo instante escrito con otro offset', () => {
    expect(millis('2026-09-02T08:29:00-03:00')).toBe(millis(FROM_DEVICE))
  })

  it('trata lo vacío o inválido como "lo más viejo posible"', () => {
    // Así un registro sin fecha nunca gana un conflicto contra uno fechado.
    expect(millis(null)).toBe(0)
    expect(millis('')).toBe(0)
    expect(millis('no es una fecha')).toBe(0)
    expect(millis(FROM_DEVICE)).toBeGreaterThan(millis(undefined))
  })
})
