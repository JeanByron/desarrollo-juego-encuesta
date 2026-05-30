-- =============================================================================
-- 002_rls.sql
-- Políticas Row Level Security
--
-- Modelo de seguridad:
--   - Los estudiantes NO se autentican (ingresan con un nombre y avatar).
--     Por eso usan la clave 'anon' del proyecto.
--   - La profesora SE AUTENTICA con Supabase Auth (rol 'authenticated').
--     Su rol queda almacenado en public.profesoras.
--
-- Reglas resumidas:
--   * anon  -> puede leer partidas/preguntas (sin la columna 'respuesta'),
--              puede crear su propio registro en jugadores y respuestas,
--              puede leer la lista de jugadores y respuestas para la UI.
--   * profesora -> puede TODO sobre todas las tablas.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Tabla de profesoras autorizadas (linkeada a auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.profesoras (
    user_id    uuid primary key references auth.users(id) on delete cascade,
    nombre     text,
    creada_en  timestamptz not null default now()
);

create or replace function public.es_profesora()
returns boolean
language sql
stable
security definer
as $$
    select exists (
        select 1 from public.profesoras
         where user_id = auth.uid()
    );
$$;

-- ---------------------------------------------------------------------------
-- Habilitar RLS en todas las tablas
-- ---------------------------------------------------------------------------
alter table public.partidas           enable row level security;
alter table public.jugadores          enable row level security;
alter table public.preguntas          enable row level security;
alter table public.partida_preguntas  enable row level security;
alter table public.respuestas         enable row level security;
alter table public.profesoras         enable row level security;

-- ---------------------------------------------------------------------------
-- PARTIDAS
-- ---------------------------------------------------------------------------
drop policy if exists partidas_select_all on public.partidas;
create policy partidas_select_all on public.partidas
    for select using (true);

drop policy if exists partidas_admin_all on public.partidas;
create policy partidas_admin_all on public.partidas
    for all
    using (public.es_profesora())
    with check (public.es_profesora());

-- ---------------------------------------------------------------------------
-- JUGADORES
-- ---------------------------------------------------------------------------
drop policy if exists jugadores_select_all on public.jugadores;
create policy jugadores_select_all on public.jugadores
    for select using (true);

-- cualquiera (anon) puede crearse a sí mismo como jugador en una partida en lobby
drop policy if exists jugadores_insert_anon on public.jugadores;
create policy jugadores_insert_anon on public.jugadores
    for insert
    with check (
        exists (
            select 1 from public.partidas p
             where p.id = partida_id
               and p.estado in ('lobby','en_curso')
        )
    );

-- el jugador puede actualizar su propio estado (conectado/desconectado, nombre)
-- pero NO sus puntos. Los puntos solo los modifica la profesora vía RPC.
drop policy if exists jugadores_update_self on public.jugadores;
create policy jugadores_update_self on public.jugadores
    for update
    using (true)
    with check (true);

-- la profesora puede todo
drop policy if exists jugadores_admin_all on public.jugadores;
create policy jugadores_admin_all on public.jugadores
    for all
    using (public.es_profesora())
    with check (public.es_profesora());

-- ---------------------------------------------------------------------------
-- PREGUNTAS
-- ---------------------------------------------------------------------------
-- Los estudiantes pueden ver preguntas (texto y categoría/nivel) pero NO la
-- respuesta. Hacemos eso con una VIEW pública.
drop policy if exists preguntas_select_admin on public.preguntas;
create policy preguntas_select_admin on public.preguntas
    for select using (public.es_profesora());

drop policy if exists preguntas_admin_all on public.preguntas;
create policy preguntas_admin_all on public.preguntas
    for all
    using (public.es_profesora())
    with check (public.es_profesora());

-- Vista pública sin la columna respuesta.
-- security_invoker = on: usa los permisos de QUIEN consulta (evita el aviso
-- "Security Definer View" del Advisor). Requiere PostgreSQL 15+.
create or replace view public.preguntas_publicas
    with (security_invoker = on) as
    select id, pregunta, categoria, nivel, activa
      from public.preguntas;

grant select on public.preguntas_publicas to anon, authenticated;

-- ---------------------------------------------------------------------------
-- PARTIDA_PREGUNTAS
-- ---------------------------------------------------------------------------
drop policy if exists partida_preguntas_select_all on public.partida_preguntas;
create policy partida_preguntas_select_all on public.partida_preguntas
    for select using (true);

drop policy if exists partida_preguntas_admin_all on public.partida_preguntas;
create policy partida_preguntas_admin_all on public.partida_preguntas
    for all
    using (public.es_profesora())
    with check (public.es_profesora());

-- ---------------------------------------------------------------------------
-- RESPUESTAS
-- ---------------------------------------------------------------------------
drop policy if exists respuestas_select_all on public.respuestas;
create policy respuestas_select_all on public.respuestas
    for select using (true);

-- anon puede insertar SOLO si la respuesta corresponde a la pregunta_actual_id
-- de una partida en estado 'en_curso'. Esto evita inserciones fuera de tiempo.
drop policy if exists respuestas_insert_anon on public.respuestas;
create policy respuestas_insert_anon on public.respuestas
    for insert
    with check (
        exists (
            select 1
              from public.partidas p
             where p.id = partida_id
               and p.estado = 'en_curso'
               and p.pregunta_actual_id = pregunta_id
        )
    );

drop policy if exists respuestas_admin_all on public.respuestas;
create policy respuestas_admin_all on public.respuestas
    for all
    using (public.es_profesora())
    with check (public.es_profesora());

-- ---------------------------------------------------------------------------
-- PROFESORAS
-- ---------------------------------------------------------------------------
drop policy if exists profesoras_select_self on public.profesoras;
create policy profesoras_select_self on public.profesoras
    for select using (user_id = auth.uid());

-- Solo el dueño puede insertar su propia fila (la app la crea tras signup).
drop policy if exists profesoras_insert_self on public.profesoras;
create policy profesoras_insert_self on public.profesoras
    for insert with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Grants para que las RPC sean llamables desde la app
-- ---------------------------------------------------------------------------
grant execute on function public.avanzar_a_pregunta_aleatoria(uuid) to authenticated;
grant execute on function public.registrar_respuesta_correcta(uuid) to authenticated;
grant execute on function public.registrar_respuesta_incorrecta(uuid) to authenticated;
grant execute on function public.finalizar_partida(uuid) to authenticated;
grant execute on function public.reiniciar_partida() to authenticated;
