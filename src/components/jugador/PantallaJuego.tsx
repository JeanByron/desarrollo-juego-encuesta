import { useEffect, useState } from "react";
import { Tarjeta } from "@/components/shared/Tarjeta";
import { Avatar } from "@/components/shared/Avatar";
import { TablaPuntajes } from "@/components/shared/TablaPuntajes";
import { useResponder } from "@/hooks/useAcciones";
import { usePreguntaPublica } from "@/hooks/usePreguntaActual";
import { useRespuestas } from "@/hooks/useRespuestas";
import type { Jugador, Partida } from "@/types/database";
import { cn, ordinal } from "@/lib/utils";

interface Props {
  partida: Partida;
  yo: Jugador;
  jugadores: Jugador[];
}

export function PantallaJuego({ partida, yo, jugadores }: Props) {
  const { data: pregunta } = usePreguntaPublica(partida.pregunta_actual_id);
  const { data: respuestas = [] } = useRespuestas(partida.id, partida.pregunta_actual_id);
  const responder = useResponder();
  const [yaPulse, setYaPulse] = useState(false);

  // Cada vez que cambia la pregunta, se "rearma" el botón.
  useEffect(() => {
    setYaPulse(false);
  }, [partida.pregunta_actual_id]);

  const miRespuesta = respuestas.find((r) => r.jugador_id === yo.id);
  const bloqueado = yaPulse || !!miRespuesta;
  const ordenEnLista = miRespuesta?.orden_respuesta;

  const onResponder = () => {
    if (bloqueado || !partida.pregunta_actual_id) return;
    setYaPulse(true); // optimista: bloqueo el botón al instante
    responder.mutate(
      {
        partidaId: partida.id,
        preguntaId: partida.pregunta_actual_id,
        jugadorId: yo.id
      },
      {
        onError: () => setYaPulse(false)
      }
    );
  };

  return (
    <div className="space-y-6">
      <Tarjeta className="space-y-6 text-center">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar avatarId={yo.avatar} tamano="md" />
            <div className="text-left">
              <p className="font-display font-bold text-lg">{yo.nombre}</p>
              <p className="text-sm text-gray-600">{yo.puntos} pts</p>
            </div>
          </div>
          {pregunta && (
            <span className="rounded-full bg-marca-azul text-white px-3 py-1 text-xs font-bold uppercase tracking-wide">
              {pregunta.categoria}
            </span>
          )}
        </header>

        <p className="font-display text-2xl md:text-4xl leading-tight min-h-[6rem]">
          {pregunta?.pregunta ?? "Esperando pregunta..."}
        </p>

        <button
          type="button"
          onClick={onResponder}
          disabled={bloqueado || !partida.pregunta_actual_id}
          className={cn(
            "boton-gigante",
            bloqueado
              ? "bg-marca-verde cursor-not-allowed"
              : "bg-marca-rojo hover:bg-red-600 animate-latido"
          )}
        >
          {bloqueado ? (
            ordenEnLista ? `¡${ordinal(ordenEnLista)}!` : "¡Esperando turno!"
          ) : (
            "¡Responder!"
          )}
        </button>

        {respuestas.length > 0 && (
          <div className="text-left">
            <p className="font-display text-lg mb-1">Orden de respuesta:</p>
            <ol className="space-y-1">
              {respuestas.slice(0, 6).map((r, idx) => {
                const j = jugadores.find((x) => x.id === r.jugador_id);
                if (!j) return null;
                return (
                  <li
                    key={r.id}
                    className={cn(
                      "flex items-center gap-2 rounded-xl px-3 py-1",
                      r.jugador_id === yo.id ? "bg-marca-amarillo" : "bg-white/70"
                    )}
                  >
                    <span className="font-display font-bold w-8">{ordinal(idx + 1)}</span>
                    <Avatar avatarId={j.avatar} tamano="sm" />
                    <span className="font-bold">{j.nombre}</span>
                  </li>
                );
              })}
            </ol>
          </div>
        )}
      </Tarjeta>

      <Tarjeta>
        <h3 className="font-display text-xl text-center mb-3">Tabla de puntajes</h3>
        <TablaPuntajes jugadores={jugadores} destacarId={yo.id} compacta />
      </Tarjeta>
    </div>
  );
}
