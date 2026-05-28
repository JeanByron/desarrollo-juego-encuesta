-- =============================================================================
-- 005_seed_partida.sql
-- Crea una partida inicial en estado 'lobby' si no hay ninguna activa.
-- Esto permite que la primera vez que arranques la app ya haya algo a lo que
-- los estudiantes se puedan conectar.
-- =============================================================================
insert into public.partidas (estado)
select 'lobby'
where not exists (
    select 1 from public.partidas where estado in ('lobby','en_curso')
);
