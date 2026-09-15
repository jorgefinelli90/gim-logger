-- Iron Log — esquema inicial.
--
-- Diseño:
--  * Dos personas, Jorge y Sebastián, cada una con su propia cuenta (magic
--    link) pero SIN aislamiento de datos entre ellas — son compañeros de
--    gimnasio, no hace falta separar "lo tuyo" de "lo mío" a nivel de acceso.
--    RLS solo exige estar autenticado; no filtra por dueño. `profile` es un
--    campo de CONTENIDO (de quién es esta rutina), no un límite de permisos.
--  * `user_id` queda como metadato informativo (quién tocó la fila por
--    última vez) pero no participa de la clave primaria ni de las policies.
--  * Los ids son los que ya genera la app en el cliente (crypto.randomUUID
--    con prefijo, o un slug determinístico para ejercicios/planes) — nunca
--    bigserial — así una serie creada sin señal en el gimnasio conserva su id
--    cuando finalmente sube. Son únicos globalmente por construcción (ver
--    `lib/storage/plan-id.ts` y `scripts/parse-routine.mjs`), así que la
--    clave primaria es solo `id`, sin necesitar `profile` ni `user_id`.
--  * No hay foreign keys entre sets/sessions/exercises A PROPÓSITO: el sync
--    sube en lotes y una serie puede llegar antes que su sesión. La integridad
--    la garantiza la app, que es la única escritora.
--  * deleted_at en vez de DELETE físico: sin lápida, un borrado hecho en el
--    celular nunca se enteraría en la notebook.

create extension if not exists "pgcrypto";

-- server_updated_at es el reloj del SERVIDOR, no el del dispositivo. El pull
-- incremental se ordena por esta columna para que un celular con la hora
-- corrida no se saltee registros.
-- `search_path` fijo: una función sin él puede ser secuestrada por un esquema
-- que se anteponga en el path de quien la invoca. `now()` vive en pg_catalog,
-- que siempre se resuelve, así que vaciarlo no rompe nada.
create or replace function public.touch_server_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.server_updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------- exercises
create table public.exercises (
  id                 text        primary key,
  user_id            uuid        not null default auth.uid(),
  profile            text        not null check (profile in ('jorge', 'sebas')),
  name               text        not null,
  aliases            text[]      not null default '{}',
  muscle_group       text        not null,
  secondary_muscles  text[]      not null default '{}',
  category           text        not null,
  tracking_mode      text        not null,
  equipment          text[]      not null default '{}',
  instructions       text[]      not null default '{}',
  common_mistakes    text[]      not null default '{}',
  alternatives       text[]      not null default '{}',
  image              jsonb       not null default '{}'::jsonb,
  hidden             boolean     not null default false,
  is_custom          boolean     not null default false,
  source             text        not null,
  "order"            integer     not null default 0,
  created_at         timestamptz not null,
  updated_at         timestamptz not null,
  deleted_at         timestamptz,
  server_updated_at  timestamptz not null default now()
);

-- ------------------------------------------------------------------- plans
-- Los días de rutina de cada perfil (3 de gimnasio + calistenia para Jorge,
-- 4 de gimnasio para Sebastián). `day_id` es la identidad lógica del día
-- ("gimnasio-dia-1") que usa la app para las rutas y para `sessions.type`;
-- `id` es la clave de almacenamiento (ver `lib/storage/plan-id.ts`). La lista
-- de ejercicios va como jsonb: es un documento ordenado que siempre se lee y
-- escribe entero.
create table public.plans (
  id                 text        primary key,
  user_id            uuid        not null default auth.uid(),
  profile            text        not null check (profile in ('jorge', 'sebas')),
  day_id             text        not null,
  title              text        not null,
  subtitle           text        not null default '',
  type               text        not null,
  exercises          jsonb       not null default '[]'::jsonb,
  updated_at         timestamptz not null,
  deleted_at         timestamptz,
  server_updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------- sessions
create table public.sessions (
  id                    text        primary key,
  user_id               uuid        not null default auth.uid(),
  profile               text        not null check (profile in ('jorge', 'sebas')),
  date                  date        not null,
  type                  text        not null,
  status                text        not null,
  -- Qué sesión de ese (perfil, fecha) es "la de hoy" en el dashboard — lo que
  -- permite cambiar la rutina de un día puntual sin tocar el horario fijo.
  is_primary_for_date   boolean     not null default true,
  started_at            timestamptz,
  completed_at          timestamptz,
  created_at            timestamptz not null,
  updated_at            timestamptz not null,
  deleted_at            timestamptz,
  server_updated_at     timestamptz not null default now()
);

-- -------------------------------------------------------------------- sets
create table public.sets (
  id                 text        primary key,
  user_id            uuid        not null default auth.uid(),
  profile            text        not null check (profile in ('jorge', 'sebas')),
  session_id         text        not null,
  exercise_id        text        not null,
  set_index          integer     not null,
  target_reps        text,
  actual_reps        integer,
  weight             numeric,
  unit               text        not null default 'kg',
  rpe                numeric,
  duration_seconds   integer,
  distance_meters    numeric,
  note               text,
  completed          boolean     not null default false,
  completed_at       timestamptz,
  created_at         timestamptz not null,
  updated_at         timestamptz not null,
  deleted_at         timestamptz,
  server_updated_at  timestamptz not null default now()
);

-- ------------------------------------------------------------------- notes
-- Una nota por (perfil, fecha) — Jorge y Sebastián pueden anotar el mismo día
-- cada uno la suya, así que NO hay unicidad a nivel de tabla sobre `date`.
create table public.notes (
  id                 text        primary key,
  user_id            uuid        not null default auth.uid(),
  profile            text        not null check (profile in ('jorge', 'sebas')),
  date               date        not null,
  general            text        not null default '',
  energy_level       integer,
  mood               integer,
  soreness           text,
  created_at         timestamptz not null,
  updated_at         timestamptz not null,
  deleted_at         timestamptz,
  server_updated_at  timestamptz not null default now()
);

-- ------------------------------------------------------------ body_metrics
create table public.body_metrics (
  id                 text        primary key,
  user_id            uuid        not null default auth.uid(),
  profile            text        not null check (profile in ('jorge', 'sebas')),
  date               date        not null,
  weight             numeric,
  note               text,
  created_at         timestamptz not null,
  updated_at         timestamptz not null,
  deleted_at         timestamptz,
  server_updated_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------- records
create table public.records (
  id                 text        primary key,
  user_id            uuid        not null default auth.uid(),
  profile            text        not null check (profile in ('jorge', 'sebas')),
  exercise_id        text        not null,
  type               text        not null,
  value              numeric     not null,
  unit               text,
  date               date        not null,
  session_id         text        not null,
  set_id             text        not null,
  created_at         timestamptz not null,
  updated_at         timestamptz not null,
  deleted_at         timestamptz,
  server_updated_at  timestamptz not null default now()
);

-- ------------------------------------------------------------- preferences
-- Una fila por CUENTA (no por perfil): tema, unidades, etc. son del
-- dispositivo/cuenta que los configuró, no de a quién le toca entrenar hoy
-- en ese dispositivo. Se guarda como documento porque se lee y escribe
-- siempre completo, y así agregar una preferencia nueva no pide migración.
create table public.preferences (
  user_id            uuid        not null default auth.uid(),
  data               jsonb       not null default '{}'::jsonb,
  updated_at         timestamptz not null,
  server_updated_at  timestamptz not null default now(),
  primary key (user_id)
);

-- ------------------------------------------------------- triggers + índices
do $$
declare
  t text;
begin
  foreach t in array array[
    'exercises', 'plans', 'sessions', 'sets', 'notes',
    'body_metrics', 'records', 'preferences'
  ]
  loop
    execute format(
      'create trigger %I before insert or update on public.%I
         for each row execute function public.touch_server_updated_at()',
      t || '_touch', t
    );

    -- El pull incremental baja la tabla entera (ambos perfiles) ordenada por
    -- este cursor — "podemos ver todo del otro" es el diseño, no una excepción.
    execute format(
      'create index %I on public.%I (server_updated_at)',
      t || '_sync_idx', t
    );

    execute format('alter table public.%I enable row level security', t);

    -- Cualquier cuenta autenticada puede leer y escribir cualquier fila:
    -- son dos amigos que comparten la app, no hace falta separar accesos.
    -- Esto SÍ bloquea a quien nunca inició sesión con la clave publicable.
    execute format(
      'create policy %I on public.%I for all to authenticated
         using (true) with check (true)',
      t || '_shared', t
    );
  end loop;
end;
$$;

-- Búsquedas frecuentes de la app: historial y calendario van por perfil+fecha.
create index sessions_profile_date_idx on public.sessions (profile, date);
create index sets_session_idx          on public.sets (session_id);
create index sets_exercise_idx         on public.sets (exercise_id);
create index notes_profile_date_idx    on public.notes (profile, date);
