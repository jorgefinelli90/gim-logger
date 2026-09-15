# Rutinas y perfiles

Iron Log tiene dos perfiles fijos, `jorge` y `sebas` (ver `types/profile.ts`).
Cada uno tiene su propia rutina de gimnasio parseada de su propio Excel.
Calistenia (los mismos 4 movimientos) está disponible para los dos: para
Jorge es un día fijo del horario semanal, para Sebastián es una opción para
sus días libres — ver "Horario semanal" más abajo.

## Cómo se genera la rutina de cada uno

1. El Excel de cada persona vive en `data/` (`rutina-para-Jorge-…xlsx`,
   `rutina-para-Sebas-…xlsx`), commiteado — nunca se parsea en el cliente.
2. `node scripts/parse-routine.mjs` lee AMBOS excels y escribe
   `data/generated/routine.json` (Jorge) y `data/generated/routine-sebas.json`
   (Sebastián). Nada se inventa: una celda de peso vacía queda `null`.
3. `node scripts/build-exercise-catalog.mjs` matchea cada ejercicio de las dos
   rutinas contra el catálogo real de
   [ExerciseGymGifsDB](https://github.com/JahelCuadrado/ExerciseGymGifsDB) y
   escribe `data/generated/exercise-catalog.json`. Los matches automáticos de
   baja confianza frenan el script (hay que revisarlos a mano y agregarlos a
   `OVERRIDES` o a `FORCE_NO_MATCH` si no existe un equivalente honesto —
   mejor sin GIF que con uno que muestra un ejercicio distinto).
4. `lib/storage/seed.ts` siembra ambas rutinas en IndexedDB la primera vez que
   corre la app en un dispositivo (o cuando se sube `CURRENT_SEED_VERSION`).

### Cuando cambia una rutina

Reemplazá el Excel correspondiente en `data/`, corré los dos scripts de
arriba en orden, revisá el resultado del matching, y subí
`CURRENT_SEED_VERSION` en `lib/storage/seed.ts` para que los dispositivos que
ya tenían la rutina vieja reciban los ejercicios nuevos (`seedExercisesIfMissing`/
`seedPlansIfMissing` solo agregan lo que falta por id, nunca pisan lo que el
usuario ya personalizó).

## Ids: por qué Jorge no lleva prefijo y Sebastián sí

Los ids de ejercicios y planes tienen que ser únicos entre TODOS los perfiles
(comparten los mismos object stores de IndexedDB y las mismas tablas de
Postgres). Jorge usaba la app antes de que existiera el concepto de perfil, así
que sus ids (`g1-0-pecho-…`, `gimnasio-dia-1`, `calistenia-flexiones`)
quedaron sin prefijo para no romper su historial ya guardado. Cualquier perfil
que se agregue después (Sebastián, y el que venga) lleva su nombre como
prefijo (`sebas-g1-0-pecho-…`, `sebas-gimnasio-dia-1`,
`sebas-calistenia-flexiones`) — ver `scripts/parse-routine.mjs` (`idPrefix`) y
`lib/storage/plan-id.ts` (`planStorageId`, `calisthenicsExerciseId`). El
catálogo de GIFs se busca siempre por la clave SIN prefijo (el movimiento es
el mismo sea de quien sea la rutina), no hace falta duplicar esas entradas.

## Horario semanal

`lib/date/profile-schedule.ts` mapea día de la semana → tipo de sesión, un
mapa por perfil:

- **Jorge**: Lun/Mié/Vie calistenia, Mar/Jue/Sáb gimnasio (Día 1/2/3), Dom descanso.
- **Sebastián**: Mar/Jue/Vie/Sáb gimnasio (Día 1/2/3/4), Dom/Lun/Mié descanso.

El horario de Sebastián solo confirma los 4 días de gimnasio que pidió; los
otros tres quedan en descanso **por default**, no fijos — en cualquiera de
esos días puede abrir el selector de "cambiar rutina de hoy" y elegir
gimnasio o calistenia manualmente (ver la sección siguiente). Si en realidad
tiene un día de gimnasio fijo más, es cuestión de sumarlo a `SCHEDULES.sebas`
en ese archivo.

`PROFILE_PLAN_DAYS` (mismo archivo) es la lista de rutinas ELEGIBLES por
perfil, separada del horario fijo de arriba — ahí es donde vive que
calistenia sea una opción para Sebastián aunque no aparezca en su horario
semanal por defecto.

## Cambiar la rutina de un día puntual ("swap")

El dashboard ("Hoy") tiene un selector — "cambiar rutina de hoy" — para abrir
un día distinto al que toca por horario (ej: hacer Día 3 en vez de Día 2).
No modifica el horario semanal: solo marca qué sesión de ese
(perfil, fecha) es la "primaria" (`WorkoutSession.isPrimaryForDate`), y el
dashboard/calendario la respetan en vez de calcular el default. Como es un
campo más de `sessions` (tabla ya sincronizada), el cambio viaja entre
dispositivos igual que cualquier otro dato — swapeás en el celular en el
gimnasio y la notebook lo ve al rato.
