import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Pregunta, PreguntaPublica } from "@/types/database";

// Para estudiantes: solo metadatos y texto, NO la respuesta (RLS lo bloquea).
async function fetchPreguntaPublica(id: string): Promise<PreguntaPublica | null> {
  const { data, error } = await supabase
    .from("preguntas_publicas")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// Para la profesora autenticada: incluye la columna respuesta.
async function fetchPreguntaCompleta(id: string): Promise<Pregunta | null> {
  const { data, error } = await supabase
    .from("preguntas")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export function usePreguntaPublica(id: string | null | undefined) {
  return useQuery({
    queryKey: ["pregunta-publica", id],
    queryFn: () => fetchPreguntaPublica(id as string),
    enabled: !!id
  });
}

export function usePreguntaCompleta(id: string | null | undefined) {
  return useQuery({
    queryKey: ["pregunta-completa", id],
    queryFn: () => fetchPreguntaCompleta(id as string),
    enabled: !!id
  });
}
