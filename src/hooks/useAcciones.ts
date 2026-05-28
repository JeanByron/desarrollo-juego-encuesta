import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

// ---------------------------------------------------------------------------
// Acciones disparadas por la profesora autenticada (usan RPC con SECURITY DEFINER)
// ---------------------------------------------------------------------------

export function useAvanzarPregunta() {
  return useMutation({
    mutationFn: async (partidaId: string) => {
      const { data, error } = await supabase.rpc("avanzar_a_pregunta_aleatoria", {
        p_partida_id: partidaId
      });
      if (error) throw error;
      return data as string;
    }
  });
}

export function useMarcarCorrecta() {
  return useMutation({
    mutationFn: async (respuestaId: string) => {
      const { error } = await supabase.rpc("registrar_respuesta_correcta", {
        p_respuesta_id: respuestaId
      });
      if (error) throw error;
    }
  });
}

export function useMarcarIncorrecta() {
  return useMutation({
    mutationFn: async (respuestaId: string) => {
      const { error } = await supabase.rpc("registrar_respuesta_incorrecta", {
        p_respuesta_id: respuestaId
      });
      if (error) throw error;
    }
  });
}

export function useFinalizarPartida() {
  return useMutation({
    mutationFn: async (partidaId: string) => {
      const { error } = await supabase.rpc("finalizar_partida", { p_partida_id: partidaId });
      if (error) throw error;
    }
  });
}

export function useReiniciarPartida() {
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("reiniciar_partida", {});
      if (error) throw error;
      return data as string;
    }
  });
}

// ---------------------------------------------------------------------------
// Acción del estudiante: registrar pulsación de botón "¡Responder!"
// ---------------------------------------------------------------------------
export function useResponder() {
  return useMutation({
    mutationFn: async (input: { partidaId: string; preguntaId: string; jugadorId: string }) => {
      const { data, error } = await supabase
        .from("respuestas")
        .insert({
          partida_id: input.partidaId,
          pregunta_id: input.preguntaId,
          jugador_id: input.jugadorId
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  });
}
