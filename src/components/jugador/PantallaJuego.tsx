import { useEffect, useRef, useState } from "react";
import { Tarjeta } from "@/components/shared/Tarjeta";
import { Avatar } from "@/components/shared/Avatar";
import { TablaPuntajes } from "@/components/shared/TablaPuntajes";
import { useResponder } from "@/hooks/useAcciones";
import { usePreguntaPublica } from "@/hooks/usePreguntaActual";
import { useRespuestas } from "@/hooks/useRespuestas";
import { useSonidos } from "@/hooks/useSonidos";
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
  const { reproducir, reproducirSecuencia } = useSonidos();
  const [yaPulse, setYaPulse] = useState(false);

  // Para que los jugadores TAMBIÉN escuchen los sonidos de acierto/error cuando
  // la profesora marca una respuesta. Recordamos qué respuestas ya sonaron para
  // no repetir; en el primer render solo "marcamos" las ya resueltas (sin sonar).
  const sonadas = useRef<Set<string>>(new Set());
  const sonidoListo = useRef(false);
  useEffect(() => {
    for (const r of respuestas) {
      if (r.resultado !== "correcto" && r.resultado !== "incorrecto") continue;
      if (sonadas.current.has(r.id)) continue;
      sonadas.current.add(r.id);
      if (sonidoListo.current) {
        reproducirSecuencia(
          r.resultado === "correcto"
            ? ["acertado", "risa_acertada"]
            : ["fallado", "pregunta_fallada"]
        );
      }
    }
    sonidoListo.current = true;
  }, [respuestas, reproducirSecuencia]);
  // Cuenta atrás (3..1) al aparecer cada pregunta; 0 = pregunta visible.
  const [cuenta, setCuenta] = useState(0);
  const preguntaId = partida.pregunta_actual_id;

  // Cada vez que cambia la pregunta: rearmamos el botón y lanzamos la cuenta
  // atrás de 3 segundos para dar tiempo a pensar antes de poder responder.
  useEffect(() => {
    setYaPulse(false);
    if (!preguntaId) {
      setCuenta(0);
      return;
    }
    setCuenta(3);
    let n = 3;
    const id = setInterval(() => {
      n -= 1;
      setCuenta(n);
      if (n <= 0) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [preguntaId]);

  // Tic en cada número de la cuenta atrás.
  useEffect(() => {
    if (cuenta > 0) reproducir("clic");
  }, [cuenta, reproducir]);

  const enCuenta = cuenta > 0;
  const miRespuesta = respuestas.find((r) => r.jugador_id === yo.id);
  const bloqueado = yaPulse || !!miRespuesta;
  const ordenEnLista = miRespuesta?.orden_respuesta;

  const onResponder = () => {
    if (enCuenta || bloqueado || !partida.pregunta_actual_id) return;
    reproducir("seleccion"); // ¡buzzer!
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

        {enCuenta ? (
          <div className="py-6 flex flex-col items-center gap-3 min-h-[16rem] justify-center">
            <p className="font-display text-2xl md:text-3xl">¡Prepárate! 🤔</p>
            <div
              key={cuenta}
              className="animate-pop font-display font-extrabold text-7xl md:text-8xl text-marca-rojo drop-shadow"
            >
              {cuenta}
            </div>
            <p className="text-gray-600 font-bold">La pregunta aparece en…</p>
          </div>
        ) : (
          <>
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
                  : "bg-simpson-naranja hover:brightness-105 animate-latido"
              )}
            >
              {bloqueado ? (
                ordenEnLista ? `¡${ordinal(ordenEnLista)}!` : "¡Esperando turno!"
              ) : (
                "¡Responder!"
              )}
            </button>
          </>
        )}

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
