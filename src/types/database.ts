// =============================================================================
// Tipado de la base de datos.
// Si más adelante usas `supabase gen types typescript` puedes reemplazar este
// archivo por el generado automáticamente.
// =============================================================================

export type EstadoPartida = "lobby" | "en_curso" | "finalizada";
export type EstadoJugador = "conectado" | "desconectado";
export type ResultadoRespuesta = "pendiente" | "correcto" | "incorrecto";

export interface Partida {
  id: string;
  estado: EstadoPartida;
  pregunta_actual_id: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  creada_en: string;
}

export interface Jugador {
  id: string;
  partida_id: string;
  nombre: string;
  avatar: string;
  puntos: number;
  estado: EstadoJugador;
  fecha_ingreso: string;
}

export interface PreguntaPublica {
  id: string;
  pregunta: string;
  categoria: string;
  nivel: number;
  activa: boolean;
}

export interface Pregunta extends PreguntaPublica {
  respuesta: string | null;
  creada_en: string;
}

export interface Respuesta {
  id: string;
  partida_id: string;
  pregunta_id: string;
  jugador_id: string;
  timestamp_servidor: string;
  orden_respuesta: number;
  resultado: ResultadoRespuesta;
}

// ---------------------------------------------------------------------------
// Insert/Update helpers — campos opcionales que Postgres genera solo.
// ---------------------------------------------------------------------------
type JugadorInsert = {
  partida_id: string;
  nombre: string;
  avatar: string;
  id?: string;
  puntos?: number;
  estado?: EstadoJugador;
  fecha_ingreso?: string;
};

type RespuestaInsert = {
  partida_id: string;
  pregunta_id: string;
  jugador_id: string;
  id?: string;
  timestamp_servidor?: string;
  orden_respuesta?: number;
  resultado?: ResultadoRespuesta;
};

type PreguntaInsert = {
  pregunta: string;
  id?: string;
  respuesta?: string | null;
  categoria?: string;
  nivel?: number;
  activa?: boolean;
  creada_en?: string;
};

type PartidaInsert = {
  id?: string;
  estado?: EstadoPartida;
  pregunta_actual_id?: string | null;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  creada_en?: string;
};

export interface Database {
  public: {
    Tables: {
      partidas: {
        Row: Partida;
        Insert: PartidaInsert;
        Update: Partial<Partida>;
      };
      jugadores: {
        Row: Jugador;
        Insert: JugadorInsert;
        Update: Partial<Jugador>;
      };
      preguntas: {
        Row: Pregunta;
        Insert: PreguntaInsert;
        Update: Partial<Pregunta>;
      };
      respuestas: {
        Row: Respuesta;
        Insert: RespuestaInsert;
        Update: Partial<Respuesta>;
      };
    };
    Views: {
      preguntas_publicas: { Row: PreguntaPublica };
    };
    Functions: {
      avanzar_a_pregunta_aleatoria: {
        Args: { p_partida_id: string };
        Returns: string;
      };
      registrar_respuesta_correcta: {
        Args: { p_respuesta_id: string };
        Returns: void;
      };
      registrar_respuesta_incorrecta: {
        Args: { p_respuesta_id: string };
        Returns: void;
      };
      finalizar_partida: {
        Args: { p_partida_id: string };
        Returns: void;
      };
      reiniciar_partida: {
        Args: Record<string, never>;
        Returns: string;
      };
    };
  };
}
