import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Respuesta } from "@/types/database";

function key(partidaId: string | null | undefined, preguntaId: string | null | undefined) {
  return ["respuestas", partidaId, preguntaId] as const;
}

// Mismo orden que la consulta inicial: por hora de llegada al servidor (asc).
// Las marcas ISO 8601 se comparan bien como texto, así que el orden coincide
// con el `order by timestamp_servidor` de la base.
function ordenarRespuestas(lista: Respuesta[]): Respuesta[] {
  return [...lista].sort((a, b) =>
    a.timestamp_servidor.localeCompare(b.timestamp_servidor)
  );
}

async function fetchRespuestas(partidaId: string, preguntaId: string): Promise<Respuesta[]> {
  const { data, error } = await supabase
    .from("respuestas")
    .select("*")
    .eq("partida_id", partidaId)
    .eq("pregunta_id", preguntaId)
    .order("timestamp_servidor", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

// Devuelve, en orden de llegada, las respuestas a la pregunta actual.
// Se suscribe a cambios para que la profesora vea en vivo quién va llegando.
export function useRespuestas(
  partidaId: string | null | undefined,
  preguntaId: string | null | undefined
) {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: key(partidaId, preguntaId),
    queryFn: () => fetchRespuestas(partidaId as string, preguntaId as string),
    enabled: !!partidaId && !!preguntaId
  });

  useEffect(() => {
    if (!partidaId || !preguntaId) return;
    const channel = supabase
      .channel(`realtime:respuestas:${partidaId}:${preguntaId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "respuestas",
          filter: `pregunta_id=eq.${preguntaId}`
        },
        (payload) => {
          // Igual que en useJugadores: parcheamos la caché con el dato del
          // propio evento en vez de re-consultar toda la lista de respuestas.
          // Esto es lo que más alivia la base durante la ráfaga de pulsaciones.
          const cache = qc.getQueryData<Respuesta[]>(key(partidaId, preguntaId));
          if (!cache) {
            // Carga inicial en vuelo: un único refetch de seguridad (deduplicado).
            qc.invalidateQueries({ queryKey: key(partidaId, preguntaId) });
            return;
          }
          qc.setQueryData<Respuesta[]>(key(partidaId, preguntaId), (prev) => {
            if (!prev) return prev;
            if (payload.eventType === "DELETE") {
              const viejoId = (payload.old as Partial<Respuesta>)?.id;
              return prev.filter((r) => r.id !== viejoId);
            }
            const fila = payload.new as Respuesta;
            // El filtro del canal es solo por pregunta; confirmamos también la
            // partida para no mezclar respuestas de otra (misma condición que
            // usa la consulta inicial).
            if (!fila?.id || fila.partida_id !== partidaId || fila.pregunta_id !== preguntaId) {
              return prev;
            }
            const sinFila = prev.filter((r) => r.id !== fila.id);
            return ordenarRespuestas([...sinFila, fila]);
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [partidaId, preguntaId, qc]);

  return query;
}
