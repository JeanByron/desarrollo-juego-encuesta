-- =============================================================================
-- 010_nivel_en_caliente_y_nombre_50.sql
-- 1) Permite elegir el NIVEL de dificultad de la siguiente pregunta "en caliente"
--    (parámetro p_nivel en avanzar_a_pregunta_aleatoria; null = cualquier nivel).
-- 2) Sube el largo máximo del nombre de jugador de 30 a 50 caracteres.
--
-- Ejecuta este archivo en el SQL Editor de Supabase.
-- =============================================================================

-- 1) Nombre hasta 50 caracteres ------------------------------------------------
alter table public.jugadores drop constraint if exists jugadores_nombre_check;
alter table public.jugadores
  add constraint jugadores_nombre_check check (length(trim(nombre)) between 1 and 50);

-- 2) Avanzar a una pregunta del nivel elegido ----------------------------------
-- Quitamos la versión de 1 argumento para evitar ambigüedad con la nueva (que
-- tiene p_nivel con valor por defecto null).
drop function if exists public.avanzar_a_pregunta_aleatoria(uuid);

create or replace function public.avanzar_a_pregunta_aleatoria(
  p_partida_id uuid,
  p_nivel int default null
)
returns uuid
language plpgsql
security definer
as $$
declare
    v_pregunta_id uuid;
begin
    -- Pregunta activa, del nivel pedido (o cualquiera) y no usada en la partida.
    select p.id
      into v_pregunta_id
      from public.preguntas p
     where p.activa = true
       and (p_nivel is null or p.nivel = p_nivel)
       and not exists (
           select 1 from public.partida_preguntas pp
            where pp.partida_id = p_partida_id
              and pp.pregunta_id = p.id
       )
     order by random()
     limit 1;

    if v_pregunta_id is null then
        -- Ya se usaron todas las de ese nivel: reciclamos solo ese nivel.
        delete from public.partida_preguntas
         where partida_id = p_partida_id
           and pregunta_id in (
               select id from public.preguntas
                where p_nivel is null or nivel = p_nivel
           );
        select p.id into v_pregunta_id
          from public.preguntas p
         where p.activa = true
           and (p_nivel is null or p.nivel = p_nivel)
         order by random()
         limit 1;
    end if;

    if v_pregunta_id is null then
        raise exception 'No hay preguntas activas para ese nivel';
    end if;

    insert into public.partida_preguntas (partida_id, pregunta_id)
    values (p_partida_id, v_pregunta_id)
    on conflict do nothing;

    update public.partidas
       set pregunta_actual_id = v_pregunta_id,
           estado = 'en_curso',
           fecha_inicio = coalesce(fecha_inicio, now())
     where id = p_partida_id;

    return v_pregunta_id;
end;
$$;

grant execute on function public.avanzar_a_pregunta_aleatoria(uuid, int) to anon, authenticated;
