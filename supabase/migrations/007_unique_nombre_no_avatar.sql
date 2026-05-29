-- Cambia la restricción de unicidad: en vez de bloquear el mismo avatar,
-- ahora se bloquea el mismo nombre dentro de una partida.
alter table public.jugadores
  drop constraint if exists jugadores_partida_id_avatar_key;

-- Nota: PostgreSQL NO soporta "ADD CONSTRAINT IF NOT EXISTS"; usamos
-- drop-then-add para que la migración sea reejecutable sin error.
alter table public.jugadores
  drop constraint if exists jugadores_partida_id_nombre_key;

alter table public.jugadores
  add constraint jugadores_partida_id_nombre_key
  unique (partida_id, nombre);
