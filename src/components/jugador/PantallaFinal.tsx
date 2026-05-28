import { Tarjeta } from "@/components/shared/Tarjeta";
import { Avatar } from "@/components/shared/Avatar";
import { Boton } from "@/components/shared/Boton";
import { TablaPuntajes } from "@/components/shared/TablaPuntajes";
import type { Jugador } from "@/types/database";
import { ordinal } from "@/lib/utils";

interface Props {
  yo: Jugador;
  jugadores: Jugador[];
  onSalir: () => void;
}

export function PantallaFinal({ yo, jugadores, onSalir }: Props) {
  const top3 = jugadores.slice(0, 3);
  const miPosicion = jugadores.findIndex((j) => j.id === yo.id) + 1;

  return (
    <div className="space-y-6">
      <Tarjeta className="text-center space-y-4">
        <h2 className="font-display text-3xl text-marca-rojo">¡Fin del juego! 🎉</h2>
        <p className="font-display text-xl">Estos son los ganadores:</p>

        <ul className="flex justify-center items-end gap-4 py-4">
          {top3.map((j, i) => {
            const medalla = i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉";
            const alturas = ["h-40", "h-28", "h-24"];
            return (
              <li key={j.id} className="flex flex-col items-center gap-1">
                <Avatar avatarId={j.avatar} tamano={i === 0 ? "xl" : "lg"} />
                <span className="text-3xl">{medalla}</span>
                <div
                  className={`w-24 ${alturas[i]} bg-marca-amarillo rounded-t-2xl shadow-inner flex flex-col items-center justify-end pb-2`}
                >
                  <span className="font-display font-bold">{j.nombre}</span>
                  <span className="text-marca-rojo font-bold">{j.puntos} pts</span>
                </div>
              </li>
            );
          })}
        </ul>

        <p className="font-display text-lg">
          Tu posición: <strong>{ordinal(miPosicion)}</strong> con{" "}
          <strong>{yo.puntos}</strong> puntos
        </p>
      </Tarjeta>

      <Tarjeta>
        <h3 className="font-display text-xl text-center mb-3">Tabla final</h3>
        <TablaPuntajes jugadores={jugadores} destacarId={yo.id} />
      </Tarjeta>

      <Boton variante="neutro" tamano="lg" className="w-full" onClick={onSalir}>
        Salir
      </Boton>
    </div>
  );
}
