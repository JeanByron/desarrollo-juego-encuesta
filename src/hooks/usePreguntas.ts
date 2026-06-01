import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Pregunta } from "@/types/database";

const KEY = ["preguntas"] as const;

export function usePreguntas() {
  return useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<Pregunta[]> => {
      const { data, error } = await supabase
        .from("preguntas")
        .select("*")
        .order("creada_en", { ascending: false });
      if (error) throw error;
      return data ?? [];
    }
  });
}

export function useCrearPregunta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { pregunta: string; respuesta?: string | null; categoria: string; nivel: number }) => {
      const { error } = await supabase.from("preguntas").insert(input);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY })
  });
}

export function useActualizarPregunta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<Pregunta> & { id: string }) => {
      const { id, ...patch } = input;
      const { error } = await supabase.from("preguntas").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY })
  });
}

export function useEliminarPregunta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("preguntas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY })
  });
}

export function useImportarPreguntas() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rows: Array<{ pregunta: string; respuesta?: string | null; categoria?: string; nivel?: number }>) => {
      // Normalizamos defaults antes de mandar a la base.
      const normalizado = rows
        .filter((r) => r.pregunta?.trim())
        .map((r) => ({
          pregunta: r.pregunta.trim(),
          respuesta: r.respuesta?.toString().trim() || null,
          categoria: (r.categoria?.toString().trim() || "General"),
          nivel: Math.min(5, Math.max(1, Number(r.nivel) || 1))
        }));

      if (normalizado.length === 0) return { insertados: 0 };

      // Insertamos en lotes de 500 para no chocar con límites
      const lote = 500;
      let total = 0;
      for (let i = 0; i < normalizado.length; i += lote) {
        const slice = normalizado.slice(i, i + lote);
        const { error } = await supabase.from("preguntas").insert(slice);
        if (error) throw error;
        total += slice.length;
      }
      return { insertados: total };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY })
  });
}
