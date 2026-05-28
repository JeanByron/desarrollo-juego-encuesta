import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Partida } from "@/types/database";

const QUERY_KEY = ["partida-activa"] as const;

// Obtiene la partida en estado 'lobby' o 'en_curso' (a lo más una).
// Si no hay ninguna, devuelve la última finalizada para poder mostrar el ranking.
async function fetchPartidaActiva(): Promise<Partida | null> {
  const { data: enJuego, error: errEnJuego } = await supabase
    .from("partidas")
    .select("*")
    .in("estado", ["lobby", "en_curso"])
    .order("creada_en", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (errEnJuego) throw errEnJuego;
  if (enJuego) return enJuego;

  const { data: ultima, error: errUltima } = await supabase
    .from("partidas")
    .select("*")
    .order("creada_en", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (errUltima) throw errUltima;
  return ultima ?? null;
}

export function usePartidaActiva() {
  const qc = useQueryClient();
  const query = useQuery({ queryKey: QUERY_KEY, queryFn: fetchPartidaActiva });

  useEffect(() => {
    const channel = supabase
      .channel("realtime:partidas")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "partidas" },
        (payload) => {
          // En lugar de hacer un fetch nuevo, mergeamos el row recibido
          const nueva = payload.new as Partida | undefined;
          if (nueva && (nueva.estado === "lobby" || nueva.estado === "en_curso")) {
            qc.setQueryData(QUERY_KEY, nueva);
          } else {
            // Si pasó a finalizada, invalida y deja que la query se refresque
            qc.invalidateQueries({ queryKey: QUERY_KEY });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  return query;
}
