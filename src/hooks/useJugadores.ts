import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Jugador } from "@/types/database";

function queryKey(partidaId: string | null | undefined) {
  return ["jugadores", partidaId] as const;
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
        () => {
          qc.invalidateQueries({ queryKey: queryKey(partidaId) });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [partidaId, qc]);

  return query;
}
