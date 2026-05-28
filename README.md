# Cultura General — Juego web tipo Kahoot para el salón de clase

Aplicación web educativa multijugador en tiempo real para que **una profesora**
proyecte preguntas de cultura general en su salón y los **estudiantes** compitan
desde su celular, tablet o computador — sin instalar nada.

- 🎮 Estudiantes entran a `/jugar`, eligen nombre + personaje (Los Simpson) y pulsan un **botón gigante** rojo cuando saben la respuesta.
- 👩‍🏫 La profesora controla todo desde `/admin`: inicia la partida, ve el orden exacto de respuesta, marca correcto/incorrecto y avanza preguntas.
- 🛰️ Sincronización en tiempo real con **Supabase Realtime**.
- 🎯 50+ estudiantes simultáneos sin problemas.

---

## Tabla de contenidos

1. [Arquitectura](#1-arquitectura)
2. [Modelo de datos](#2-modelo-de-datos)
3. [Estructura de carpetas](#3-estructura-de-carpetas)
4. [Flujos en tiempo real](#4-flujos-en-tiempo-real)
5. [Seguridad y RLS](#5-seguridad-y-rls)
6. [Despliegue paso a paso](#6-despliegue-paso-a-paso)
7. [Operación en clase](#7-operación-en-clase)
8. [Importar más preguntas](#8-importar-más-preguntas)
9. [Tecnologías](#9-tecnologías)

---

## 1. Arquitectura

```
        ┌────────────────────┐        ┌────────────────────┐
        │   /jugar  (alumno) │        │  /admin (profesora)│
        │ React + TS + Vite  │        │  React + TS + Vite │
        └──────────┬─────────┘        └──────────┬─────────┘
                   │  HTTPS / WSS                │
                   ▼                             ▼
        ┌─────────────────────────────────────────────────┐
        │                Supabase (BaaS)                  │
        │  ┌──────────────┐  ┌──────────────────────────┐ │
        │  │ Postgres     │  │ Realtime (WebSocket)     │ │
        │  │ - partidas   │  │  publica cambios de:     │ │
        │  │ - jugadores  │  │   partidas, jugadores,   │ │
        │  │ - preguntas  │  │   respuestas             │ │
        │  │ - respuestas │  │                          │ │
        │  └──────┬───────┘  └──────────────────────────┘ │
        │         │  RPCs (SECURITY DEFINER):              │
        │         │   avanzar_a_pregunta_aleatoria,        │
        │         │   registrar_respuesta_correcta/incorr, │
        │         │   finalizar_partida, reiniciar_partida │
        │  ┌──────▼──────────────────────────────────────┐ │
        │  │ Auth (solo la profesora)                    │ │
        │  └─────────────────────────────────────────────┘ │
        └─────────────────────────────────────────────────┘
```

**Puntos clave**

- Front-end **100% SPA**: lo despliegas en Vercel, Netlify, GitHub Pages, Cloudflare Pages, etc. Toda la lógica de juego vive en Postgres + RPCs.
- El **orden de llegada** se decide con `clock_timestamp()` del servidor + trigger que asigna `orden_respuesta` (1, 2, 3, ...). Así nadie puede hacer trampa cambiando su reloj.
- La **profesora** se autentica con Supabase Auth (rol `authenticated`). Solo sus llamadas RPC pueden sumar puntos o cambiar el estado de la partida.
- Los **estudiantes** son anónimos (`anon`): solo pueden insertar su propio registro de jugador y su pulsación del botón "¡Responder!". RLS bloquea cualquier otra escritura.
- **Una partida activa a la vez** (estado `lobby` o `en_curso`). Al reiniciar se cierra la anterior.

---

## 2. Modelo de datos

```
partidas (1) ─────────────────────────────┐
   id  · estado · pregunta_actual_id      │
   fecha_inicio · fecha_fin               │
                                          │
jugadores                                 │
   id · partida_id ──────────────────────►│
   nombre · avatar · puntos · estado      │
                                          │
preguntas                                 │
   id · pregunta · respuesta              │   partida_preguntas
   categoria · nivel · activa             │   (partida_id, pregunta_id)
                                          │
respuestas                                │
   id · partida_id ──────────────────────►│
   pregunta_id · jugador_id               │
   timestamp_servidor · orden_respuesta   │
   resultado (pendiente/correcto/incorrecto)
```

Tres detalles de diseño que importan:

1. **`partidas.pregunta_actual_id`** es la "única fuente de verdad" sobre qué pregunta están viendo todos. Cuando la profesora avanza, se actualiza esa columna y Realtime propaga el cambio a todos los estudiantes simultáneamente.
2. **`respuestas.orden_respuesta`** lo asigna un *trigger* `BEFORE INSERT` (ver `001_schema.sql`). El cliente nunca decide su propio orden.
3. **`partida_preguntas`** evita repetir preguntas dentro de la misma partida. Cuando se agotan todas, la RPC vacía esa tabla y vuelve a empezar.

---

## 3. Estructura de carpetas

```
.
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
├── .env.example
├── public/
│   ├── favicon.svg
│   └── sonidos/                ← exito.mp3 + pato.mp3 (los pones tú)
├── supabase/
│   └── migrations/
│       ├── 001_schema.sql      ← tablas, índices, triggers, RPCs
│       ├── 002_rls.sql         ← Row Level Security
│       ├── 003_realtime.sql    ← publicación supabase_realtime
│       ├── 004_seed_preguntas.sql  ← 120+ preguntas tomadas del .docx
│       └── 005_seed_partida.sql    ← crea la primera partida en lobby
└── src/
    ├── App.tsx                 ← rutas
    ├── main.tsx
    ├── index.css               ← Tailwind + estilos de botón gigante
    ├── lib/
    │   ├── supabase.ts         ← cliente tipado
    │   ├── queryClient.ts      ← React Query
    │   └── utils.ts
    ├── types/
    │   └── database.ts         ← contrato TypeScript
    ├── store/
    │   ├── usePlayerStore.ts   ← Zustand: identidad del estudiante
    │   └── useAdminStore.ts    ← Zustand: gate de la profesora
    ├── hooks/
    │   ├── usePartidaActiva.ts
    │   ├── useJugadores.ts
    │   ├── usePreguntaActual.ts
    │   ├── useRespuestas.ts
    │   ├── usePreguntas.ts
    │   ├── useAcciones.ts      ← RPCs + insert de respuesta
    │   └── useSonidos.ts
    ├── data/
    │   └── personajes.ts       ← Catálogo Simpson (id, nombre, emoji, color)
    ├── components/
    │   ├── shared/             ← Boton, Avatar, Tarjeta, Layout, Logo, TablaPuntajes
    │   ├── jugador/            ← PantallaNombre, SeleccionPersonaje, PantallaEspera, PantallaJuego, PantallaFinal
    │   └── admin/              ← Login, Lobby, PanelJuego, GestorPreguntas, PantallaFinalAdmin
    └── pages/
        ├── Inicio.tsx          ← /
        ├── Jugador.tsx         ← /jugar
        └── Admin.tsx           ← /admin y /admin/preguntas
```

---

## 4. Flujos en tiempo real

Todos los hooks bajo `src/hooks/*` se suscriben con `supabase.channel(...)` a `postgres_changes` y, al recibir un evento, invalidan la query de React Query correspondiente. Esto da consistencia con **una sola fuente de verdad** (la base) y evita estados desincronizados.

### 4.1 Estudiante se conecta

1. Abre `/jugar` → se ejecuta `usePartidaActiva` que lee la partida en estado `lobby` o `en_curso`.
2. Ingresa nombre, elige avatar → `insert into jugadores`.
3. Realtime emite el `INSERT` → todos los clientes (incluyendo la profesora) ven al nuevo jugador en la tabla.

### 4.2 Profesora inicia la partida

1. Click en **Iniciar Juego** → `rpc('avanzar_a_pregunta_aleatoria', { p_partida_id })`.
2. La RPC selecciona una `pregunta` activa no usada, registra en `partida_preguntas`, pone `partidas.estado = 'en_curso'` y `pregunta_actual_id = <nueva>`.
3. Realtime emite `UPDATE` de `partidas` → estudiantes ven la pregunta y se les habilita el botón rojo.

### 4.3 Estudiante pulsa "¡Responder!"

1. Click → `insert into respuestas (partida_id, pregunta_id, jugador_id)`.
   - El trigger `trg_asignar_orden_respuesta` calcula el `orden_respuesta` antes de insertar.
   - `timestamp_servidor` lo pone el server (`clock_timestamp()`), no el cliente.
2. Realtime emite `INSERT` → la profesora ve el orden actualizado en su panel; todos los estudiantes ven el ranking de llegada de esa pregunta.
3. El botón rojo del que ya pulsó se vuelve verde y queda bloqueado (RLS + UI).

### 4.4 Profesora marca ✔ o ✖

- ✔ → `rpc('registrar_respuesta_correcta', { p_respuesta_id })` actualiza `respuestas.resultado = 'correcto'` y suma 1 punto al jugador. Luego se llama automáticamente a `avanzar_a_pregunta_aleatoria`.
- ✖ → `rpc('registrar_respuesta_incorrecta', ...)` marca la respuesta como incorrecta. La **pregunta sigue siendo la misma**, pero el "turno actual" del panel pasa automáticamente al siguiente jugador en la cola (el front busca el primer `resultado = 'pendiente'`).

### 4.5 Finalizar

- Botón **Finalizar Juego** → `rpc('finalizar_partida', ...)` → `estado = 'finalizada'`, `fecha_fin = now()`.
- Estudiantes y profesora ven el ranking final (top 3 con podio).
- Para reiniciar: **Nueva partida** → `rpc('reiniciar_partida')` cierra todo lo anterior y crea una partida limpia en `lobby`.

---

## 5. Seguridad y RLS

Las políticas viven en [`supabase/migrations/002_rls.sql`](supabase/migrations/002_rls.sql).

| Acción                                | anon (estudiante)                              | authenticated + profesoras (profesora) |
| ------------------------------------- | ---------------------------------------------- | -------------------------------------- |
| Ver partidas                          | ✅                                             | ✅                                     |
| Ver jugadores                         | ✅                                             | ✅                                     |
| Ver preguntas con respuesta           | ❌ (solo `preguntas_publicas` sin la columna)  | ✅                                     |
| Crearse a sí mismo como jugador       | ✅ (solo si la partida está en `lobby/en_curso`) | ✅                                     |
| Pulsar el botón "¡Responder!"         | ✅ (solo para la `pregunta_actual_id` activa)  | ✅                                     |
| Modificar puntos de un jugador        | ❌                                             | ✅ (vía RPC `registrar_respuesta_correcta`) |
| Cambiar `estado` o `pregunta_actual_id` de una partida | ❌                              | ✅ (vía RPCs)                          |
| CRUD del banco de preguntas           | ❌                                             | ✅                                     |

> ⚠️ El campo `VITE_ADMIN_PASSWORD` es solo un gate ligero para evitar que un alumno curioso entre a `/admin` por accidente. **No protege la base de datos.** La protección real es Supabase Auth + tabla `profesoras` + RLS.

### Crear la cuenta de la profesora

Después de aplicar las migraciones:

```sql
-- 1. Crea la cuenta en Auth (puedes hacerlo desde Supabase Studio > Authentication > Users > Add user).
--    Suponiendo email: profesora@colegio.edu
-- 2. Autorízala:
insert into public.profesoras (user_id, nombre)
select id, 'Profesora' from auth.users where email = 'profesora@colegio.edu';
```

Desde ese momento la profesora puede entrar a `/admin` con "Iniciar sesión" usando su email y contraseña.

---

## 6. Despliegue paso a paso

### 6.1 Supabase (backend, gratis)

1. Crea una cuenta en [supabase.com](https://supabase.com) y un **nuevo proyecto** (elige la región más cercana).
2. Cuando termine de provisionar, abre **SQL Editor** y ejecuta **en orden** los archivos de `supabase/migrations/`:
   1. `001_schema.sql`
   2. `002_rls.sql`
   3. `003_realtime.sql`
   4. `004_seed_preguntas.sql` (carga 120+ preguntas del documento de la profesora)
   5. `005_seed_partida.sql` (crea una partida vacía en lobby para que ya esté lista)
3. Ve a **Authentication → Users → Add user** y crea el usuario de la profesora (email + password).
4. Vuelve al **SQL Editor** y ejecuta:
   ```sql
   insert into public.profesoras (user_id, nombre)
   select id, 'Profesora' from auth.users where email = 'EL_EMAIL_DE_LA_PROFESORA';
   ```
5. Ve a **Settings → API** y copia:
   - `Project URL` → será `VITE_SUPABASE_URL`
   - `anon public key` → será `VITE_SUPABASE_ANON_KEY`

> Tip: en **Settings → API → Realtime** confirma que la publicación `supabase_realtime` está activa. La migración `003` ya añade las tablas correctas, pero conviene verificar.

### 6.2 Variables de entorno

```bash
cp .env.example .env
```

Edita `.env` con los valores que copiaste de Supabase:

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJI...
VITE_ADMIN_PASSWORD=cambia-esto
```

### 6.3 Desarrollo local

```bash
npm install
npm run dev
```

Abre <http://localhost:5173>. Para probar el flujo real:

- Ventana 1 (incógnito) → <http://localhost:5173/jugar> (alumno 1)
- Ventana 2 (incógnito) → <http://localhost:5173/jugar> (alumno 2)
- Ventana 3 (normal) → <http://localhost:5173/admin> → entra como profesora.

### 6.4 Producción — Vercel (recomendado)

```bash
npm install -g vercel
vercel
```

Cuando pregunte:
- **Framework**: Vite (autodetectado).
- **Build command**: `npm run build`.
- **Output directory**: `dist`.

Después, en el panel del proyecto en Vercel: **Settings → Environment Variables**, añade las tres variables `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_ADMIN_PASSWORD`. Redepliega.

Tu app queda en `https://<tu-proyecto>.vercel.app`. Para la clase comparte:
- Estudiantes: `https://<tu-proyecto>.vercel.app/jugar`
- Profesora: `https://<tu-proyecto>.vercel.app/admin`

> **Alternativas**: Netlify, Cloudflare Pages o GitHub Pages funcionan igual. El build es estático.

### 6.5 Dominio QR para la clase

Genera un QR (por ej. en [qrcode.show](https://qrcode.show)) apuntando a `/jugar` y proyéctalo en el tablero. Los estudiantes lo escanean y entran al juego desde su celular.

---

## 7. Operación en clase

| Paso | Acción de la profesora                                                       |
| ---- | ---------------------------------------------------------------------------- |
| 1    | Abre el proyector con `/admin` (logueada con su cuenta).                     |
| 2    | Si la partida anterior quedó abierta, pulsa **"Reiniciar lobby"**.           |
| 3    | Muestra el QR / URL `/jugar` a los estudiantes.                              |
| 4    | Ve los estudiantes ir apareciendo en la lista del **Lobby**.                 |
| 5    | Click en **🚀 Iniciar juego**. Sale la primera pregunta aleatoria.           |
| 6    | Lee la pregunta en voz alta. Los estudiantes pulsan el botón rojo.           |
| 7    | El primero en la cola aparece en **"Turno actual"** con sus botones ✔ / ✖.   |
| 8    | Escucha al estudiante en voz alta y pulsa ✔ (suena campana, +1 punto, pregunta siguiente) o ✖ (suena pato, pasa al siguiente). |
| 9    | Cuando quieras terminar, click en **🛑 Finalizar juego**. Sale el podio.     |
| 10   | Para una nueva ronda, **🎮 Nueva partida**.                                  |

---

## 8. Importar más preguntas

Ve a `/admin/preguntas` y usa la sección **📥 Importación masiva**.

Formato esperado (CSV o Excel) — solo `pregunta` es obligatorio:

| pregunta                                    | respuesta              | categoria   | nivel |
|---------------------------------------------|------------------------|-------------|-------|
| ¿Cuál es la capital de Brasil?              | Brasilia               | Geografía   | 1     |
| ¿Quién descubrió la penicilina?             | Alexander Fleming      | Historia    | 2     |
| ¿Cuál es el elemento más abundante del sol? | Hidrógeno              | Ciencia     | 2     |

Soporta `.csv`, `.xlsx`, `.xls`. Se inserta en lotes de 500 para que puedas subir miles de preguntas a la vez.

> Las 120+ preguntas del documento original `PREGUNTAS CULTURA GENERAL.docx` ya están cargadas por la migración `004_seed_preguntas.sql`. No necesitas importarlas a mano.

---

## 9. Tecnologías

- **React 18 + TypeScript** — UI tipada.
- **Vite 5** — build rápido, dev server con HMR.
- **TailwindCSS 3** — estética colorida, botones grandes, mobile-first.
- **Supabase JS v2** — Postgres + Auth + Realtime + Storage en una misma conexión.
- **@tanstack/react-query 5** — cache + sincronización + invalidación cuando llega un evento Realtime.
- **Zustand** — estado local persistido (identidad del estudiante en `localStorage`, gate de la profesora).
- **react-router-dom 6** — `/`, `/jugar`, `/admin`, `/admin/preguntas`.
- **PapaParse + SheetJS (xlsx)** — importación CSV/Excel en cliente.

---

## Decisiones y trade-offs

- **Identidad sin auth para alumnos**: prioriza UX en clase (un alumno no debe crear cuenta). Como contrapartida, un alumno podría suplantar el avatar de otro pulsando "responder" desde otro dispositivo. Mitigación: cada par `(partida_id, avatar)` es único; un solo `(partida_id, pregunta_id, jugador_id)` por respuesta; y RLS restringe escrituras a la pregunta actual.
- **Un solo botón de respuesta**: la profesora valida verbalmente. Es la mecánica pedida y, además, permite preguntas abiertas (no solo de múltiple opción). Si más adelante quieres añadir opciones A/B/C/D, solo hace falta extender `preguntas` con un `opciones jsonb` y un componente `OpcionesRespuesta`.
- **Orden por `clock_timestamp()`**: las redes WiFi escolares tienen latencias variables. El orden es del servidor, no del cliente, así que aún con jitter la posición es justa.
- **Una partida activa a la vez**: simplifica todo. Si necesitaras varias partidas paralelas (varios cursos), bastaría con eliminar la cláusula `where estado in ('lobby','en_curso') limit 1` en `usePartidaActiva` y enrutar por código de sala.

---

¡Listo para usar en tu clase! Si quieres añadir personajes, sonidos personalizados o categorías propias, el código está pensado para extenderse sin tocar la base.
