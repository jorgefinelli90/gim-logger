# Iron Log

Bitácora de entrenamiento para dos personas — gimnasio y calistenia, con
temporizador de descanso, historial y estadísticas. Pensada para uso diario
desde el celular en el gimnasio, con o sin señal.

- **Sin registro.** Dos cuentas fijas (`jor` / `sebas`), sin recuperación de
  contraseña — ver [`lib/auth/accounts.ts`](lib/auth/accounts.ts).
- **Sin backend propio.** Todo se guarda primero en IndexedDB, en el
  dispositivo; Supabase es una capa de sincronización opcional por encima —
  la app funciona entera sin ella.
- **Nada inventado.** La rutina de cada uno sale de un Excel real
  (`data/`), parseado una sola vez al armar el proyecto, nunca en el
  cliente. Las imágenes de los ejercicios son GIFs reales de
  [ExerciseGymGifsDB](https://github.com/JahelCuadrado/ExerciseGymGifsDB).

## Empezar

```bash
pnpm install
pnpm dev
```

Abre en `http://localhost:3000` y entrá con una de las dos cuentas. Sin
`.env.local` configurado, la app anda igual — todo queda guardado solo en
ese dispositivo.

### Sincronizar entre dispositivos (opcional)

```bash
cp .env.example .env.local
```

Completá las dos variables con las credenciales de tu proyecto de Supabase y
reiniciá el servidor. El detalle completo — por qué está armado así, cómo
migrar el esquema, qué pasa la primera vez que se vincula un dispositivo —
está en [`docs/sincronizacion.md`](docs/sincronizacion.md).

### Cuando cambia una rutina

El Excel de cada persona vive en `data/`, versionado en el repo. Para
actualizarlo:

```bash
pnpm parse-routine    # Excel -> data/generated/routine*.json
pnpm build-catalog    # matchea cada ejercicio contra el catálogo de GIFs
```

Qué hace cada paso, cómo se decide el matching de imágenes y por qué los
ids de cada perfil están armados como están, en
[`docs/rutinas.md`](docs/rutinas.md).

## Scripts

| Comando | Qué hace |
|---|---|
| `pnpm dev` | Servidor de desarrollo (Turbopack) |
| `pnpm build` / `pnpm start` | Build e inicio en modo producción |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm test` | Tests con Vitest |
| `pnpm parse-routine` | Regenera `data/generated/routine*.json` desde los Excel |
| `pnpm build-catalog` | Regenera el catálogo de GIFs matcheados |

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript estricto ·
`@base-ui/react` · Tailwind v4 · IndexedDB (wrapper propio, sin dependencias)
· Supabase (auth + Postgres, sincronización opcional) · Vitest.

Sin librería de gráficos ni de componentes agregada aparte de lo anterior —
los gráficos de estadísticas son SVG a mano.

## Estructura

```
app/                    rutas (App Router)
components/             UI, agrupada por área (workout, sync, profile, auth…)
hooks/                  lógica de cada pantalla
lib/
  storage/              IndexedDB + repositorios por entidad
  sync/                 motor de sincronización con Supabase
  routine-parser/       Excel -> datos de la app
  exercise-matching/    búsqueda tolerante de ejercicios/GIFs
  date/                 horario semanal por perfil
  statistics/           agregaciones para /estadisticas
data/                   Excels fuente + `generated/` (commiteado, no se edita a mano)
scripts/                los dos scripts de la tabla de arriba
supabase/migrations/    esquema SQL, versionado (0001_init.sql)
docs/                   sincronización y rutinas, en detalle
```
