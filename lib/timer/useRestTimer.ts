'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export interface RestTimerState {
  totalSeconds: number
  remainingSeconds: number
  running: boolean
  label: string | null
  /** Which exercise started this rest, so its card can show the live countdown. */
  sourceId: string | null
  /** True while a rest is counting down or paused part-way through. */
  active: boolean
}

export interface RestTimerActions {
  start: (seconds: number, label?: string | null, sourceId?: string | null) => void
  pause: () => void
  resume: () => void
  reset: () => void
  addSeconds: (delta: number) => void
}

type InternalState = Omit<RestTimerState, 'active'>

const INITIAL_STATE: InternalState = { totalSeconds: 90, remainingSeconds: 90, running: false, label: null, sourceId: null }

/**
 * Rest timer driven by wall-clock timestamps (not a naive setInterval
 * countdown) so it stays accurate even if the tab is throttled in the
 * background while the user keeps navigating the app.
 */
export function useRestTimer(soundEnabled: boolean, vibrationEnabled: boolean): RestTimerState & RestTimerActions {
  const [state, setState] = useState<InternalState>(INITIAL_STATE)
  const endTimeRef = useRef<number | null>(null)
  const frameRef = useRef<number | null>(null)

  // Kept in a ref, refreshed after every commit (never during render — see
  // react-hooks/refs) so the recursive setTimeout below always calls the
  // latest version — capturing current soundEnabled/vibrationEnabled —
  // without the callback needing to reference itself.
  const tickRef = useRef<() => void>(() => {})
  useEffect(() => {
    tickRef.current = () => {
      if (endTimeRef.current == null) return
      const remaining = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000))
      if (remaining <= 0) {
        endTimeRef.current = null
        setState((s) => ({ ...s, running: false, remainingSeconds: 0 }))
        if (soundEnabled) playBeep()
        if (vibrationEnabled && typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate([200, 100, 200])
        return
      }
      setState((s) => ({ ...s, remainingSeconds: remaining }))
      frameRef.current = window.setTimeout(() => tickRef.current(), 250)
    }
  })

  useEffect(() => {
    return () => {
      if (frameRef.current) clearTimeout(frameRef.current)
    }
  }, [])

  const start = useCallback((seconds: number, label: string | null = null, sourceId: string | null = null) => {
    endTimeRef.current = Date.now() + seconds * 1000
    setState({ totalSeconds: seconds, remainingSeconds: seconds, running: true, label, sourceId })
    if (frameRef.current) clearTimeout(frameRef.current)
    tickRef.current()
  }, [])

  const pause = useCallback(() => {
    if (frameRef.current) clearTimeout(frameRef.current)
    setState((s) => ({ ...s, running: false }))
    endTimeRef.current = null
  }, [])

  const resume = useCallback(() => {
    if (state.remainingSeconds <= 0) return
    endTimeRef.current = Date.now() + state.remainingSeconds * 1000
    setState((s) => ({ ...s, running: true }))
    if (frameRef.current) clearTimeout(frameRef.current)
    tickRef.current()
  }, [state.remainingSeconds])

  const reset = useCallback(() => {
    if (frameRef.current) clearTimeout(frameRef.current)
    endTimeRef.current = null
    setState((s) => ({ ...s, remainingSeconds: s.totalSeconds, running: false, sourceId: null }))
  }, [])

  const addSeconds = useCallback((delta: number) => {
    setState((s) => {
      const nextRemaining = Math.max(0, s.remainingSeconds + delta)
      if (s.running && endTimeRef.current != null) endTimeRef.current += delta * 1000
      return { ...s, remainingSeconds: nextRemaining, totalSeconds: Math.max(s.totalSeconds, nextRemaining) }
    })
  }, [])

  const active = state.running || (state.remainingSeconds > 0 && state.remainingSeconds < state.totalSeconds)

  return { ...state, active, start, pause, resume, reset, addSeconds }
}

function playBeep() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new AudioCtx()
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()
    oscillator.type = 'sine'
    oscillator.frequency.value = 880
    gain.gain.setValueAtTime(0.2, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6)
    oscillator.connect(gain)
    gain.connect(ctx.destination)
    oscillator.start()
    oscillator.stop(ctx.currentTime + 0.6)
    oscillator.onended = () => ctx.close()
  } catch {
    // Audio not available (autoplay policy, unsupported browser) — silently skip.
  }
}
