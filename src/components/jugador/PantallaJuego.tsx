import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Tarjeta } from "@/components/shared/Tarjeta";
import { Avatar } from "@/components/shared/Avatar";
import { TablaPuntajes } from "@/components/shared/TablaPuntajes";
import { useResponder } from "@/hooks/useAcciones";
import { usePreguntaPublica } from "@/hooks/usePreguntaActual";
import { useRespuestas } from "@/hooks/useRespuestas";
import { useSonidos } from "@/hooks/useSonidos";
import { ResultadoOverlay, type ResultadoVisual } from "@/components/shared/ResultadoOverlay";
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

  // Estado para el overlay visual de resultado (funciona con o sin sonido).
  const [resultadoVisual, setResultadoVisual] = useState<ResultadoVisual>(null);
  const limpiarOverlay = useCallback(() => setResultadoVisual(null), []);

  // IDs de respuestas cuyo resultado ya fue procesado (visual + sonido).
  // Se reinicia con cada pregunta nueva para no arrastrar IDs de la anterior.
  const procesadasRef = useRef<Set<string>>(new Set());
  // Cuando llega la primera carga de datos, inicializamos el set con los
  // resultados ya existentes (correcto/incorrecto) SIN reproducirlos: así
  // evitamos que un jugador que abre la página a mitad de partida vea overlays
  // de respuestas antiguas que ya no le corresponden.
  const inicializadoRef = useRef(false);

  // Reiniciar al cambiar de pregunta.
  const preguntaId = partida.pregunta_actual_id;
  useEffect(() => {
    procesadasRef.current = new Set();
    inicializadoRef.current = false;
  }, [preguntaId]);

  // Contador "el siguiente en responder es…" que aparece cuando la profesora
  // marca una respuesta como incorrecta.
  const [siguienteJugador, setSiguienteJugador] = useState<Jugador | null>(null);
  const [cuentaSiguiente, setCuentaSiguiente] = useState(0);

  useEffect(() => {
    // Primera carga: marcar resultados existentes como ya vistos (sin mostrarlos).
    if (!inicializadoRef.current) {
      for (const r of respuestas) {
        if (r.resultado === "correcto" || r.resultado === "incorrecto") {
          procesadasRef.current.add(r.id);
        }
      }
      inicializadoRef.current = true;
      return;
    }

    // Cargas siguientes: solo procesar los resultados que son nuevos.
    for (const r of respuestas) {
      if (r.resultado !== "correcto" && r.resultado !== "incorrecto") continue;
      if (procesadasRef.current.has(r.id)) continue;
      procesadasRef.current.add(r.id);

      // Overlay visual: solo al jugador cuya respuesta fue marcada.
      if (r.jugador_id === yo.id) {
        setResultadoVisual(r.resultado === "correcto" ? "correcto" : "incorrecto");
      }

      // Sonido: todos los dispositivos (respeta su propio mute).
      reproducirSecuencia(
        r.resultado === "correcto"
          ? ["acertado", "risa_acertada"]
          : ["fallado", "pregunta_fallada"]
      );

      // Si es incorrecto, mostrar el contador del siguiente jugador.
      if (r.resultado === "incorrecto") {
        const siguiente = respuestas.find(
          (x) => x.resultado === "pendiente" && x.id !== r.id
        );
        const jugSiguiente = siguiente
          ? jugadores.find((j) => j.id === siguiente.jugador_id) ?? null
          : null;
        if (jugSiguiente) {
          setSiguienteJugador(jugSiguiente);
          setCuentaSiguiente(3);
        }
      }
    }
  }, [respuestas, jugadores, reproducirSecuencia, yo.id]);

  // Jugador cuyo turno está activo ahora (primera respuesta aún pendiente).
  const turnoActual = useMemo(
    () => respuestas.find((r) => r.resultado === "pendiente"),
    [respuestas]
  );
  const jugadorEnTurno = turnoActual
    ? jugadores.find((j) => j.id === turnoActual.jugador_id) ?? null
    : null;
  const esMiTurno = turnoActual?.jugador_id === yo.id;

  // Cuenta regresiva del "siguiente jugador".
  useEffect(() => {
    if (cuentaSiguiente <= 0) return;
    const id = setInterval(() => {
      setCuentaSiguiente((n) => {
        if (n <= 1) {
          clearInterval(id);
          setSiguienteJugador(null);
          return 0;
        }
        return n - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [cuentaSiguiente]);
  // Cuenta atrás (3..1) al aparecer cada pregunta; 0 = pregunta visible.
  const [cuenta, setCuenta] = useState(0);

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
      <ResultadoOverlay resultado={resultadoVisual} onTerminado={limpiarOverlay} />
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

        {/* Banner "el siguiente en responder es…" cuando la profesora marca X */}
        {siguienteJugador && cuentaSiguiente > 0 && (
          <div className="flex flex-col items-center gap-2 py-4 animate-pop">
            <p className="font-display text-xl text-gray-700">El siguiente en responder es:</p>
            <div className="flex items-center gap-3">
              <Avatar avatarId={siguienteJugador.avatar} tamano="md" />
              <span className="font-display font-extrabold text-2xl text-marca-rojo">
                {siguienteJugador.nombre}
              </span>
            </div>
            <div
              key={cuentaSiguiente}
              className="animate-pop font-display font-extrabold text-5xl text-simpson-naranja drop-shadow"
            >
              {cuentaSiguiente}
            </div>
          </div>
        )}

        {/* La pregunta se ve de inmediato; el botón tiene un cooldown de 3 s
            (deshabilitado y mostrando la cuenta) para que nadie lo spamee antes
            de tiempo. Todos pueden responder a partir del mismo instante (fin
            del cooldown), así que la competencia sigue siendo justa. */}
        <p className="font-display text-2xl md:text-4xl leading-tight min-h-[6rem]">
          {pregunta?.pregunta ?? "Esperando pregunta..."}
        </p>

        {/* Banner de quién responde ahora (visible cuando la profesora evalúa) */}
        {jugadorEnTurno && !siguienteJugador && (
          <div
            className={cn(
              "flex items-center justify-center gap-3 rounded-2xl px-4 py-3 animate-pop",
              esMiTurno
                ? "bg-marca-amarillo border-2 border-simpson-naranja"
                : "bg-white/70"
            )}
          >
            {esMiTurno ? (
              <p className="font-display font-extrabold text-xl text-marca-rojo animate-latido">
                ✋ ¡Es tu turno de responder!
              </p>
            ) : (
              <>
                <Avatar avatarId={jugadorEnTurno.avatar} tamano="md" />
                <div className="text-left">
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wide">
                    Respondiendo ahora
                  </p>
                  <p className="font-display font-extrabold text-xl">
                    {jugadorEnTurno.nombre}
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={onResponder}
          disabled={enCuenta || bloqueado || !partida.pregunta_actual_id}
          className={cn(
            "boton-gigante",
            enCuenta
              ? "bg-gray-400 cursor-not-allowed"
              : bloqueado
              ? "bg-marca-verde cursor-not-allowed"
              : "bg-simpson-naranja hover:brightness-105 animate-latido"
          )}
        >
          {enCuenta ? (
            <span className="inline-flex items-center gap-3">
              <span className="text-xl md:text-2xl">⏳ Espera…</span>
              <span key={cuenta} className="animate-pop inline-block">
                {cuenta}
              </span>
            </span>
          ) : bloqueado ? (
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
