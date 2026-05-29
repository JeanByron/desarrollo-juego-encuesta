-- =============================================================================
-- DEPLOY COMPLETO — Kahoot Cultura General
-- =============================================================================
-- Este archivo consolida las 5 migraciones en un solo script.
-- Ejecútalo EN UNA SOLA VEZ en el SQL Editor de Supabase Dashboard.
-- =============================================================================


-- =============================================================================
-- 001_schema.sql — Tablas, triggers y RPCs
-- =============================================================================

create extension if not exists "pgcrypto";

-- PARTIDAS
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

-- JUGADORES
create table if not exists public.jugadores (
    id              uuid primary key default gen_random_uuid(),
    partida_id      uuid not null references public.partidas(id) on delete cascade,
    nombre          text not null check (length(trim(nombre)) between 1 and 30),
    avatar          text not null,
    puntos          int  not null default 0,
    estado          text not null default 'conectado'
                    check (estado in ('conectado','desconectado')),
    fecha_ingreso   timestamptz not null default now(),
    unique (partida_id, avatar)
);

create index if not exists jugadores_partida_idx on public.jugadores (partida_id);
create index if not exists jugadores_puntos_idx on public.jugadores (partida_id, puntos desc);

-- PREGUNTAS
create table if not exists public.preguntas (
    id              uuid primary key default gen_random_uuid(),
    pregunta        text not null,
    respuesta       text,
    categoria       text not null default 'General',
    nivel           int  not null default 1 check (nivel between 1 and 5),
    activa          boolean not null default true,
    creada_en       timestamptz not null default now()
);

create index if not exists preguntas_activa_idx on public.preguntas (activa);
create index if not exists preguntas_categoria_idx on public.preguntas (categoria);

-- PARTIDA_PREGUNTAS (evita repetir preguntas en la misma partida)
create table if not exists public.partida_preguntas (
    partida_id  uuid not null references public.partidas(id) on delete cascade,
    pregunta_id uuid not null references public.preguntas(id) on delete cascade,
    mostrada_en timestamptz not null default now(),
    primary key (partida_id, pregunta_id)
);

-- RESPUESTAS
create table if not exists public.respuestas (
    id                  uuid primary key default gen_random_uuid(),
    partida_id          uuid not null references public.partidas(id) on delete cascade,
    pregunta_id         uuid not null references public.preguntas(id) on delete cascade,
    jugador_id          uuid not null references public.jugadores(id) on delete cascade,
    timestamp_servidor  timestamptz not null default clock_timestamp(),
    orden_respuesta     int,
    resultado           text not null default 'pendiente'
                        check (resultado in ('pendiente','correcto','incorrecto')),
    unique (partida_id, pregunta_id, jugador_id)
);

create index if not exists respuestas_partida_idx on public.respuestas (partida_id);
create index if not exists respuestas_pregunta_idx on public.respuestas (partida_id, pregunta_id, timestamp_servidor asc);
create index if not exists respuestas_jugador_idx on public.respuestas (jugador_id);

-- TRIGGER: asignar orden_respuesta automáticamente
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

-- RPC: registrar_respuesta_correcta
-- Suma puntos según el nivel de la pregunta: nivel * 100
-- (nivel 1 = 100, nivel 2 = 200, ... nivel 5 = 500).
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

-- RPC: registrar_respuesta_incorrecta
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

-- RPC: avanzar_a_pregunta_aleatoria
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

-- RPC: finalizar_partida
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

-- RPC: reiniciar_partida
create or replace function public.reiniciar_partida()
returns uuid
language plpgsql
security definer
as $$
declare
    v_partida_id uuid;
begin
    update public.partidas
       set estado = 'finalizada',
           fecha_fin = coalesce(fecha_fin, now())
     where estado in ('lobby','en_curso');

    insert into public.partidas default values
    returning id into v_partida_id;

    return v_partida_id;
end;
$$;


-- =============================================================================
-- 002_rls.sql — Tabla profesoras, RLS, políticas, grants
-- =============================================================================

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

-- Habilitar RLS
alter table public.partidas           enable row level security;
alter table public.jugadores          enable row level security;
alter table public.preguntas          enable row level security;
alter table public.partida_preguntas  enable row level security;
alter table public.respuestas         enable row level security;
alter table public.profesoras         enable row level security;

-- PARTIDAS
drop policy if exists partidas_select_all on public.partidas;
create policy partidas_select_all on public.partidas
    for select using (true);

drop policy if exists partidas_admin_all on public.partidas;
create policy partidas_admin_all on public.partidas
    for all
    using (public.es_profesora())
    with check (public.es_profesora());

-- JUGADORES
drop policy if exists jugadores_select_all on public.jugadores;
create policy jugadores_select_all on public.jugadores
    for select using (true);

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

drop policy if exists jugadores_update_self on public.jugadores;
create policy jugadores_update_self on public.jugadores
    for update
    using (true)
    with check (true);

drop policy if exists jugadores_admin_all on public.jugadores;
create policy jugadores_admin_all on public.jugadores
    for all
    using (public.es_profesora())
    with check (public.es_profesora());

-- PREGUNTAS
drop policy if exists preguntas_select_admin on public.preguntas;
create policy preguntas_select_admin on public.preguntas
    for select using (public.es_profesora());

drop policy if exists preguntas_admin_all on public.preguntas;
create policy preguntas_admin_all on public.preguntas
    for all
    using (public.es_profesora())
    with check (public.es_profesora());

-- Vista pública (sin columna respuesta)
create or replace view public.preguntas_publicas as
    select id, pregunta, categoria, nivel, activa
      from public.preguntas;

grant select on public.preguntas_publicas to anon, authenticated;

-- PARTIDA_PREGUNTAS
drop policy if exists partida_preguntas_select_all on public.partida_preguntas;
create policy partida_preguntas_select_all on public.partida_preguntas
    for select using (true);

drop policy if exists partida_preguntas_admin_all on public.partida_preguntas;
create policy partida_preguntas_admin_all on public.partida_preguntas
    for all
    using (public.es_profesora())
    with check (public.es_profesora());

-- RESPUESTAS
drop policy if exists respuestas_select_all on public.respuestas;
create policy respuestas_select_all on public.respuestas
    for select using (true);

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

-- PROFESORAS
drop policy if exists profesoras_select_self on public.profesoras;
create policy profesoras_select_self on public.profesoras
    for select using (user_id = auth.uid());

drop policy if exists profesoras_insert_self on public.profesoras;
create policy profesoras_insert_self on public.profesoras
    for insert with check (user_id = auth.uid());

-- Grants para RPCs
grant execute on function public.avanzar_a_pregunta_aleatoria(uuid) to authenticated;
grant execute on function public.registrar_respuesta_correcta(uuid) to authenticated;
grant execute on function public.registrar_respuesta_incorrecta(uuid) to authenticated;
grant execute on function public.finalizar_partida(uuid) to authenticated;
grant execute on function public.reiniciar_partida() to authenticated;


-- =============================================================================
-- 003_realtime.sql — Activar Supabase Realtime
-- =============================================================================

do $$
begin
    if not exists (
        select 1 from pg_publication where pubname = 'supabase_realtime'
    ) then
        create publication supabase_realtime;
    end if;
end$$;

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

alter table public.partidas    replica identity full;
alter table public.jugadores   replica identity full;
alter table public.respuestas  replica identity full;


-- =============================================================================
-- 004_seed_preguntas.sql — 120+ preguntas de cultura general
-- =============================================================================

insert into public.preguntas (pregunta, respuesta, categoria, nivel)
select * from (values
    -- Geografía
    ('¿Cuál es el río más largo del mundo?', 'El Amazonas', 'Geografía', 1),
    ('¿Cuál es la montaña más alta del mundo?', 'El Everest', 'Geografía', 1),
    ('¿Cuál es el país más grande del mundo?', 'Rusia', 'Geografía', 1),
    ('¿Cuál es el país más pequeño del mundo?', 'La Ciudad del Vaticano', 'Geografía', 1),
    ('¿Cuál es el océano más grande del mundo?', 'El Océano Pacífico', 'Geografía', 1),
    ('¿Cuál es la cordillera más larga del mundo?', 'La Cordillera de los Andes', 'Geografía', 1),
    ('¿Cuál es la capital de Francia?', 'París', 'Geografía', 1),
    ('¿Cuál es la capital de Canadá?', 'Ottawa', 'Geografía', 1),
    ('¿Cuál es la capital de Australia?', 'Canberra', 'Geografía', 2),
    ('¿Dónde se encuentra la famosa Torre Eiffel?', 'En París, Francia', 'Geografía', 1),
    ('¿En qué país se encuentra ubicada la Casa Rosada?', 'En Argentina', 'Geografía', 1),
    ('¿Qué país tiene forma de bota?', 'Italia', 'Geografía', 1),
    ('¿Cuál es el "país del sol naciente"?', 'Japón', 'Geografía', 1),
    ('¿De qué isla son endémicos los lémures?', 'De Madagascar', 'Geografía', 2),
    ('¿Cuántos países reconocidos existen en todo el mundo?', '195 países', 'Geografía', 2),
    ('¿Cuál es el monte más alto de Ecuador?', 'El Chimborazo', 'Geografía', 2),
    ('¿Cómo se llama la casa presidencial en Colombia?', 'Casa de Nariño', 'Geografía', 1),
    ('¿Dónde está el lugar más frío habitado de la Tierra?', 'Oymyakon, en Siberia (−71 °C registrados)', 'Geografía', 3),
    ('¿De qué color es la bandera de México?', 'Verde, blanco y rojo', 'Geografía', 1),
    ('¿Cuántas estrellas aparecen en la bandera de la República Popular China?', 'Cinco estrellas', 'Geografía', 2),
    ('¿Cuántas estrellas hay en la bandera estadounidense?', '50 estrellas, una por cada estado', 'Geografía', 1),
    ('¿Cuál es la flor nacional de Japón?', 'El cerezo', 'Geografía', 2),

    -- Ciencia
    ('¿Cuál es el planeta más grande del sistema solar?', 'Júpiter', 'Ciencia', 1),
    ('¿Cuál es el planeta más cercano al Sol?', 'Mercurio', 'Ciencia', 1),
    ('¿Qué planeta del sistema solar tiene el año más corto?', 'Mercurio, con solo 88 días', 'Ciencia', 2),
    ('¿Qué planeta tiene más lunas del sistema solar?', 'Saturno, con más de 140 confirmadas', 'Ciencia', 2),
    ('¿En qué planetas llueven diamantes?', 'Neptuno y Urano', 'Ciencia', 3),
    ('¿Cómo se llaman las lunas de Marte?', 'Deimos y Fobos', 'Ciencia', 2),
    ('¿Cuál es el mineral más duro del planeta?', 'El diamante', 'Ciencia', 1),
    ('¿Cuál es el símbolo químico del oro?', 'Au', 'Ciencia', 1),
    ('¿Cuál es el símbolo químico de la plata?', 'Ag', 'Ciencia', 1),
    ('¿Cuál es el símbolo químico del cobre?', 'Cu', 'Ciencia', 1),
    ('¿Qué elemento químico tiene el símbolo "Na"?', 'Sodio', 'Ciencia', 1),
    ('¿Cuál es la fórmula química del agua?', 'H₂O', 'Ciencia', 1),
    ('¿Cuál fue el primer metal que empleó el hombre?', 'El cobre', 'Ciencia', 2),
    ('Si elevas cualquier número a 0, ¿qué resultado obtienes siempre?', '1', 'Ciencia', 1),
    ('¿Cuánto vale el número Pi?', '3,1416', 'Ciencia', 2),
    ('¿Cómo se llama al resultado de una multiplicación?', 'Producto', 'Ciencia', 1),
    ('¿Cuál es el área de un triángulo?', 'Base por altura sobre dos', 'Ciencia', 1),
    ('¿Cuántos lados tiene un heptágono?', 'Siete lados', 'Ciencia', 1),
    ('El triángulo que tiene sus tres lados iguales, ¿cómo se llama?', 'Triángulo equilátero', 'Ciencia', 1),
    ('¿Cómo se llama el proceso por el cual las plantas obtienen alimento?', 'La fotosíntesis', 'Ciencia', 1),
    ('¿Cuándo se extinguieron los dinosaurios?', 'Hace 66 millones de años', 'Ciencia', 2),
    ('¿Cuándo se extinguieron los mamuts?', 'Hace unos 4.000 años', 'Ciencia', 3),

    -- Cuerpo humano
    ('¿Cuántos dientes tenemos los humanos adultos?', '32 dientes', 'Cuerpo humano', 1),
    ('¿Qué cantidad de huesos tiene un adulto en su cuerpo?', '206 huesos', 'Cuerpo humano', 2),
    ('¿Cuántos huesos conforman el cráneo humano?', '8 huesos', 'Cuerpo humano', 2),
    ('¿Cómo se llama el hueso más pequeño del cuerpo humano?', 'El estribo', 'Cuerpo humano', 2),
    ('¿Cuál es el hueso más fuerte y más largo del cuerpo humano?', 'El fémur', 'Cuerpo humano', 1),
    ('¿Cuál es el órgano más grande del cuerpo humano?', 'La piel', 'Cuerpo humano', 1),
    ('¿En qué lugar del cuerpo se produce la insulina?', 'En el páncreas', 'Cuerpo humano', 2),
    ('¿Cómo se llama la parte del ojo que es sensible a la luz?', 'La retina', 'Cuerpo humano', 2),
    ('¿Qué pigmento da color a nuestra piel?', 'La melanina', 'Cuerpo humano', 2),
    ('¿Cuántas válvulas tiene el corazón?', '4: mitral, tricúspide, aórtica y pulmonar', 'Cuerpo humano', 3),
    ('¿Cuánto mide aproximadamente el intestino delgado de un adulto?', 'Entre 6 y 7 metros', 'Cuerpo humano', 2),
    ('¿Cuántos litros de saliva produce una persona al día en promedio?', 'Entre 1 y 2 litros', 'Cuerpo humano', 3),
    ('¿Qué órgano sigue funcionando varios minutos después de la muerte?', 'El oído', 'Cuerpo humano', 3),
    ('¿En el cuerpo humano, qué pulmón es más grande, el derecho o el izquierdo?', 'El derecho', 'Cuerpo humano', 2),
    ('¿Cómo se llama el espacio entre las cejas?', 'Glabela', 'Cuerpo humano', 3),
    ('¿Cómo se llama la piel entre los orificios nasales?', 'Columela', 'Cuerpo humano', 3),
    ('¿Cómo se llama el área con forma de media luna en la base de la uña?', 'Lúnula', 'Cuerpo humano', 3),
    ('¿Qué sustancia producen los enamorados?', 'Feniletilamina', 'Cuerpo humano', 3),
    ('¿Qué instrumento se usa para escuchar los latidos del corazón?', 'Fonendoscopio', 'Cuerpo humano', 2),
    ('¿Qué es la onicofagia?', 'Hábito de comerse las uñas', 'Cuerpo humano', 3),
    ('¿Qué es la dysania?', 'Incapacidad de poder levantarse temprano en la mañana', 'Cuerpo humano', 3),
    ('Si tienes acrofobia, ¿a qué le tienes miedo?', 'A las alturas', 'Cuerpo humano', 2),
    ('¿Qué partes del cuerpo crecen toda la vida?', 'Las orejas y la nariz', 'Cuerpo humano', 2),
    ('¿Cuáles son los cinco sabores?', 'Dulce, amargo, ácido, salado y umami', 'Cuerpo humano', 2),

    -- Animales
    ('¿Cuáles son los únicos mamíferos que pueden volar?', 'Los murciélagos', 'Animales', 1),
    ('¿Cuántos corazones tiene un gusano de tierra?', 'Cinco', 'Animales', 2),
    ('¿Cuántos corazones tiene un pulpo?', 'Tres corazones', 'Animales', 2),
    ('¿Cuántas patas tiene una araña?', 'Ocho', 'Animales', 1),
    ('¿Cuál es el único mamífero que no puede saltar?', 'El elefante', 'Animales', 2),
    ('¿Cuál es el único mamífero que pone huevos?', 'El ornitorrinco', 'Animales', 2),
    ('¿De qué se alimenta el oso panda?', 'De hojas de bambú', 'Animales', 1),
    ('¿Cuál es el animal con la mordida más grande del mundo?', 'El hipopótamo', 'Animales', 2),
    ('¿Cuántos dientes tiene un tiburón?', 'Alrededor de 3000 dientes', 'Animales', 2),
    ('¿Cuál es el mamífero acuático más grande del mundo?', 'La ballena azul', 'Animales', 1),
    ('¿Cuál fue el primer perro que llegó al espacio?', 'Laika', 'Animales', 2),
    ('¿Qué animal ríe cuando le hacen cosquillas?', 'La rata', 'Animales', 3),
    ('¿Qué animal duerme con un ojo abierto?', 'El delfín', 'Animales', 2),
    ('¿Qué ave no puede volar pero corre muy rápido?', 'El avestruz', 'Animales', 1),
    ('¿Qué ave puede volar hacia atrás?', 'El colibrí', 'Animales', 2),
    ('¿Cuál es la serpiente más larga del mundo?', 'La pitón reticulada', 'Animales', 3),
    ('¿En qué país hay más camellos salvajes?', 'Australia', 'Animales', 3),
    ('¿Cómo se le llama al cerdo dedicado a la reproducción?', 'Padrón', 'Animales', 3),
    ('¿Cómo se le llama al conjunto de cerdos?', 'Piara', 'Animales', 3),
    ('¿Cómo se le llama a las tres clases de abejas que hay en un panal?', 'Obrera, zángano y reina', 'Animales', 2),
    ('¿Qué es un animal rumiante?', 'Animal que mastica lo que ya ha estado en el estómago', 'Animales', 2),
    ('¿Qué es un ovíparo?', 'Un animal que nace de un huevo', 'Animales', 1),
    ('¿Qué nombre técnico reciben los bigotes de los gatos?', 'Vibrisas', 'Animales', 3),
    ('¿Qué especie convierte a los insectos en zombies?', 'El hongo cordyceps', 'Animales', 3),

    -- Historia
    ('¿Cuál fue la primera civilización humana?', 'La civilización sumeria', 'Historia', 2),
    ('¿Qué volcán sepultó la ciudad de Pompeya?', 'El Vesubio', 'Historia', 2),
    ('¿Dónde se originaron los Juegos Olímpicos?', 'En Grecia', 'Historia', 1),
    ('¿Cuántos años duró la Primera Guerra Mundial?', 'De 1914 a 1918 (4 años)', 'Historia', 2),
    ('¿En qué año ocurrió el desastre de Chernobyl?', '1986', 'Historia', 3),
    ('¿Cuándo llegó el hombre a la Luna?', 'El 20 de julio de 1969', 'Historia', 2),
    ('¿Qué hombre puso por primera vez un pie en la Luna?', 'Neil Armstrong', 'Historia', 1),
    ('¿A qué grupo guerrillero perteneció el presidente Gustavo Petro?', 'Al M-19', 'Historia', 2),
    ('¿Qué hacían los egipcios en señal de luto cuando moría un gato?', 'Se depilaban una ceja', 'Historia', 3),
    ('¿Cómo se le llama al suicidio de un guerrero de la antigüedad en Japón?', 'Seppuku', 'Historia', 3),
    ('¿Cuáles son los cinco colores de los anillos olímpicos?', 'Azul, negro, rojo, amarillo y verde', 'Historia', 2),

    -- Cultura y Literatura
    ('¿Cuál es el primer libro de la Biblia?', 'El Génesis', 'Cultura', 1),
    ('¿Cuál es el último libro de la Biblia?', 'El Apocalipsis', 'Cultura', 1),
    ('¿Quién traicionó a Jesús según los escritos bíblicos?', 'Judas Iscariote', 'Cultura', 1),
    ('¿Cuál es el libro sagrado del Islam?', 'El Corán', 'Cultura', 1),
    ('¿A quién le crecía la nariz cuando mentía?', 'A Pinocho', 'Cultura', 1),
    ('¿Quién "sabía que no sabía nada"?', 'Sócrates', 'Cultura', 2),
    ('¿Quién escribió Cien años de soledad?', 'Gabriel García Márquez', 'Cultura', 1),
    ('¿A quién le llamaban "el Manco de Lepanto"?', 'A Miguel de Cervantes Saavedra', 'Cultura', 2),
    ('¿Quién pintó la Mona Lisa?', 'Leonardo da Vinci', 'Cultura', 1),
    ('¿Cómo se llamaban los cuatro mosqueteros?', 'Athos, Porthos, Aramis y D''Artagnan', 'Cultura', 2),
    ('En la mitología griega, ¿qué perro de tres cabezas custodia las puertas del inframundo?', 'Cerbero', 'Cultura', 2),
    ('¿Cuál es el color que representa la esperanza?', 'El verde', 'Cultura', 1),
    ('¿Cuáles son los tres colores primarios?', 'Amarillo, azul y rojo', 'Cultura', 1),
    ('¿Cómo se llama el himno nacional de Francia?', 'La Marsellesa', 'Cultura', 2),
    ('¿Quién es el fundador de Facebook?', 'Mark Zuckerberg', 'Cultura', 2),
    ('¿Cuál es el nombre de la lengua oficial en China?', 'El mandarín', 'Cultura', 1),
    ('¿Cuántos años son un lustro?', 'Cinco años', 'Cultura', 1),
    ('¿Cuántos días tiene un año bisiesto?', '366 días', 'Cultura', 1),
    ('¿Cuál es el único número que tiene el mismo número de letras que su valor?', 'Cinco', 'Cultura', 2),
    ('¿Qué número romano representa el 500?', 'D', 'Cultura', 2),
    ('¿Con qué moneda pagas si vas a Japón?', 'El yen', 'Cultura', 1),
    ('¿Cuál es la moneda oficial de Estados Unidos?', 'El dólar', 'Cultura', 1),
    ('¿Cuánto dura un partido de fútbol?', '90 minutos (dos tiempos de 45)', 'Cultura', 1),
    ('¿Cuánto mide una piscina olímpica?', '50 metros', 'Cultura', 2),
    ('¿Qué empresa tiene los derechos comerciales del tablero Ouija?', 'Hasbro', 'Cultura', 3),
    ('En Fórmula 1, ¿qué significa la bandera amarilla con franjas rojas?', 'Que la pista está resbaladiza', 'Cultura', 3),
    ('¿Qué medicamento se usa para combatir las bacterias?', 'Un antibiótico', 'Cultura', 1),
    ('¿Qué medicamento se usa para bajar la fiebre?', 'Un antipirético', 'Cultura', 2),
    ('¿De dónde se extrae la piedra para la construcción?', 'De una cantera', 'Cultura', 2)
) as t(pregunta, respuesta, categoria, nivel)
where not exists (select 1 from public.preguntas);


-- =============================================================================
-- 005_seed_partida.sql — Partida inicial en lobby
-- =============================================================================

insert into public.partidas (estado)
select 'lobby'
where not exists (
    select 1 from public.partidas where estado in ('lobby','en_curso')
);


-- =============================================================================
-- ¡LISTO! Ahora ve a Authentication → Users → Add user para crear la profesora.
-- Luego ejecuta:
--
--   INSERT INTO public.profesoras (user_id, nombre)
--   SELECT id, 'Profesora' FROM auth.users WHERE email = 'TU_EMAIL_AQUI';
--
-- =============================================================================
