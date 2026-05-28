import { Tarjeta } from "@/components/shared/Tarjeta";
import { Avatar } from "@/components/shared/Avatar";
import type { Jugador } from "@/types/database";

interface Props {
  yo: Jugador;
  jugadores: Jugador[];
}

export function PantallaEspera({ yo, jugadores }: Props) {
  return (
    <Tarjeta className="space-y-6 text-center">
      <Avatar avatarId={yo.avatar} tamano="xl" className="mx-auto animate-bote" />
      <h2 className="font-display text-3xl text-marca-rojo">{yo.nombre}</h2>
      <p className="font-display text-xl text-gray-700">
        Esperando que la profesora inicie la partida...
      </p>
      <div className="flex justify-center gap-2 text-4xl" aria-hidden>
        <span className="animate-bote">🎈</span>
        <span className="animate-bote [animation-delay:.15s]">🎉</span>
        <span className="animate-bote [animation-delay:.3s]">🎈</span>
      </div>

      <div className="text-left">
        <p className="font-display text-lg mb-2">
          Ya estamos {jugadores.length} jugando:
        </p>
        <ul className="flex flex-wrap gap-2">
          {jugadores.map((j) => (
            <li
              key={j.id}
              className="flex items-center gap-2 bg-white rounded-full px-3 py-1 shadow"
            >
              <Avatar avatarId={j.avatar} tamano="sm" />
              <span className="font-bold text-sm">{j.nombre}</span>
            </li>
          ))}
        </ul>
      </div>
    </Tarjeta>
  );
}
