# Sincronización entre dispositivos

Iron Log guarda todo en **IndexedDB**, en el dispositivo. La sincronización con
Supabase es una capa opcional encima: si no está configurada, o no hay sesión, o
no hay señal, la app funciona igual. Anotar una serie nunca depende de la red.

**Dos perfiles, un mismo espacio.** Jorge y Sebastián comparten la base: no hay
aislamiento de datos entre cuentas — cualquiera de los dos, autenticado con
cualquier cuenta, puede ver y editar la rutina del otro. `profile` (`'jorge'` |
`'sebas'`) es un campo de CONTENIDO que dice de quién es cada ejercicio/sesión/
nota, no un límite de permisos — la app lo usa para mostrar la rutina correcta,
no Postgres para bloquear acceso. Qué perfil ve cada dispositivo es una
preferencia local (como el tema), elegida la primera vez y cambiable desde la
barra lateral en cualquier momento.

## Cómo funciona

```
  [ pantalla ] → repositorios → IndexedDB ──┐
                                  │         │ (misma transacción)
                                  ▼         ▼
                            registro    syncQueue
                                            │
                                            ▼
                               motor de sync → Supabase
```

1. **Toda escritura va primero a IndexedDB** y, en la *misma transacción*, deja
   una marca en `syncQueue`. Si se cierra la pestaña en el medio, no puede pasar
   que el dato quede guardado pero sin anotar que falta subirlo.
2. **Cada 20 segundos** (y al volver a la pestaña, y al recuperar la conexión)
   el motor baja lo que cambió en el servidor y sube lo que haya en la cola.
3. **Conflictos**: gana la escritura más reciente, comparando `updatedAt`. Para
   un solo usuario en dos dispositivos es la regla correcta y predecible.
4. Cuando el pull trae cambios, las pantallas abiertas se recargan solas.

### Detalles que importan

- **Los ids de la rutina son deterministas** (`g1-0-pecho-press-…`,
  `calistenia-flexiones`), derivados del Excel. Los mismos ejercicios generan los
  mismos ids en cualquier dispositivo, así que el upsert los fusiona en vez de
  duplicarlos.
- **La semilla no se encola.** Sale del repo y es idéntica en todos lados; si se
  subiera, vincular un teléfono nuevo pisaría en el servidor el GIF o el nombre
  que hubieras personalizado.
- **Los borrados dejan lápida** (`deleted_at`), no un `DELETE`. Sin eso, borrar
  algo en el celular nunca se enteraría en la notebook.
- **El cursor del pull usa el reloj del servidor** (`server_updated_at`), no el
  del dispositivo, y se retrasa un segundo para no saltearse filas escritas en
  el mismo instante.
- **El tema es local**, el resto de las preferencias viaja. El celular puede
  estar en oscuro y la notebook en claro.
- **Las imágenes no se sincronizan**: son URLs a un CDN, no archivos.

## Puesta en marcha

### 1. Crear el proyecto en Supabase

Necesitás una organización con cupo libre (el plan Free permite 2 proyectos por
organización).

### 2. Aplicar el esquema

El esquema está versionado en [`supabase/migrations/0001_init.sql`](../supabase/migrations/0001_init.sql).
Se aplica desde el SQL Editor del panel de Supabase, o con la CLI:

```bash
supabase link --project-ref TU-REF
supabase db push
```

Crea 8 tablas con RLS activo, pero con una policy **compartida** (`using
(true)`) en vez de una de dueño: cualquier cuenta autenticada lee y escribe
cualquier fila. Esto bloquea a quien nunca vinculó una cuenta con la clave
publicable, pero no separa a Jorge de Sebastián — es la decisión explícita de
"somos dos amigos, no hace falta separar accesos".

### 3. Configurar las credenciales

```bash
cp .env.example .env.local
```

Completá los dos valores con los de **Project Settings → API Keys**:

```
NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_…
```

> La clave publicable viaja en el JavaScript del navegador. RLS exige estar
> autenticado, pero no separa cuentas entre sí — cualquiera con sesión ve todo,
> a propósito. **Nunca** pongas la `service_role` acá: esa se saltea RLS entera.

Reiniciá el dev server para que tome las variables.

### 4. Vincular cada dispositivo

En **Configuración → Sincronización**, poné tu correo y tocá *Enviarme el link*.
Te llega un magic link; lo abrís **en ese dispositivo** y queda vinculado. La
sesión se renueva sola, así que es una sola vez por dispositivo.

Jorge y Sebastián usan cada uno su propio correo (necesitan su propia sesión
para que su celular sincronice), pero como el acceso es compartido, cualquiera
de las dos cuentas ve y edita la rutina de ambos. La primera vez que se abre la
app en un dispositivo, un selector pregunta "¿Quién entrena?" — esa elección
es local a ese dispositivo y se puede cambiar después desde la barra lateral.

En el panel de Supabase, en **Authentication → URL Configuration**, agregá a
*Redirect URLs* las direcciones desde las que vayas a abrir la app
(`http://localhost:3000` y la del deploy, si la publicás).

### 5. Qué pasa la primera vez

- Si el servidor está **vacío**, este dispositivo sube todo su historial.
- Si el servidor **ya tiene datos**, este dispositivo los recibe y solo sube lo
  que hubiera creado sin conexión.

Así el orden en que vinculás los dispositivos no cambia el resultado.

## Estado y diagnóstico

La barra lateral muestra un chip con el estado: *todo sincronizado*, *N sin
subir*, *sincronizando* o *error*. Lleva a Configuración, donde están la última
sincronización, los cambios pendientes y el botón de forzar.

Cerrar sesión **no borra nada**: los datos siguen en el dispositivo.
