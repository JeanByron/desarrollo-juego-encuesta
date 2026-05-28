import { useMemo } from "react";
import { Tarjeta } from "@/components/shared/Tarjeta";
import { Boton } from "@/components/shared/Boton";
import { Avatar } from "@/components/shared/Avatar";
import { TablaPuntajes } from "@/components/shared/TablaPuntajes";
import { ordinal } from "@/lib/utils";
import { useSonidos } from "@/hooks/useSonidos";
import { usePreguntaCompleta } from "@/hooks/usePreguntaActual";
import { useRespuestas } from "@/hooks/useRespuestas";
import {
  useAvanzarPregunta,
  useFinalizarPartida,
  useMarcarCorrecta,
  useMarcarIncorrecta
} from "@/hooks/useAcciones";
import type { Jugador, Partida, Respuesta } from "@/types/database";

interface Props {
  partida: Partida;
  jugadores: Jugador[];
}

export function PanelJuego({ partida, jugadores }: Props) {
  const { data: pregunta } = usePreguntaCompleta(partida.pregunta_actual_id);
  const { data: respuestas = [] } = useRespuestas(partida.id, partida.pregunta_actual_id);
  const avanzar = useAvanzarPregunta();
  const correcta = useMarcarCorrecta();
  const incorrecta = useMarcarIncorrecta();
  const finalizar = useFinalizarPartida();
  const { reproducir } = useSonidos();

  // El turno actual es la primera respuesta cuyo resultado siga 'pendiente'
  // (las marcadas como incorrectas se "saltan" y pasan al siguiente).
  const turnoActual: Respuesta | undefined = useMemo(
    () => respuestas.find((r) => r.resultado === "pendiente"),
    [respuestas]
  );

  const jugadorPorId = useMemo(
    () => Object.fromEntries(jugadores.map((j) => [j.id, j])),
    [jugadores]
  );

  const onCorrecta = () => {
    if (!turnoActual) return;
    correcta.mutate(turnoActual.id, {
      onSuccess: () => {
        reproducir("exito");
        // Cargar siguiente pregunta automáticamente
        avanzar.mutate(partida.id);
      }
    });
  };

  const onIncorrecta = () => {
    if (!turnoActual) return;
    incorrecta.mutate(turnoActual.id, {
      onSuccess: () => reproducir("pato")
    });
  };

  const onSiguiente = () => avanzar.mutate(partida.id);
  const onFin = () => finalizar.mutate(partida.id);

  const jugadorEnTurno = turnoActual ? jugadorPorId[turnoActual.jugador_id] : null;

  return (
    <div className="space-y-6">
      <Tarjeta className="space-y-4">
        <header className="flex items-center justify-between gap-2">
          <span className="rounded-full bg-marca-azul text-white px-3 py-1 text-xs font-bold uppercase tracking-wide">
            {pregunta?.categoria ?? "—"}
          </span>
          <span className="text-xs text-gray-500">
            Nivel {pregunta?.nivel ?? "—"}
          </span>
        </header>

        <p className="font-display text-2xl md:text-3xl leading-tight">
          {pregunta?.pregunta ?? "Sin pregunta cargada"}
        </p>
        {pregunta?.respuesta && (
          <p className="text-sm bg-yellow-100 rounded-xl p-3 italic">
            <strong>Respuesta sugerida:</strong> {pregunta.respuesta}
          </p>
        )}

        <div className="flex flex-wrap gap-2 justify-end">
          <Boton variante="neutro" onClick={onSiguiente} disabled={avanzar.isPending}>
            ⏭ Saltar pregunta
          </Boton>
          <Boton variante="peligro" onClick={onFin} disabled={finalizar.isPending}>
            🛑 Finalizar juego
          </Boton>
        </div>
      </Tarjeta>

      <Tarjeta className="space-y-4">
        <h3 className="font-display text-xl">Turno actual</h3>
        {jugadorEnTurno ? (
          <div className="flex items-center gap-4 bg-marca-amarillo rounded-2xl p-4 animate-entrada">
            <Avatar avatarId={jugadorEnTurno.avatar} tamano="lg" />
            <div className="flex-1">
              <p className="font-display text-2xl">{jugadorEnTurno.nombre}</p>
              <p className="text-sm text-gray-700">
                Respondió en {ordinal(turnoActual!.orden_respuesta)} lugar
              </p>
            </div>
            <div className="flex gap-2">
              <Boton
                variante="exito"
                tamano="xl"
                onClick={onCorrecta}
                disabled={correcta.isPending}
                title="Correcto"
              >
                ✔
              </Boton>
              <Boton
                variante="peligro"
                tamano="xl"
                onClick={onIncorrecta}
                disabled={incorrecta.isPending}
                title="Incorrecto"
              >
                ✖
              </Boton>
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-500 italic py-4">
            Nadie ha pulsado el botón aún. Lee la pregunta y espera.
          </p>
        )}

        <div>
          <p className="font-display text-lg mb-2">Orden de llegada</p>
          {respuestas.length === 0 ? (
            <p className="text-sm text-gray-500 italic">Sin respuestas todavía.</p>
          ) : (
            <ol className="space-y-1">
              {respuestas.map((r, idx) => {
                const j = jugadorPorId[r.jugador_id];
                if (!j) return null;
                const color =
                  r.resultado === "correcto"
                    ? "bg-green-100"
                    : r.resultado === "incorrecto"
                    ? "bg-red-100 line-through opacity-60"
                    : r.id === turnoActual?.id
                    ? "bg-marca-amarillo"
                    : "bg-white";
                return (
                  <li
                    key={r.id}
                    className={`flex items-center gap-2 rounded-xl px-3 py-1 ${color}`}
                  >
                    <span className="font-display font-bold w-8">{ordinal(idx + 1)}</span>
                    <Avatar avatarId={j.avatar} tamano="sm" />
                    <span className="font-bold flex-1 truncate">{j.nombre}</span>
                    <span className="text-xs uppercase">{r.resultado}</span>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </Tarjeta>

      <Tarjeta>
        <h3 className="font-display text-xl mb-3">Puntajes en vivo</h3>
        <TablaPuntajes jugadores={jugadores} compacta />
      </Tarjeta>
    </div>
  );
}
