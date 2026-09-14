'use client'

import { useEffect, useMemo, useState } from 'react'
import { Check, ChevronRight, Clock3, Dumbbell, Flame, Menu, Play, Search, Settings2, Target, TimerReset, Trophy, X } from 'lucide-react'

type Exercise = { id: string; name: string; group: string; prescription: string; rest: string; image: string }
type Day = { id: string; label: string; short: string; title: string; subtitle: string; type: 'Calistenia' | 'Gimnasio'; exercises: Exercise[] }

const gif = (_name: string) => 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/biceps/barbell-curl.gif'
const fallback = 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=900&q=80'

const gymExercises = (day: number): Exercise[] => {
  const data: Record<number, [string, string, string, string][]> = {
    1: [
      ['Press superior con barra en máquina', 'PECHO', '4 series (8-12 reps)', '90 segundos'],
      ['Press plano en máquina', 'PECHO', '3 series (8-12 reps)', '90 segundos'],
      ['Fondos en paralelas / máquina', 'PECHO', '3 series (Al fallo)', '2 minutos'],
      ['Extensión de tríceps sobre la cabeza con soga', 'TRÍCEPS', '3 series (10-12 reps)', '60-90 segundos'],
      ['Extensión de tríceps con barra recta', 'TRÍCEPS', '3 series (10-12 reps)', '60-90 segundos'],
      ['Extensión de tríceps con soga (agarre neutro)', 'TRÍCEPS', '3 series (12 reps)', '60-90 segundos'],
      ['Curl de muñeca en supinación con barra recta', 'ANTEBRAZOS', '3 series (15 reps)', '60 segundos'],
      ['Flexión de muñeca con polea por detrás', 'ANTEBRAZOS', '3 series (15-20 reps)', '60 segundos'],
    ],
    2: [
      ['Jalón al pecho en polea', 'ESPALDA', '4 series (8-12 reps)', '90 segundos'], ['Remo en máquina o polea baja', 'ESPALDA', '3 series (8-12 reps)', '90 segundos'], ['Pullover en polea alta', 'ESPALDA', '3 series (12-15 reps)', '90 segundos'], ['Curl con barra Z o recta', 'BÍCEPS', '3 series (10-12 reps)', '60-90 segundos'], ['Curl martillo con mancuernas', 'BÍCEPS', '3 series (10-12 reps)', '60-90 segundos'], ['Curl en polea baja', 'BÍCEPS', '3 series (12 reps)', '60-90 segundos'], ['Press militar con mancuernas o máquina', 'HOMBROS', '3 series (8-10 reps)', '90 segundos'], ['Elevaciones laterales con mancuernas/polea', 'HOMBROS', '4 series (12-15 reps)', '60 segundos'], ['Elevaciones frontales con mancuernas/polea', 'HOMBROS', '4 series (12-15 reps)', '60 segundos'],
    ],
    3: [
      ['Prensa de pierna inclinada', 'PIERNAS', '4 series (8-12 reps)', '90 segundos'], ['Extensiones de cuádriceps en máquina', 'PIERNAS', '3 series (12-15 reps)', '60-90 segundos'], ['Curl femoral acostado o sentado', 'PIERNAS', '4 series (10-15 reps)', '90 segundos'], ['Peso muerto rumano con mancuernas/barra', 'PIERNAS', '3 series (8-12 reps)', '2 minutos'], ['Elevación de talones para pantorrillas', 'PIERNAS', '4 series (15-20 reps)', '60 segundos'], ['Crunch abdominal en máquina o suelo', 'ABDOMINALES', '3 series (15-20 reps)', '60 segundos'], ['Elevación de piernas colgado', 'ABDOMINALES', '3 series (12-15 reps)', '60 segundos'],
    ],
  }
  return data[day].map(([name, group, prescription, rest], i) => ({ id: `g${day}-${i}`, name, group, prescription, rest, image: gif(name) }))
}

const calisthenics: Exercise[] = [
  ['Flexiones', 'EMPUJE', '4 series (al fallo técnico)', '90 segundos'], ['Dominadas o remo invertido', 'TIRÓN', '4 series (al fallo técnico)', '2 minutos'], ['Sentadillas con peso corporal', 'PIERNAS', '4 series (15-20 reps)', '60 segundos'], ['Plancha frontal', 'CORE', '3 series (30-60 segundos)', '60 segundos'],
].map(([name, group, prescription, rest], i) => ({ id: `c-${i}`, name, group, prescription, rest, image: gif(name) }))

const days: Day[] = [
  { id: 'mon', label: 'Lunes', short: 'LUN', title: 'Calistenia', subtitle: 'Completa tus ejercicios del día', type: 'Calistenia', exercises: calisthenics },
  { id: 'tue', label: 'Martes', short: 'MAR', title: 'Gimnasio · Día 1', subtitle: 'Pecho, tríceps y antebrazo', type: 'Gimnasio', exercises: gymExercises(1) },
  { id: 'wed', label: 'Miércoles', short: 'MIÉ', title: 'Calistenia', subtitle: 'Completa tus ejercicios del día', type: 'Calistenia', exercises: calisthenics },
  { id: 'thu', label: 'Jueves', short: 'JUE', title: 'Gimnasio · Día 2', subtitle: 'Espalda, bíceps y hombros', type: 'Gimnasio', exercises: gymExercises(2) },
  { id: 'fri', label: 'Viernes', short: 'VIE', title: 'Calistenia', subtitle: 'Completa tus ejercicios del día', type: 'Calistenia', exercises: calisthenics },
  { id: 'sat', label: 'Sábado', short: 'SÁB', title: 'Gimnasio · Día 3', subtitle: 'Piernas y abdomen', type: 'Gimnasio', exercises: gymExercises(3) },
]

export default function Page() {
  const todayIndex = (new Date().getDay() + 6) % 7
  const [active, setActive] = useState(todayIndex === 6 ? 5 : todayIndex)
  const [done, setDone] = useState<Record<string, boolean>>({})
  const [query, setQuery] = useState('')
  const [showMenu, setShowMenu] = useState(false)
  const [notes, setNotes] = useState('')
  const [seconds, setSeconds] = useState(90)
  const [timerOn, setTimerOn] = useState(false)
  const day = days[active]
  const filtered = useMemo(() => day.exercises.filter((e) => e.name.toLowerCase().includes(query.toLowerCase()) || e.group.toLowerCase().includes(query.toLowerCase())), [day, query])
  const completed = day.exercises.filter((e) => done[e.id]).length
  const total = day.exercises.length

  useEffect(() => { const saved = localStorage.getItem('gym-progress'); if (saved) setDone(JSON.parse(saved)); const n = localStorage.getItem('gym-notes'); if (n) setNotes(n) }, [])
  useEffect(() => { localStorage.setItem('gym-progress', JSON.stringify(done)) }, [done])
  useEffect(() => { localStorage.setItem('gym-notes', notes) }, [notes])
  useEffect(() => { if (!timerOn) return; const id = window.setInterval(() => setSeconds((s) => s <= 1 ? (setTimerOn(false), 90) : s - 1), 1000); return () => clearInterval(id) }, [timerOn])
  const toggle = (id: string) => setDone((current) => ({ ...current, [id]: !current[id] }))
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0'); const ss = String(seconds % 60).padStart(2, '0')

  return <main className="app-shell">
    <aside className={`sidebar ${showMenu ? 'open' : ''}`}>
      <div className="brand"><div className="brand-mark"><Dumbbell /></div><div><strong>IRON LOG</strong><span>PERSONAL TRAINING</span></div><button className="close-menu" onClick={() => setShowMenu(false)} aria-label="Cerrar menú"><X /></button></div>
      <nav><button className="nav-item active"><Target /> Mi entrenamiento</button><button className="nav-item"><Trophy /> Progreso</button><button className="nav-item"><Clock3 /> Historial</button></nav>
      <div className="sidebar-bottom"><div className="week-label"><span>SEMANA 1 / 4</span><b>0%</b></div><div className="progress-line"><i style={{ width: '0%' }} /></div><p>Tu primera semana empieza hoy. La constancia gana.</p><button className="settings"><Settings2 /> Configuración</button></div>
    </aside>
    {showMenu && <button className="mobile-backdrop" onClick={() => setShowMenu(false)} aria-label="Cerrar menú" />}
    <section className="content">
      <header className="topbar"><button className="menu-button" onClick={() => setShowMenu(true)} aria-label="Abrir menú"><Menu /></button><div><p className="eyebrow">SEPTIEMBRE 2026 <span>•</span> SEMANA 1</p><h1>Tu semana, <em>en movimiento.</em></h1></div><div className="header-actions"><button className="icon-button" aria-label="Buscar"><Search /></button><div className="avatar">J</div></div></header>
      <div className="day-strip">{days.map((d, i) => <button key={d.id} className={`day-pill ${i === active ? 'selected' : ''} ${i === todayIndex ? 'today' : ''}`} onClick={() => { setActive(i); setQuery('') }}><span>{d.short}</span><b>{i + 1}</b>{i === todayIndex && <i />}</button>)}</div>
      <div className="dashboard-grid"><div className="main-column">
        <section className="session-heading"><div><span className={`type-badge ${day.type === 'Calistenia' ? 'lime' : 'orange'}`}>{day.type === 'Calistenia' ? 'PESO CORPORAL' : 'GIMNASIO'}</span><h2>{day.title}</h2><p>{day.subtitle}</p></div><div className="completion"><strong>{completed}<small>/{total}</small></strong><span>EJERCICIOS<br/>LISTOS</span></div></section>
        <div className="session-progress"><span style={{ width: `${(completed / total) * 100}%` }} /></div>
        <div className="list-toolbar"><span>{total} ejercicios programados</span><label><Search /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar ejercicio" /></label></div>
        <div className="exercise-list">{filtered.map((exercise, index) => <article className={`exercise-card ${done[exercise.id] ? 'complete' : ''}`} key={exercise.id}><button className="check" onClick={() => toggle(exercise.id)} aria-label={`Marcar ${exercise.name}`}><Check /></button><img src={exercise.image} alt={`Cómo hacer ${exercise.name}`} onError={(e) => { e.currentTarget.src = fallback }} /><div className="exercise-copy"><div className="exercise-top"><span>{String(index + 1).padStart(2, '0')} / {exercise.group}</span>{done[exercise.id] && <b>COMPLETADO</b>}</div><h3>{exercise.name}</h3><p>{exercise.prescription}</p></div><div className="rest"><span>DESCANSO</span><b>{exercise.rest}</b></div><ChevronRight className="arrow" /></article>)}</div>
      </div><aside className="right-column">
        <section className="timer-card"><div className="card-title"><span><Clock3 /> DESCANSO</span><button onClick={() => { setSeconds(90); setTimerOn(false) }} aria-label="Reiniciar temporizador"><TimerReset /></button></div><div className="timer-display">{mm}<small>:</small>{ss}</div><p>{timerOn ? 'El descanso está corriendo' : 'Listo para tu próxima serie'}</p><button className={`timer-button ${timerOn ? 'running' : ''}`} onClick={() => setTimerOn((v) => !v)}><Play /> {timerOn ? 'Pausar descanso' : 'Iniciar descanso'}</button></section>
        <section className="notes-card"><div className="card-title"><span><Flame /> NOTAS DE HOY</span><span className="saved">GUARDADO</span></div><textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="¿Cómo te sentiste? Anota pesos, repeticiones o sensaciones..." /></section>
        <section className="quote-card"><div className="quote-mark">“</div><p>La disciplina es elegir entre lo que quieres ahora y lo que más quieres.</p><span>— ABRAHAM LINCOLN</span></section>
      </aside></div>
      <footer className="footer"><span><span className="status-dot" /> PROGRESO GUARDADO EN ESTE DISPOSITIVO</span><span>IRON LOG <b>•</b> TU RUTINA, TU RITMO.</span></footer>
    </section>
  </main>
}
