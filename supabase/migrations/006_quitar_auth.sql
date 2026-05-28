-- =============================================================================
-- 006_quitar_auth.sql
-- Permite que el rol anon (sin login) pueda usar las RPCs de la profesora
-- y leer/editar preguntas. Esto elimina la necesidad de autenticarse.
-- =============================================================================

-- Permitir que anon llame todas las RPCs
grant execute on function public.avanzar_a_pregunta_aleatoria(uuid) to anon;
grant execute on function public.registrar_respuesta_correcta(uuid) to anon;
grant execute on function public.registrar_respuesta_incorrecta(uuid) to anon;
grant execute on function public.finalizar_partida(uuid) to anon;
grant execute on function public.reiniciar_partida() to anon;

-- Permitir que anon lea preguntas (con respuesta incluida)
drop policy if exists preguntas_select_anon on public.preguntas;
create policy preguntas_select_anon on public.preguntas
    for select using (true);

-- Permitir que anon inserte, actualice y elimine preguntas
drop policy if exists preguntas_insert_anon on public.preguntas;
create policy preguntas_insert_anon on public.preguntas
    for insert with check (true);

drop policy if exists preguntas_update_anon on public.preguntas;
create policy preguntas_update_anon on public.preguntas
    for update using (true) with check (true);

drop policy if exists preguntas_delete_anon on public.preguntas;
create policy preguntas_delete_anon on public.preguntas
    for delete using (true);

-- Permitir que anon haga update/delete en partidas (para RPCs que no son SECURITY DEFINER)
drop policy if exists partidas_anon_all on public.partidas;
create policy partidas_anon_all on public.partidas
    for all using (true) with check (true);

-- Permitir que anon haga update en jugadores (para sumar puntos)
drop policy if exists jugadores_anon_all on public.jugadores;
create policy jugadores_anon_all on public.jugadores
    for all using (true) with check (true);

-- Permitir que anon haga update/delete en respuestas
drop policy if exists respuestas_anon_all on public.respuestas;
create policy respuestas_anon_all on public.respuestas
    for all using (true) with check (true);
