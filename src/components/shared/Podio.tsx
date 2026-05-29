import { useEffect, useState } from "react";
import { Avatar } from "@/components/shared/Avatar";
import { cn } from "@/lib/utils";
import { useSonidos } from "@/hooks/useSonidos";
import type { Jugador } from "@/types/database";

interface Props {
  jugadores: Jugador[]; // ya ordenados de mayor a menor puntaje
  destacarId?: string | null;
}

// Estilo por puesto REAL (0 = 1º, 1 = 2º, 2 = 3º): medalla, bloque y altura.
const ESTILO = [
  { medalla: "🥇", bloque: "bg-gradient-to-b from-amber-300 to-yellow-500", alto: "h-32 sm:h-40", avatar: "xl" as const },
  { medalla: "🥈", bloque: "bg-gradient-to-b from-slate-200 to-slate-400", alto: "h-24 sm:h-28", avatar: "lg" as const },
  { medalla: "🥉", bloque: "bg-gradient-to-b from-orange-300 to-orange-500", alto: "h-20 sm:h-24", avatar: "lg" as const }
];

// Mapea el puesto real (0,1,2) a su columna visual (1º al centro): [2º, 1º, 3º].
const ORDEN_VISUAL = [1, 0, 2];

// Orden de aparición: primero el 3º, luego el 2º y por último el 1º.
const ORDEN_REVELADO = [2, 1, 0];

export function Podio({ jugadores, destacarId }: Props) {
  // Ordenamos por puntos (defensivo, por si llegan sin ordenar).
  const top3 = [...jugadores].sort((a, b) => b.puntos - a.puntos).slice(0, 3);
  const { reproducir } = useSonidos();

  // Cuántos puestos se han revelado ya (0..3).
  const [revelados, setRevelados] = useState(0);
  const claveTop3 = top3.map((j) => j.id).join(",");

  useEffect(() => {
    if (top3.length === 0) return;
    setRevelados(0);
    let n = 0;
    // Pequeña pausa inicial y luego un puesto por segundo (3º, 2º, 1º).
    const id = setInterval(() => {
      n += 1;
      setRevelados(n);
      reproducir(n >= 3 ? "exito" : "seleccion");
      if (n >= 3) clearInterval(id);
    }, 900);
    return () => clearInterval(id);
    // Reinicia si cambian los jugadores del top 3.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claveTop3]);

  if (top3.length === 0) {
    return <p className="text-center text-gray-500 italic py-6">Sin jugadores.</p>;
  }

  // ¿El puesto p ya fue revelado? (según el orden 3º→2º→1º)
  const visible = (puesto: number) => ORDEN_REVELADO.indexOf(puesto) < revelados;

  // Columnas en orden visual, descartando puestos vacíos (menos de 3 jugadores).
  const columnas = ORDEN_VISUAL.map((puesto) => ({ puesto, jugador: top3[puesto] })).filter(
    (c) => !!c.jugador
  );

  return (
    <ul className="flex justify-center items-end gap-2 sm:gap-4 py-2">
      {columnas.map(({ puesto, jugador }) => {
        const est = ESTILO[puesto];
        const yo = destacarId === jugador.id;
        const mostrar = visible(puesto);
        return (
          <li
            key={jugador.id}
            // Mantiene su espacio reservado siempre (no salta el podio); solo
            // aparece cuando llega su turno en la secuencia.
            className={cn(
              "flex flex-col items-center gap-1",
              mostrar ? "animate-pop" : "opacity-0"
            )}
          >
            <Avatar avatarId={jugador.avatar} tamano={est.avatar} flotando={puesto === 0} />
            <span className="text-3xl sm:text-4xl leading-none">{est.medalla}</span>
            <div
              className={cn(
                "w-20 sm:w-28 rounded-t-2xl shadow-inner flex flex-col items-center justify-end pb-3 px-1",
                est.alto,
                est.bloque,
                yo && "ring-4 ring-marca-rojo"
              )}
            >
              <span className="font-display font-extrabold text-simpson-tinta text-sm sm:text-base text-center leading-snug w-full break-words">
                {jugador.nombre}
              </span>
              <span className="font-display font-bold text-simpson-tinta/80 text-sm">
                {jugador.puntos} pts
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
