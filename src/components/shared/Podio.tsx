import { Avatar } from "@/components/shared/Avatar";
import { cn } from "@/lib/utils";
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

export function Podio({ jugadores, destacarId }: Props) {
  // Ordenamos por puntos (defensivo, por si llegan sin ordenar).
  const top3 = [...jugadores].sort((a, b) => b.puntos - a.puntos).slice(0, 3);
  if (top3.length === 0) {
    return (
      <p className="text-center text-gray-500 italic py-6">Sin jugadores.</p>
    );
  }

  // Columnas en orden visual, descartando puestos vacíos (menos de 3 jugadores).
  const columnas = ORDEN_VISUAL.map((puesto) => ({ puesto, jugador: top3[puesto] })).filter(
    (c) => !!c.jugador
  );

  return (
    <ul className="flex justify-center items-end gap-2 sm:gap-4 py-2">
      {columnas.map(({ puesto, jugador }) => {
        const est = ESTILO[puesto];
        const yo = destacarId === jugador.id;
        return (
          <li key={jugador.id} className="flex flex-col items-center gap-1 animate-pop">
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
