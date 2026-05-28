import { Avatar } from "./Avatar";
import { ordinal } from "@/lib/utils";
import type { Jugador } from "@/types/database";

interface Props {
  jugadores: Jugador[];
  destacarId?: string | null;
  compacta?: boolean;
}

export function TablaPuntajes({ jugadores, destacarId, compacta }: Props) {
  if (jugadores.length === 0) {
    return (
      <p className="text-center text-gray-500 italic py-6">
        Aún no hay jugadores en la partida.
      </p>
    );
  }

  return (
    <ol className="space-y-2">
      {jugadores.map((j, idx) => {
        const yo = destacarId === j.id;
        return (
          <li
            key={j.id}
            className={[
              "flex items-center gap-3 rounded-2xl px-4 py-2 shadow-sm transition-all",
              yo ? "bg-marca-amarillo ring-4 ring-yellow-300 scale-[1.02]" : "bg-white/80",
              compacta ? "text-sm" : "text-base"
            ].join(" ")}
          >
            <span className="font-display font-bold text-lg w-14 shrink-0">
              {ordinal(idx + 1)}
            </span>
            <Avatar avatarId={j.avatar} tamano={compacta ? "sm" : "md"} />
            <span className="font-bold flex-1 truncate">{j.nombre}</span>
            <span className="font-display font-bold text-marca-rojo text-xl">
              {j.puntos} pts
            </span>
          </li>
        );
      })}
    </ol>
  );
}
