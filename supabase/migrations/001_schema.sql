-- =============================================================================
-- 001_schema.sql
-- Esquema base para el juego de cultura general (Kahoot-style)
-- =============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- PARTIDAS
-- ---------------------------------------------------------------------------
-- Solo una partida está "activa" en cada momento (la profesora controla).
-- estado: lobby | en_curso | finalizada
create table if not exists public.partidas (
    id              uuid primary key default gen_random_uuid(),
    estado          text not null default 'lobby'
                    check (estado in ('lobby','en_curso','finalizada')),
    pregunta_actual_id uuid,
    fecha_inicio    timestamptz,
    fecha_fin       timestamptz,
    creada_en       timestamptz not null default now()
);

create index if not exists partidas_estado_idx on public.partidas (estado);

-- ---------------------------------------------------------------------------
-- JUGADORES
-- ---------------------------------------------------------------------------
-- Cada jugador queda atado a una partida.
-- estado: conectado | desconectado
create table if not exists public.jugadores (
    id              uuid primary key default gen_random_uuid(),
    partida_id      uuid not null references public.partidas(id) on delete cascade,
    nombre          text not null check (length(trim(nombre)) between 1 and 30),
    avatar          text not null,
    puntos          int  not null default 0,
    estado          text not null default 'conectado'
                    check (estado in ('conectado','desconectado')),
    fecha_ingreso   timestamptz not null default now(),
    -- evita dos jugadores con el mismo avatar en la misma partida
    unique (partida_id, avatar)
);

create index if not exists jugadores_partida_idx on public.jugadores (partida_id);
create index if not exists jugadores_puntos_idx on public.jugadores (partida_id, puntos desc);

-- ---------------------------------------------------------------------------
-- PREGUNTAS
-- ---------------------------------------------------------------------------
-- Banco de preguntas reutilizable entre partidas.
-- categoria libre (Geografía, Ciencia, Historia, etc.).
-- nivel: 1 (fácil), 2 (medio), 3 (difícil).
create table if not exists public.preguntas (
    id              uuid primary key default gen_random_uuid(),
    pregunta        text not null,
    respuesta       text,              -- visible solo a la profesora
    categoria       text not null default 'General',
    nivel           int  not null default 1 check (nivel between 1 and 5),
    activa          boolean not null default true,
    creada_en       timestamptz not null default now()
);

create index if not exists preguntas_activa_idx on public.preguntas (activa);
create index if not exists preguntas_categoria_idx on public.preguntas (categoria);

-- ---------------------------------------------------------------------------
-- PREGUNTAS YA USADAS EN UNA PARTIDA
-- ---------------------------------------------------------------------------
-- Para evitar repetir la misma pregunta dentro de una misma partida.
create table if not exists public.partida_preguntas (
    partida_id  uuid not null references public.partidas(id) on delete cascade,
    pregunta_id uuid not null references public.preguntas(id) on delete cascade,
    mostrada_en timestamptz not null default now(),
    primary key (partida_id, pregunta_id)
);

-- ---------------------------------------------------------------------------
-- RESPUESTAS
-- ---------------------------------------------------------------------------
-- Cada vez que un jugador pulsa "¡Responder!" se crea un registro.
-- El orden de llegada se determina por timestamp_servidor (now() en el server).
-- resultado: pendiente | correcto | incorrecto
create table if not exists public.respuestas (
    id                  uuid primary key default gen_random_uuid(),
    partida_id          uuid not null references public.partidas(id) on delete cascade,
    pregunta_id         uuid not null references public.preguntas(id) on delete cascade,
    jugador_id          uuid not null references public.jugadores(id) on delete cascade,
    timestamp_servidor  timestamptz not null default clock_timestamp(),
    orden_respuesta     int,    -- se asigna en cliente o por trigger; útil para mostrar ranking
    resultado           text not null default 'pendiente'
                        check (resultado in ('pendiente','correcto','incorrecto')),
    -- un jugador no puede responder dos veces la misma pregunta en la misma partida
    unique (partida_id, pregunta_id, jugador_id)
);

create index if not exists respuestas_partida_idx on public.respuestas (partida_id);
create index if not exists respuestas_pregunta_idx on public.respuestas (partida_id, pregunta_id, timestamp_servidor asc);
create index if not exists respuestas_jugador_idx on public.respuestas (jugador_id);

-- ---------------------------------------------------------------------------
-- TRIGGER: asignar orden_respuesta automáticamente al insertar
-- ---------------------------------------------------------------------------
create or replace function public.asignar_orden_respuesta()
returns trigger
language plpgsql
as $$
begin
    select coalesce(max(orden_respuesta), 0) + 1
      into new.orden_respuesta
      from public.respuestas
     where partida_id = new.partida_id
       and pregunta_id = new.pregunta_id;
    return new;
end;
$$;

drop trigger if exists trg_asignar_orden_respuesta on public.respuestas;
create trigger trg_asignar_orden_respuesta
before insert on public.respuestas
for each row execute function public.asignar_orden_respuesta();

-- ---------------------------------------------------------------------------
-- RPC: registrar_respuesta_correcta(respuesta_id)
-- Marca la respuesta como correcta y suma puntos según el nivel de la pregunta:
-- nivel * 100 (nivel 1 = 100, nivel 2 = 200, ... nivel 5 = 500).
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- RPC: registrar_respuesta_incorrecta(respuesta_id)
-- Marca la respuesta como incorrecta (no se quitan puntos, se pasa el turno).
-- ---------------------------------------------------------------------------
create or replace function public.registrar_respuesta_incorrecta(p_respuesta_id uuid)
returns void
language plpgsql
security definer
as $$
begin
    update public.respuestas
       set resultado = 'incorrecto'
     where id = p_respuesta_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- RPC: avanzar_a_pregunta_aleatoria(partida_id)
-- Selecciona una pregunta activa que NO se haya usado en esa partida y la
-- pone como pregunta_actual_id de la partida.
-- ---------------------------------------------------------------------------
create or replace function public.avanzar_a_pregunta_aleatoria(p_partida_id uuid)
returns uuid
language plpgsql
security definer
as $$
declare
    v_pregunta_id uuid;
begin
    select p.id
      into v_pregunta_id
      from public.preguntas p
     where p.activa = true
       and not exists (
           select 1 from public.partida_preguntas pp
            where pp.partida_id = p_partida_id
              and pp.pregunta_id = p.id
       )
     order by random()
     limit 1;

    if v_pregunta_id is null then
        -- ya se usaron todas; reciclar el pool
        delete from public.partida_preguntas where partida_id = p_partida_id;
        select p.id into v_pregunta_id
          from public.preguntas p
         where p.activa = true
         order by random()
         limit 1;
    end if;

    if v_pregunta_id is null then
        raise exception 'No hay preguntas activas en el banco';
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

-- ---------------------------------------------------------------------------
-- RPC: finalizar_partida(partida_id)
-- ---------------------------------------------------------------------------
create or replace function public.finalizar_partida(p_partida_id uuid)
returns void
language plpgsql
security definer
as $$
begin
    update public.partidas
       set estado = 'finalizada',
           fecha_fin = now(),
           pregunta_actual_id = null
     where id = p_partida_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- RPC: reiniciar_partida() -> uuid
-- Crea una nueva partida en estado 'lobby' (sirve cuando la profesora va a
-- arrancar una sesión nueva en otro día/curso).
-- ---------------------------------------------------------------------------
create or replace function public.reiniciar_partida()
returns uuid
language plpgsql
security definer
as $$
declare
    v_partida_id uuid;
begin
    -- cerrar partidas que hayan quedado abiertas
    update public.partidas
       set estado = 'finalizada',
           fecha_fin = coalesce(fecha_fin, now())
     where estado in ('lobby','en_curso');

    insert into public.partidas default values
    returning id into v_partida_id;

    return v_partida_id;
end;
$$;
