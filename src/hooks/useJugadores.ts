import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Jugador } from "@/types/database";

function queryKey(partidaId: string | null | undefined) {
  return ["jugadores", partidaId] as const;
}

// Mismo orden que usa la consulta inicial: más puntos primero y, a igualdad,
// quien entró antes. Lo aplicamos también al parchear la caché en vivo para que
// la lista quede idéntica a la que devolvería la base.
function ordenarJugadores(lista: Jugador[]): Jugador[] {
  return [...lista].sort(
    (a, b) => b.puntos - a.puntos || a.fecha_ingreso.localeCompare(b.fecha_ingreso)
  );
}

async function fetchJugadores(partidaId: string): Promise<Jugador[]> {
  const { data, error } = await supabase
    .from("jugadores")
    .select("*")
    .eq("partida_id", partidaId)
    .order("puntos", { ascending: false })
    .order("fecha_ingreso", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export function useJugadores(partidaId: string | null | undefined) {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: queryKey(partidaId),
    queryFn: () => fetchJugadores(partidaId as string),
    enabled: !!partidaId
  });

  useEffect(() => {
    if (!partidaId) return;
    const channel = supabase
      .channel(`realtime:jugadores:${partidaId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "jugadores", filter: `partida_id=eq.${partidaId}` },
        (payload) => {
          // En vez de re-consultar TODA la lista en cada evento (lo que con N
          // jugadores cuesta NxN consultas a la base), aplicamos el cambio que
          // ya viene en el propio evento. La query inicial trae la lista
          // completa una vez; aquí solo la mantenemos al día.
          const cache = qc.getQueryData<Jugador[]>(queryKey(partidaId));
          if (!cache) {
            // La carga inicial aún está en vuelo: garantizamos no perder este
            // cambio con UN refetch puntual (React Query deduplica si ya hay
            // uno en curso). Solo ocurre en ese breve instante, no por evento.
            qc.invalidateQueries({ queryKey: queryKey(partidaId) });
            return;
          }
          qc.setQueryData<Jugador[]>(queryKey(partidaId), (prev) => {
            if (!prev) return prev;
            if (payload.eventType === "DELETE") {
              const viejoId = (payload.old as Partial<Jugador>)?.id;
              return prev.filter((j) => j.id !== viejoId);
            }
            const fila = payload.new as Jugador;
            if (!fila?.id || fila.partida_id !== partidaId) return prev;
            const sinFila = prev.filter((j) => j.id !== fila.id);
            return ordenarJugadores([...sinFila, fila]);
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [partidaId, qc]);

  return query;
}
