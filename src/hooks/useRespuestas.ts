import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Respuesta } from "@/types/database";

function key(partidaId: string | null | undefined, preguntaId: string | null | undefined) {
  return ["respuestas", partidaId, preguntaId] as const;
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
        () => {
          qc.invalidateQueries({ queryKey: key(partidaId, preguntaId) });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [partidaId, preguntaId, qc]);

  return query;
}
