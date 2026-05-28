-- =============================================================================
-- 003_realtime.sql
-- Habilitar Supabase Realtime sobre las tablas que la UI escucha.
-- =============================================================================

-- La publicación supabase_realtime existe por defecto en proyectos Supabase.
-- Si la migración se corre contra una base local recién creada que no la tenga,
-- se crea vacía.
do $$
begin
    if not exists (
        select 1 from pg_publication where pubname = 'supabase_realtime'
    ) then
        create publication supabase_realtime;
    end if;
end$$;

-- Añadir cada tabla solo si todavía no está en la publicación.
do $$
declare
    t text;
begin
    for t in
        select unnest(array[
            'partidas',
            'jugadores',
            'respuestas',
            'partida_preguntas'
        ])
    loop
        if not exists (
            select 1
              from pg_publication_tables
             where pubname = 'supabase_realtime'
               and schemaname = 'public'
               and tablename = t
        ) then
            execute format('alter publication supabase_realtime add table public.%I', t);
        end if;
    end loop;
end$$;

-- Asegurar que los UPDATE envíen el row completo (necesario para que la UI
-- vea, por ejemplo, los puntos nuevos del jugador).
alter table public.partidas    replica identity full;
alter table public.jugadores   replica identity full;
alter table public.respuestas  replica identity full;
