-- =============================================================================
-- 007_puntos_por_nivel.sql
-- Los puntos por respuesta correcta pasan de 1 fijo a (nivel * 100):
--   nivel 1 = 100, nivel 2 = 200, nivel 3 = 300, nivel 4 = 400, nivel 5 = 500.
-- También se amplía el rango de niveles permitidos de 1..3 a 1..5.
--
-- Ejecuta este archivo en el SQL Editor de Supabase para aplicarlo a la BD.
-- =============================================================================

-- 1) Permitir niveles 1..5 (antes 1..3)
alter table public.preguntas
    drop constraint if exists preguntas_nivel_check;

alter table public.preguntas
    add constraint preguntas_nivel_check check (nivel between 1 and 5);

-- 2) Puntaje por nivel
create or replace function public.registrar_respuesta_correcta(p_respuesta_id uuid)
returns void
language plpgsql
security definer
as $$
declare
    v_jugador uuid;
    v_nivel   int;
begin
    select r.jugador_id, pr.nivel
      into v_jugador, v_nivel
      from public.respuestas r
      join public.preguntas pr on pr.id = r.pregunta_id
     where r.id = p_respuesta_id;

    if v_jugador is null then
        raise exception 'Respuesta no encontrada';
    end if;

    update public.respuestas
       set resultado = 'correcto'
     where id = p_respuesta_id;

    update public.jugadores
       set puntos = puntos + (coalesce(v_nivel, 1) * 100)
     where id = v_jugador;
end;
$$;
